
import { AIConfig } from './types';
import { GoogleGenAI } from '@google/genai';

// Recursive helper to lowercase types for OpenAI compatibility
const sanitizeSchema = (schema: any): any => {
    if (!schema || typeof schema !== 'object') return schema;
    
    // Array handling if schema is an array (though typically it's an object in JSON Schema)
    if (Array.isArray(schema)) {
        return schema.map(sanitizeSchema);
    }

    const newSchema = { ...schema };
    
    // Convert type to lowercase if it exists (e.g. 'STRING' -> 'string', 'OBJECT' -> 'object')
    if (newSchema.type && typeof newSchema.type === 'string') {
        newSchema.type = newSchema.type.toLowerCase();
    }
    
    // Recursively handle properties
    if (newSchema.properties) {
        const newProps: any = {};
        Object.keys(newSchema.properties).forEach(key => {
            newProps[key] = sanitizeSchema(newSchema.properties[key]);
        });
        newSchema.properties = newProps;
    }
    
    // Recursively handle array items
    if (newSchema.items) {
        newSchema.items = sanitizeSchema(newSchema.items);
    }
    
    return newSchema;
};

// Helper to format tools for OpenAI
const mapToolsToOpenAI = (tools: any[]) => {
    if (!tools || tools.length === 0) return undefined;
    const openAiTools: any[] = [];
    
    tools.forEach(t => {
        if (t.functionDeclarations) {
            t.functionDeclarations.forEach((fd: any) => {
                openAiTools.push({
                    type: 'function',
                    function: {
                        name: fd.name,
                        description: fd.description,
                        parameters: sanitizeSchema(fd.parameters)
                    }
                });
            });
        }
        // Handle googleSearch/googleMaps if strict Google features are requested?
        // OpenAI won't support these natively, so we skip them for now or let them fail gracefully.
    });
    
    return openAiTools.length > 0 ? openAiTools : undefined;
};

// Helper to map Gemini content history to OpenAI messages
const mapHistoryToOpenAI = (contents: any[]) => {
    const messages: any[] = [];
    // Queue to store IDs of tool calls from assistant messages
    // so we can assign them to the corresponding tool messages from user.
    let pendingToolCallIds: { name: string, id: string }[] = [];
    
    contents.forEach((c: any) => {
        const role = c.role === 'model' ? 'assistant' : 'user';
        
        // Handle simple text
        const textParts = c.parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n');
        if (textParts) {
            messages.push({ role, content: textParts });
        }

        // Handle Function Calls (Model)
        const functionCalls = c.parts.filter((p: any) => p.functionCall);
        if (functionCalls.length > 0) {
            // OpenAI expects tool_calls in the assistant message
            const tool_calls = functionCalls.map((fcPart: any) => {
                const fc = fcPart.functionCall;
                // Use existing ID or generate one if missing
                const id = fc.id || `call_${Math.random().toString(36).substr(2, 9)}`;
                
                // Store for the next turn's responses
                pendingToolCallIds.push({ name: fc.name, id: id });

                return {
                    id: id,
                    type: 'function',
                    function: {
                        name: fc.name,
                        arguments: JSON.stringify(fc.args)
                    }
                };
            });
            messages.push({ role: 'assistant', content: null, tool_calls });
        }

        // Handle Function Responses (User)
        const functionResponses = c.parts.filter((p: any) => p.functionResponse);
        if (functionResponses.length > 0) {
            functionResponses.forEach((frPart: any) => {
                const fr = frPart.functionResponse;
                
                // Try to find matching ID from pending list
                const matchIndex = pendingToolCallIds.findIndex(item => item.name === fr.name);
                let callId = fr.id;
                
                if (matchIndex !== -1) {
                    callId = pendingToolCallIds[matchIndex].id;
                    // Remove from pending to avoid reusing
                    pendingToolCallIds.splice(matchIndex, 1); 
                } else {
                    // Fallback if we can't match (shouldn't happen in valid flows if order is preserved)
                    callId = callId || `call_unknown_${Math.random().toString(36).substr(2, 9)}`;
                }

                messages.push({
                    role: 'tool',
                    tool_call_id: callId, // This ID must match the call ID
                    name: fr.name,
                    content: JSON.stringify(fr.response)
                });
            });
        }
    });

    return messages;
};

