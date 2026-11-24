// Request mapping for OpenAI-compatible chat completions: the Tapestry server's
// shared AI (`/api/ai/v1/chat/completions`, where the server adds its key) and
// users' own OpenAI / Grok / Anthropic / Ollama keys.
//
// Callers describe a request the provider-neutral way (services/aiSchema.ts):
// a prompt (string or Content[]), a system instruction, function declarations
// and a response schema. This module turns that into an OpenAI request body
// (structured output -> response_format json_schema, declarations -> tools,
// functionCall/functionResponse parts -> tool_calls / tool messages) and reads
// the reply back into { text, functionCalls }.
//
// Pure functions with no imports at run time, so test/ai-request.test.cjs can
// load this file directly.
import type { Content, FunctionCall, FunctionDeclaration, Schema } from './aiSchema';

export const SERVER_AI_BASE_URL = '/api/ai/v1';

const OPENAI_COMPATIBLE = new Set(['server', 'openai', 'anthropic', 'grok', 'ollama']);
// Providers known to honour response_format json_schema; others get json_object
// with the schema described in the system message.
const JSON_SCHEMA_PROVIDERS = new Set(['server', 'openai']);

export const isOpenAICompatible = (provider: string): boolean => OPENAI_COMPATIBLE.has(provider);

export interface ChatRequestInput {
    provider: string;
    modelId: string;
    apiKey?: string;
    baseUrl?: string;
    prompt: string | Content[];
    systemInstruction?: string;
    tools?: FunctionDeclaration[];
    responseSchema?: Schema;
}

// Gemini-style schema (upper-case type names, `nullable`) to JSON Schema.
export const toJsonSchema = (schema: any): any => {
    if (Array.isArray(schema)) return schema.map(toJsonSchema);
    if (!schema || typeof schema !== 'object') return schema;
    const out: any = {};
    for (const [k, v] of Object.entries(schema)) {
        if (k === 'nullable' || k === 'propertyOrdering') continue;
        if (k === 'format' && v === 'enum') continue;
        if (k === 'type' && typeof v === 'string') out.type = v.toLowerCase();
        else if (k === 'properties' && v && typeof v === 'object') {
            out.properties = Object.fromEntries(Object.entries(v as object).map(([p, s]) => [p, toJsonSchema(s)]));
        } else out[k] = toJsonSchema(v);
    }
    if (schema.nullable === true && typeof out.type === 'string') out.type = [out.type, 'null'];
    return out;
};

// Structured output must be a JSON object at the top level; a schema for an
// array (or a scalar) is wrapped as { result: ... } and unwrapped on the way back.
const WRAP_KEY = 'result';
const needsWrap = (schema: Schema | undefined): boolean =>
    Boolean(schema) && String(schema!.type || '').toUpperCase() !== 'OBJECT';

export function chatCompletionsEndpoint(config: { provider: string; apiKey?: string; baseUrl?: string }): { url: string; headers: Record<string, string> } {
    let baseUrl = config.provider === 'server' ? SERVER_AI_BASE_URL : config.baseUrl;
    if (!baseUrl) {
        if (config.provider === 'openai') baseUrl = 'https://api.openai.com/v1';
        else if (config.provider === 'anthropic') baseUrl = 'https://api.anthropic.com/v1';
        else if (config.provider === 'grok') baseUrl = 'https://api.x.ai/v1';
        else if (config.provider === 'ollama') baseUrl = 'http://localhost:11434/v1';
    }
    const url = `${String(baseUrl || '').replace(/\/+$/, '')}/chat/completions`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // The server provider never sends a key: the Tapestry server adds its own.
    if (config.provider !== 'server' && config.apiKey) {
        if (config.provider === 'anthropic') {
            headers['x-api-key'] = config.apiKey;
            headers['anthropic-version'] = '2023-06-01';
        } else {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }
    }
    return { url, headers };
}

