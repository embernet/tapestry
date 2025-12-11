
import { ToolRegistry } from '../types';

// --- Types ---

export type OpType = 
    | 'NOOP'
    | 'CALL'          // tool.action(arg=val)
    | 'SET'           // x = val
    | 'SET_CALL'      // x = tool.action(arg=val)
    | 'SLEEP'         // sleep(0.5)
    | 'JUMP'          // Unconditional jump (loop back or skip else)
    | 'JUMP_IF_FALSE' // if condition failure
    | 'ITER_INIT'     // Initialize a loop iterator
    | 'ITER_NEXT'     // Advance iterator or jump to end
    | 'PRINT';        // print()

export interface Op {
    type: OpType;
    line: number;
    indent: number;
    // CALL / SET_CALL
    toolId?: string;
    action?: string;
    args?: Record<string, string>;
    targetVar?: string;
    // SET
    expr?: string;
    // JUMP
    jumpTo?: number;
    // IF
    condition?: string;
    // ITER
    collection?: string;
    iterVar?: string;
    // SLEEP
    duration?: string;
}

export interface ScriptProgram {
    source: string;
    ops: Op[];
    error?: string;
}

export interface RuntimeContext {
    vars: Record<string, any>;
    toolRegistry: ToolRegistry;
    log: (msg: string) => void;
    highlightLine: (line: number) => void;
    
    // Internal state
    ip: number; // Instruction Pointer
    iterators: Record<string, { index: number; items: any[] }>; // Loop states
    status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
    sleep: (ms: number) => Promise<void>;
}

// --- Parser ---

