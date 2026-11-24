// The only place the Gemini SDK is used: a user's own Gemini key, chosen in
// Settings. utils.ts (callAI) loads this module with a dynamic import only when
// the provider is 'gemini', so the shared-AI ('server') path never touches it.
// test/ai-provider-guard.test.cjs keeps it that way.
import { GoogleGenAI } from '@google/genai';
import type { Content, FunctionCall, FunctionDeclaration, Schema } from './aiSchema';

export async function callGemini(opts: {
    apiKey: string;
    baseUrl?: string;
    modelId: string;
    prompt: string | Content[];
    systemInstruction?: string;
    tools?: FunctionDeclaration[];
    responseSchema?: Schema;
}): Promise<{ text: string; functionCalls?: FunctionCall[] }> {
    if (!opts.apiKey) throw new Error('Gemini API Key is missing in settings.');
    const options: any = { apiKey: opts.apiKey };
    if (opts.baseUrl) options.httpOptions = { baseUrl: opts.baseUrl };
    const ai = new GoogleGenAI(options);
    const config: any = {};
    if (opts.systemInstruction) config.systemInstruction = opts.systemInstruction;
    if (opts.tools && opts.tools.length) config.tools = [{ functionDeclarations: opts.tools }];
    if (opts.responseSchema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = opts.responseSchema;
    }
    const response = await ai.models.generateContent({ model: opts.modelId, contents: opts.prompt as any, config });
    return { text: response.text || '', functionCalls: response.functionCalls as FunctionCall[] | undefined };
}