export function toOpenAIMessages(prompt: string | Content[], systemText?: string): any[] {
    const messages: any[] = [];
    if (systemText) messages.push({ role: 'system', content: systemText });
    if (typeof prompt === 'string') {
        messages.push({ role: 'user', content: prompt });
        return messages;
    }
    const callIds = new Set<string>();
    let n = 0;
    for (const c of prompt || []) {
        const parts = c?.parts || [];
        const text = parts.map(p => (typeof p.text === 'string' ? p.text : '')).filter(Boolean).join('\n');
        if (c.role === 'model' || c.role === 'assistant') {
            const toolCalls = parts.filter(p => p.functionCall).map(p => {
                const id = p.functionCall!.id || `call_${++n}`;
                callIds.add(id);
                return { id, type: 'function', function: { name: p.functionCall!.name || '', arguments: JSON.stringify(p.functionCall!.args || {}) } };
            });
            if (toolCalls.length) messages.push({ role: 'assistant', content: text || null, tool_calls: toolCalls });
            else if (text) messages.push({ role: 'assistant', content: text });
            continue;
        }
        // User turn: function results answer the model's tool calls; anything
        // that answers no known call is passed on as text.
        const loose: string[] = text ? [text] : [];
        for (const p of parts) {
            const fr = p.functionResponse;
            if (!fr) continue;
            const content = JSON.stringify(fr.response ?? {});
            if (fr.id && callIds.has(fr.id)) messages.push({ role: 'tool', tool_call_id: fr.id, content });
            else loose.push(`Result of ${fr.name || 'tool'}: ${content}`);
        }
        if (loose.length) messages.push({ role: 'user', content: loose.join('\n') });
    }
    return messages;
}

export function buildChatCompletionsBody(input: ChatRequestInput): { body: any; wrapped: boolean } {
    const { provider, responseSchema, tools } = input;
    const wrapped = needsWrap(responseSchema);
    let schema = responseSchema ? toJsonSchema(responseSchema) : undefined;
    if (schema && wrapped) schema = { type: 'object', properties: { [WRAP_KEY]: schema }, required: [WRAP_KEY] };

    let systemText = input.systemInstruction || '';
    const useJsonSchema = Boolean(schema) && JSON_SCHEMA_PROVIDERS.has(provider);
    if (schema && !useJsonSchema) {
        // JSON mode alone doesn't tell the model the shape wanted, so describe it.
        systemText = `${systemText ? systemText + '\n\n' : ''}Respond with a single JSON object that matches this JSON schema:\n${JSON.stringify(schema)}`;
    }

    const body: any = { model: input.modelId, messages: toOpenAIMessages(input.prompt, systemText) };
    if (schema) {
        body.response_format = useJsonSchema
            ? { type: 'json_schema', json_schema: { name: 'response', schema, strict: false } }
            : { type: 'json_object' };
    }
    if (tools && tools.length) {
        body.tools = tools.map(t => ({
            type: 'function',
            function: {
                name: t.name,
                ...(t.description ? { description: t.description } : {}),
                parameters: t.parameters ? toJsonSchema(t.parameters) : { type: 'object', properties: {} },
            },
        }));
    }
    return { body, wrapped };
}

export function readChatCompletion(data: any, wrapped = false): { text: string; functionCalls?: FunctionCall[] } {
    const msg = data?.choices?.[0]?.message || {};
    let text = typeof msg.content === 'string' ? msg.content : '';
    if (!text && typeof msg.refusal === 'string' && msg.refusal) {
        throw new Error(`The AI declined the request: ${msg.refusal}`);
    }
    if (wrapped && text) {
        try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object' && WRAP_KEY in parsed) text = JSON.stringify(parsed[WRAP_KEY]);
        } catch { /* leave as sent; the caller reports unreadable JSON */ }
    }
    const calls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
    const functionCalls: FunctionCall[] = calls
        .filter((c: any) => c && c.function && c.function.name)
        .map((c: any) => {
            let args: Record<string, any> = {};
            try { args = c.function.arguments ? JSON.parse(c.function.arguments) : {}; } catch { args = {}; }
            return { id: c.id, name: c.function.name, args };
        });
    return functionCalls.length ? { text, functionCalls } : { text };
}