export class ScriptParser {
    static parse(source: string): ScriptProgram {
        const lines = source.split('\n');
        const ops: Op[] = [];
        
        // Stack to track blocks: { type, startOpIndex, indentLevel }
        const blockStack: { type: 'if' | 'for' | 'else', index: number, indent: number }[] = [];

        try {
            for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                const rawLine = lines[lineIdx];
                const trimmedLine = rawLine.trim();
                const lineNum = lineIdx + 1;

                if (!trimmedLine || trimmedLine.startsWith('#')) {
                    ops.push({ type: 'NOOP', line: lineNum, indent: 0 });
                    continue;
                }

                // Count leading spaces
                const leadingSpaces = rawLine.match(/^\s*/)?.[0].length || 0;
                let lastClosedBlock = null;

                // --- Block Closing Logic ---
                while (blockStack.length > 0) {
                    const top = blockStack[blockStack.length - 1];
                    if (leadingSpaces <= top.indent) {
                        const block = blockStack.pop()!;
                        lastClosedBlock = block;
                        
                        if (block.type === 'if') {
                            // IF block ends: default jump target is current line (skipping body)
                            ops[block.index].jumpTo = ops.length;
                        } else if (block.type === 'else') {
                            // ELSE block ends: unconditional jump from start of else points here
                            ops[block.index].jumpTo = ops.length;
                        } else if (block.type === 'for') {
                            // FOR block ends: jump back to iterator, set iterator exit jump to here
                            ops.push({ type: 'JUMP', jumpTo: block.index, line: lineNum, indent: top.indent });
                            ops[block.index].jumpTo = ops.length;
                        }
                    } else {
                        break;
                    }
                }

                // --- Parsing Logic ---

                // 0. ELSE statement: else:
                const elseMatch = trimmedLine.match(/^else\s*:\s*(#.*)?$/);
                if (elseMatch) {
                    if (lastClosedBlock && lastClosedBlock.type === 'if' && lastClosedBlock.indent === leadingSpaces) {
                        // 1. We just closed an IF block at the same indent.
                        // Insert a JUMP at the current position. This sits at the end of the IF 'true' block
                        // and lets execution skip the upcoming ELSE block.
                        ops.push({ type: 'JUMP', jumpTo: -1, line: lineNum, indent: leadingSpaces }); 
                        const skipElseJumpIdx = ops.length - 1;

                        // 2. Fix the IF's JUMP_IF_FALSE target.
                        // Previously, it pointed to `ops.length` (which is now the skipElseJump).
                        // We want it to point to the instruction *after* skipElseJump (start of else body).
                        if (ops[lastClosedBlock.index].jumpTo === skipElseJumpIdx) {
                            ops[lastClosedBlock.index].jumpTo = skipElseJumpIdx + 1;
                        }

                        // 3. Start ELSE block. Store index of the skipElseJump so we can resolve it 
                        // to the end of the else block when it closes.
                        blockStack.push({ type: 'else', index: skipElseJumpIdx, indent: leadingSpaces });
                        continue;
                    } else {
                        throw new Error(`Syntax error on line ${lineNum}: 'else' must follow an 'if' block at the same indentation.`);
                    }
                }

                // 1. print(...)
                if (trimmedLine.match(/^print\((.*)\)$/)) {
                    const match = trimmedLine.match(/^print\((.*)\)$/);
                    ops.push({ type: 'PRINT', expr: match![1], line: lineNum, indent: leadingSpaces });
                    continue;
                }

                // 2. sleep(...)
                if (trimmedLine.match(/^sleep\((.*)\)$/) || trimmedLine.match(/^time\.sleep\((.*)\)$/)) {
                    const match = trimmedLine.match(/(?:time\.)?sleep\((.*)\)/);
                    let durationExpr = match![1];
                    ops.push({ type: 'SLEEP', duration: durationExpr, line: lineNum, indent: leadingSpaces });
                    continue;
                }

                // 3. FOR loop: for var in collection:
                const forMatch = trimmedLine.match(/^for\s+(\w+)\s+in\s+(.+):$/);
                if (forMatch) {
                    ops.push({ 
                        type: 'ITER_INIT', 
                        iterVar: forMatch[1], 
                        collection: forMatch[2].trim(),
                        line: lineNum,
                        indent: leadingSpaces
                    });
                    
                    const checkIdx = ops.length;
                    ops.push({ 
                        type: 'ITER_NEXT', 
                        iterVar: forMatch[1], 
                        jumpTo: -1, 
                        line: lineNum,
                        indent: leadingSpaces
                    });
                    
                    blockStack.push({ type: 'for', index: checkIdx, indent: leadingSpaces });
                    continue;
                }

                // 4. IF statement: if condition:
                const ifMatch = trimmedLine.match(/^if\s+(.+):$/);
                if (ifMatch) {
                    ops.push({ 
                        type: 'JUMP_IF_FALSE', 
                        condition: ifMatch[1].trim(), 
                        jumpTo: -1, 
                        line: lineNum,
                        indent: leadingSpaces
                    });
                    blockStack.push({ type: 'if', index: ops.length - 1, indent: leadingSpaces });
                    continue;
                }

                // 5. Assignment
                // 5.1 Augmented Assignment: var += ...
                const augMatch = trimmedLine.match(/^(\w+)\s*\+=\s*(.+)$/);
                if (augMatch) {
                    ops.push({
                        type: 'SET',
                        targetVar: augMatch[1],
                        expr: `${augMatch[1]} + ${augMatch[2].trim()}`,
                        line: lineNum,
                        indent: leadingSpaces
                    });
                    continue;
                }

                // 5.2 Standard Assignment: var = ...
                const assignMatch = trimmedLine.match(/^(\w+)\s*=\s*(.+)$/);
                if (assignMatch) {
                    const varName = assignMatch[1];
                    const rhs = assignMatch[2].trim();
                    
                    const toolMatch = this.matchToolCall(rhs);
                    if (toolMatch) {
                        ops.push({
                            type: 'SET_CALL',
                            targetVar: varName,
                            toolId: toolMatch.toolId,
                            action: toolMatch.action,
                            args: this.parseArgs(toolMatch.argsStr),
                            line: lineNum,
                            indent: leadingSpaces
                        });
                    } else {
                        ops.push({
                            type: 'SET',
                            targetVar: varName,
                            expr: rhs,
                            line: lineNum,
                            indent: leadingSpaces
                        });
                    }
                    continue;
                }

                // 6. Standalone Tool Call: tool.action(...)
                const toolMatch = this.matchToolCall(trimmedLine);
                if (toolMatch) {
                    ops.push({
                        type: 'CALL',
                        toolId: toolMatch.toolId,
                        action: toolMatch.action,
                        args: this.parseArgs(toolMatch.argsStr),
                        line: lineNum,
                        indent: leadingSpaces
                    });
                    continue;
                }

                throw new Error(`Syntax error on line ${lineNum}: ${trimmedLine}`);
            }

            // Close any remaining blocks
            while (blockStack.length > 0) {
                const block = blockStack.pop()!;
                if (block.type === 'if') {
                    ops[block.index].jumpTo = ops.length;
                } else if (block.type === 'else') {
                    ops[block.index].jumpTo = ops.length;
                } else if (block.type === 'for') {
                    ops.push({ type: 'JUMP', jumpTo: block.index, line: lines.length, indent: block.indent });
                    ops[block.index].jumpTo = ops.length;
                }
            }

            return { source, ops };

        } catch (e: any) {
            return { source, ops: [], error: e.message };
        }
    }

    private static matchToolCall(str: string) {
        // Matches: toolId.actionName(args)
        const match = str.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\((.*)\)$/);
        if (match) {
            return { toolId: match[1], action: match[2], argsStr: match[3] || '' };
        }
        return null;
    }