interface GenerateContentOptions {
    model?: string;
    contents: any[];
    config?: any;
}

export const generateContent = async (aiConfig: AIConfig, options: GenerateContentOptions) => {
    // --- GOOGLE GEMINI PATH ---
    if (aiConfig.provider === 'google') {
        const apiKey = aiConfig.apiKey || process.env.API_KEY;
        if (!apiKey) throw new Error("No API Key provided for Google Gemini.");
        
        const ai = new GoogleGenAI({ apiKey });
        const model = options.model || aiConfig.modelId || 'gemini-2.5-flash';
        
        // Ensure config object exists
        const requestConfig = options.config || {};
        
        return await ai.models.generateContent({
            model,
            contents: options.contents,
            config: requestConfig
        });
    }

    // --- OPENAI / COMPATIBLE PATH ---
    const apiKey = aiConfig.apiKey;
    const baseUrl = aiConfig.baseUrl || 'https://api.openai.com/v1';
    const model = aiConfig.modelId || 'gpt-4o';

    if (!apiKey && aiConfig.provider !== 'ollama' && aiConfig.provider !== 'custom') {
        throw new Error(`No API Key provided for ${aiConfig.provider}. Please update Settings.`);
    }

    const messages = [];
    
    // 1. System Instruction
    if (options.config?.systemInstruction) {
        messages.push({ role: 'system', content: options.config.systemInstruction });
    }

    // 2. History
    messages.push(...mapHistoryToOpenAI(options.contents));

    // 3. Tools
    const tools = mapToolsToOpenAI(options.config?.tools);

    // 4. Response Format (JSON)
    let response_format = undefined;
    if (options.config?.responseMimeType === 'application/json') {
        response_format = { type: 'json_object' };
        // OpenAI requires "JSON" word in prompt for json mode usually
        if (messages.length > 0) {
             // Find the last user message or system message to append the hint
             // Or just append to the last message content
             const lastMsg = messages[messages.length - 1];
             if (lastMsg.content && typeof lastMsg.content === 'string' && !lastMsg.content.toLowerCase().includes('json')) {
                 lastMsg.content += "\n\nIMPORTANT: Output strictly valid JSON.";
             }
        }
    }

    const body: any = {
        model,
        messages,
        tools,
        response_format,
        temperature: options.config?.temperature ?? 0.7
    };

    // If responseSchema is present, stringify it into the system prompt as OpenAI json_schema support is stricter/beta
    if (options.config?.responseSchema) {
        // Sanitize schema first (convert types to lowercase)
        const sanitizedSchema = sanitizeSchema(options.config.responseSchema);
        const schemaStr = JSON.stringify(sanitizedSchema, null, 2);
        
        // Append to system prompt or first message
        if (messages.length > 0 && messages[0].role === 'system') {
            messages[0].content += `\n\nFollow this JSON Schema for the response:\n${schemaStr}`;
        } else {
            messages.unshift({ role: 'system', content: `Follow this JSON Schema for the response:\n${schemaStr}` });
        }
    }

    try {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`AI Provider Error (${resp.status}): ${errorText}`);
        }

        const data = await resp.json();
        const choice = data.choices[0];
        
        // Map OpenAI Response back to Gemini format
        const result: any = {
            text: choice.message.content || undefined,
            functionCalls: undefined
        };

        if (choice.message.tool_calls) {
            result.functionCalls = choice.message.tool_calls.map((tc: any) => ({
                id: tc.id,
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments)
            }));
        }

        return result;

    } catch (error: any) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
