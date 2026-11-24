// Provider-neutral AI types. Components describe structured output and tools
// with these, never with a provider SDK, so the provider chosen in Settings
// (the Tapestry server, OpenAI, Gemini, ...) decides how they are sent.
// The values match Gemini's `Type` names, so services/geminiClient.ts can pass
// schemas to the Gemini SDK unchanged; services/aiRequest.ts maps them to
// JSON Schema for OpenAI-compatible APIs.

export const Type = {
    TYPE_UNSPECIFIED: 'TYPE_UNSPECIFIED',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    INTEGER: 'INTEGER',
    BOOLEAN: 'BOOLEAN',
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
    NULL: 'NULL',
} as const;
export type Type = typeof Type[keyof typeof Type];

export interface Schema {
    type?: Type;
    description?: string;
    enum?: string[];
    format?: string;
    nullable?: boolean;
    items?: Schema;
    properties?: Record<string, Schema>;
    required?: string[];
    [key: string]: any;
}

export interface FunctionDeclaration {
    name: string;
    description?: string;
    parameters?: Schema;
}

export interface FunctionCall {
    id?: string;
    name?: string;
    args?: Record<string, any>;
}

export interface FunctionResponse {
    id?: string;
    name?: string;
    response?: Record<string, any>;
}

export interface Part {
    text?: string;
    functionCall?: FunctionCall;
    functionResponse?: FunctionResponse;
    [key: string]: any;
}

export interface Content {
    role?: string;
    parts?: Part[];
}