    private static parseArgs(argsStr: string): Record<string, string> {
        const args: Record<string, string> = {};
        if (!argsStr || !argsStr.trim()) return args;
        
        let current = '';
        let inQuote = false;
        const parts = [];
        
        for (let i = 0; i < argsStr.length; i++) {
            const char = argsStr[i];
            if (char === '"' || char === "'") {
                inQuote = !inQuote;
                current += char;
            } else if (char === ',' && !inQuote) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        if (current.trim()) parts.push(current.trim());

        let posIndex = 0;
        parts.forEach(part => {
            const eqIndex = part.indexOf('=');
            // Check if it's a named argument (must have = and not be inside a quoted string)
            // Simple heuristic: if it looks like identifier=value
            if (eqIndex > 0 && /^[a-zA-Z_]\w*\s*=/.test(part)) {
                const key = part.substring(0, eqIndex).trim();
                const val = part.substring(eqIndex + 1).trim();
                args[key] = val;
            } else {
                // Positional argument, assign to index string "0", "1", etc.
                args[String(posIndex++)] = part;
            }
        });

        return args;
    }
}

// --- Runtime Engine ---

export class ScriptEngine {
    
    createContext(toolRegistry: ToolRegistry, callbacks: { 
        log: (m: string) => void, 
        highlightLine: (l: number) => void 
    }): RuntimeContext {
        return {
            vars: {},
            toolRegistry,
            log: callbacks.log,
            highlightLine: callbacks.highlightLine,
            ip: 0,
            iterators: {},
            status: 'idle',
            sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
        };
    }

    private splitExpression(expr: string, operator: string): string[] {
        const parts: string[] = [];
        let current = "";
        let inQuote = false;
        let quoteChar = "";
        
        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            if (inQuote) {
                if (char === quoteChar && expr[i-1] !== '\\') inQuote = false;
                current += char;
            } else {
                if (char === '"' || char === "'") {
                    inQuote = true;
                    quoteChar = char;
                    current += char;
                } else if (expr.substr(i, operator.length) === operator) {
                     parts.push(current);
                     current = "";
                     i += operator.length - 1;
                } else {
                    current += char;
                }
            }
        }
        parts.push(current);
        return parts;
    }

    evaluate(expr: string, ctx: RuntimeContext): any {
        expr = expr.trim();
        if (!expr) return null;

        // 0. Membership 'in'
        const inParts = this.splitExpression(expr, ' in ');
        if (inParts.length > 1) {
            const needle = this.evaluate(inParts[0].trim(), ctx);
            const haystack = this.evaluate(inParts[1].trim(), ctx);
            if (Array.isArray(haystack)) {
                return haystack.includes(needle);
            }
            if (typeof haystack === 'string') {
                return haystack.includes(needle);
            }
            return false;
        }
        
        // 1. Comparison Operators
        const ops = ['==', '!=', '>=', '<=', '>', '<'];
        for (const op of ops) {
            const parts = this.splitExpression(expr, ` ${op} `);
            if (parts.length > 1) {
                const left = this.evaluate(parts[0].trim(), ctx);
                const right = this.evaluate(parts[1].trim(), ctx);
                switch (op) {
                    case '==': return left == right;
                    case '!=': return left != right;
                    case '>': return left > right;
                    case '<': return left < right;
                    case '>=': return left >= right;
                    case '<=': return left <= right;
                }
            }
        }

        // 2. Addition / Concatenation (+)
        const plusParts = this.splitExpression(expr, '+');
        if (plusParts.length > 1) {
            let result: any = this.evaluate(plusParts[0].trim(), ctx);
            for (let i = 1; i < plusParts.length; i++) {
                const nextVal = this.evaluate(plusParts[i].trim(), ctx);
                if (typeof result === 'string' || typeof nextVal === 'string') {
                    result = String(result ?? '') + String(nextVal ?? '');
                } else {
                    result = (result || 0) + (nextVal || 0);
                }
            }
            return result;
        }

        // 3. String Literal
        if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
            return expr.slice(1, -1)
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"');
        }

        // 4. List Literal (e.g. ["a", "b"] or [])
        if (expr.startsWith('[') && expr.endsWith(']')) {
            const content = expr.slice(1, -1).trim();
            if (!content) return [];
            
            const items = [];
            let current = '';
            let inQuote = false;
            let bracketDepth = 0;
            
            for (let i = 0; i < content.length; i++) {
                const char = content[i];
                if (char === '"' || char === "'") {
                    inQuote = !inQuote;
                } else if (char === '[' && !inQuote) {
                    bracketDepth++;
                } else if (char === ']' && !inQuote) {
                    bracketDepth--;
                }
                
                if (char === ',' && !inQuote && bracketDepth === 0) {
                    items.push(this.evaluate(current.trim(), ctx));
                    current = '';
                } else {
                    current += char;
                }
            }
            if (current.trim()) {
                items.push(this.evaluate(current.trim(), ctx));
            }
            return items;
        }
        
        // 5. Primitives & Vars
        // Use strict regex for numbers to avoid empty arrays [] being parsed as 0 by Number()
        if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
        if (expr === 'True' || expr === 'true') return true;
        if (expr === 'False' || expr === 'false') return false;
        if (expr === 'None' || expr === 'null') return null;

        return this.resolveVar(expr, ctx);
    }

    resolveVar(path: string, ctx: RuntimeContext): any {
        const parts = path.split('.');
        let val = ctx.vars[parts[0]];
        if (val === undefined) return undefined; 
        
        for (let i = 1; i < parts.length; i++) {
            if (val === null || val === undefined) return undefined;
            val = val[parts[i]];
        }
        return val;
    }

    resolveArgs(rawArgs: Record<string, string>, ctx: RuntimeContext): any {
        const resolved: any = {};
        for (const [key, val] of Object.entries(rawArgs)) {
            resolved[key] = this.evaluate(val, ctx);
        }
        return resolved;
    }

    async step(program: ScriptProgram, ctx: RuntimeContext): Promise<void> {
        if (ctx.ip >= program.ops.length) {
            ctx.status = 'completed';
            return;
        }

        const op = program.ops[ctx.ip];
        ctx.highlightLine(op.line);

        try {
            switch (op.type) {
                case 'NOOP':
                    break;
                case 'PRINT':
                    if (op.expr) {
                        const val = this.evaluate(op.expr, ctx);
                        ctx.log(String(val));
                    }
                    break;
                case 'SLEEP':
                    if (op.duration) {
                        const val = this.evaluate(op.duration, ctx);
                        const ms = Number(val) * 1000;
                        if (!isNaN(ms) && ms > 0) await ctx.sleep(ms);
                    }
                    break;
                case 'SET':
                    if (op.targetVar && op.expr) {
                        ctx.vars[op.targetVar] = this.evaluate(op.expr, ctx);
                    }
                    break;
                case 'CALL':
                case 'SET_CALL':
                    if (op.toolId && op.action) {
                        let result: any = null;
                        let executed = false;

                        // 1. Try Tool Registry
                        const tool = ctx.toolRegistry.getTool(op.toolId);
                        if (tool) {
                            const args = this.resolveArgs(op.args || {}, ctx);
                            result = await tool.invoke(op.action, args);
                            executed = true;
                        } 
                        // 2. Try Variable Method Call
                        else {
                            const variable = ctx.vars[op.toolId];
                            if (variable !== undefined) {
                                const args = this.resolveArgs(op.args || {}, ctx);
                                
                                // Array Methods
                                if (Array.isArray(variable)) {
                                    if (op.action === 'append' && args['0'] !== undefined) {
                                        variable.push(args['0']);
                                        result = variable;
                                        executed = true;
                                    } else if (op.action === 'pop') {
                                        result = variable.pop();
                                        executed = true;
                                    } else if (op.action === 'remove' && args['0'] !== undefined) {
                                        const idx = variable.indexOf(args['0']);
                                        if (idx > -1) variable.splice(idx, 1);
                                        executed = true;
                                    } else if (op.action === 'clear') {
                                        variable.length = 0;
                                        executed = true;
                                    } else if (op.action === 'length') {
                                        result = variable.length;
                                        executed = true;
                                    }
                                }
                                // String Methods
                                else if (typeof variable === 'string') {
                                    if (op.action === 'split') {
                                        const sep = args['0'] || ' ';
                                        result = variable.split(sep);
                                        executed = true;
                                    } else if (op.action === 'replace' && args['0'] && args['1']) {
                                        result = variable.replace(args['0'], args['1']);
                                        executed = true;
                                    } else if (op.action === 'lower') {
                                        result = variable.toLowerCase();
                                        executed = true;
                                    } else if (op.action === 'upper') {
                                        result = variable.toUpperCase();
                                        executed = true;
                                    }
                                }
                            }
                        }

                        if (!executed) {
                             throw new Error(`Tool or variable method '${op.toolId}.${op.action}' not found`);
                        }
                        
                        if (op.type === 'SET_CALL' && op.targetVar) {
                            ctx.vars[op.targetVar] = result;
                        }
                    }
                    break;
                case 'JUMP':
                    if (op.jumpTo !== undefined) {
                        ctx.ip = op.jumpTo;
                        return;
                    }
                    break;
                case 'JUMP_IF_FALSE':
                    if (op.condition && op.jumpTo !== undefined) {
                        const res = this.evaluate(op.condition, ctx);
                        if (!res) {
                            ctx.ip = op.jumpTo;
                            return;
                        }
                    }
                    break;
                case 'ITER_INIT':
                    if (op.collection && op.iterVar) {
                        const col = this.evaluate(op.collection, ctx);
                        if (Array.isArray(col)) {
                            ctx.iterators[op.iterVar] = { index: 0, items: col };
                        } else {
                            throw new Error(`Variable '${op.collection}' is not iterable`);
                        }
                    }
                    break;
                case 'ITER_NEXT':
                    if (op.iterVar && op.jumpTo !== undefined) {
                        const iter = ctx.iterators[op.iterVar];
                        if (iter && iter.index < iter.items.length) {
                            ctx.vars[op.iterVar] = iter.items[iter.index];
                            iter.index++;
                        } else {
                            ctx.ip = op.jumpTo;
                            return;
                        }
                    }
                    break;
            }
        } catch (e: any) {
            ctx.status = 'error';
            ctx.log(`Error at line ${op.line}: ${e.message}`);
            throw e;
        }

        ctx.ip++;
    }
}
