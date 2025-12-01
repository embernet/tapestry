
import { Element, Relationship, RelationshipDirection, ChatMessage } from './types';
import { GoogleGenAI } from '@google/genai';

/**
 * A simple UUID v4 generator.
 * This is used to avoid potential TypeScript typing issues with 'crypto.randomUUID()'
 * across different environments and 'tsconfig.json' settings.
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Computes a simple hash of the data object to detect changes.
 * This allows us to avoid autosaving or triggering conflicts when data is identical.
 */
export const computeContentHash = (data: any): string => {
  try {
    const str = JSON.stringify(data);
    let hash = 0, i, chr;
    if (str.length === 0) return hash.toString();
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  } catch (e) {
    console.error("Error computing hash", e);
    return generateUUID(); // Fallback to random ID if hashing fails
  }
};

export const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const generateMarkdownFromGraph = (elements: Element[], relationships: Relationship[]): string => {
  const elementMap = new Map(elements.map(f => [f.id, f]));
  const handledElementIds = new Set<string>();
  const lines: string[] = [];

  const formatAttributes = (attributes?: Record<string, string>) => {
    if (!attributes || Object.keys(attributes).length === 0) return '';
    const attrStr = Object.entries(attributes)
      .map(([k, v]) => `${k}="${v}"`)
      .join(', ');
    return ` {${attrStr}}`;
  };

  const formatElement = (element: Element) => {
    // Quote name if it contains characters that could be ambiguous for the parser.
    const needsQuotes = /[():]/.test(element.name);
    let str = needsQuotes ? `"${element.name}"` : element.name;

    if (element.tags && element.tags.length > 0) {
      str += `:${element.tags.join(',')}`;
    }
    
    str += formatAttributes(element.attributes);
    return str;
  };

  // Group relationships by source, label, and direction to handle one-to-many syntax
  // Note: We do NOT group relationships that have custom attributes to ensure attributes are clearly associated with the specific link.
  const relGroups = new Map<string, { target: Element, rel: Relationship }[]>(); 

  relationships.forEach(rel => {
      const source = elementMap.get(rel.source as string);
      const target = elementMap.get(rel.target as string);
      if (!source || !target) return;

      // If relationship has attributes, print it on its own line immediately, don't group.
      if (rel.attributes && Object.keys(rel.attributes).length > 0) {
        const sourceStr = formatElement(source);
        const targetStr = formatElement(target);
        const attrs = formatAttributes(rel.attributes);
        let connector = '';
        switch (rel.direction) {
            case RelationshipDirection.From: connector = ` <-[${rel.label}]- `; break;
            case RelationshipDirection.Both: connector = ` <-[${rel.label}]-> `; break;
            case RelationshipDirection.None: connector = ` -[${rel.label}]- `; break;
            default: connector = ` -[${rel.label}]-> `; break;
        }
        lines.push(`${sourceStr}${connector}${targetStr}${attrs}`);
        handledElementIds.add(source.id);
        handledElementIds.add(target.id);
        return;
      }

      const key = `${source.id}:${rel.label}:${rel.direction}`;
      if (!relGroups.has(key)) {
          relGroups.set(key, []);
      }
      relGroups.get(key)!.push({ target, rel });

      handledElementIds.add(source.id);
      handledElementIds.add(target.id);
  });

  relGroups.forEach((targets, key) => {
      const [sourceId, label, direction] = key.split(':');
      const source = elementMap.get(sourceId)!;
      const sourceStr = formatElement(source);
      
      // Format targets
      const targetStrs = targets.map(t => formatElement(t.target));

      let connector = '';
      switch (direction as RelationshipDirection) {
        case RelationshipDirection.From:
          connector = ` <-[${label}]- `;
          break;
        case RelationshipDirection.Both:
          connector = ` <-[${label}]-> `;
          break;
        case RelationshipDirection.None:
          connector = ` -[${label}]- `;
          break;
        case RelationshipDirection.To:
        default:
          connector = ` -[${label}]-> `;
          break;
      }
      lines.push(`${sourceStr}${connector}${targetStrs.join('; ')}`);
  });


  // Add elements that have no relationships
  elements.forEach(element => {
    if (!handledElementIds.has(element.id)) {
      lines.push(formatElement(element));
    }
  });

  return lines.join('\n');
};

export const generateElementMarkdown = (
  element: Element,
  relationships: Relationship[],
  allElements: Element[]
): string => {
  const elementMap = new Map(allElements.map(e => [e.id, e]));
  const lines: string[] = [`## ${element.name}`];
  
  if (element.tags.length > 0) lines.push(`**Tags:** ${element.tags.join(', ')}`);
  if (element.attributes && Object.keys(element.attributes).length > 0) {
      lines.push("**Attributes:**");
      Object.entries(element.attributes).forEach(([k, v]) => {
          lines.push(`- ${k}: ${v}`);
      });
  }
  if (element.notes) lines.push(`**Notes:**\n${element.notes}`);

  const elementRels = relationships.filter(r => r.source === element.id || r.target === element.id);
  if (elementRels.length > 0) {
    lines.push("\n**Relationships:**");
    elementRels.forEach(rel => {
      const sourceElement = elementMap.get(rel.source as string);
      const targetElement = elementMap.get(rel.target as string);
      if (!sourceElement || !targetElement) return;
      
      let arrow = '';
      switch (rel.direction) {
        case RelationshipDirection.From: arrow = `<--[${rel.label}]--`; break;
        case RelationshipDirection.Both: arrow = `<--[${rel.label}]-->`; break;
        case RelationshipDirection.None: arrow = `---[${rel.label}]---`; break;
        default: arrow = `--[${rel.label}]-->`; break;
      }
      
      let relStr = `- \`${sourceElement.name}\` ${arrow} \`${targetElement.name}\``;
      if (rel.attributes && Object.keys(rel.attributes).length > 0) {
          const attrStr = Object.entries(rel.attributes).map(([k, v]) => `${k}=${v}`).join(', ');
          relStr += ` *{${attrStr}}*`;
      }
      lines.push(relStr);
    });
  }
  
  return lines.join('\n\n---\n\n');
};

export const generateSelectionReport = (elements: Element[], relationships: Relationship[]): string => {
    return elements.map(el => {
        // Find relationships connected to this element that are ALSO within the selection set
        // We assume 'relationships' passed here is already filtered to only include internal links
        const connectedRels = relationships.filter(r => r.source === el.id || r.target === el.id);
        
        let relStrings = 'None';
        
        if (connectedRels.length > 0) {
            relStrings = connectedRels.map(r => {
                const source = elements.find(e => e.id === r.source);
                const target = elements.find(e => e.id === r.target);
                
                // Even if filtered, safety check
                if (!source || !target) return null;

                // Format: Source label Target
                // We essentially describe the relationship fact regardless of direction,
                // matching the user's example "Car produces Pollution"
                return `${source.name} ${r.label} ${target.name}`;
            }).filter(Boolean).join('\n');
        }

        return `${el.name}\nTags: ${el.tags.join(', ')}\nRelationships:\n${relStrings}`;
    }).join('\n\n');
};

// --- AI Service Adapter ---

export interface AIConfig {
    provider: string;
    apiKey: string;
    modelId: string;
    baseUrl?: string;
}

export const aiLogger = {
  listeners: [] as ((msg: ChatMessage) => void)[],
  subscribe: (listener: (msg: ChatMessage) => void) => {
    aiLogger.listeners.push(listener);
    return () => {
      aiLogger.listeners = aiLogger.listeners.filter(l => l !== listener);
    };
  },
  log: (msg: ChatMessage) => {
    aiLogger.listeners.forEach(l => l(msg));
  }
};

export const callAI = async (
    config: AIConfig,
    prompt: any, // string or Gemini Content[]
    systemInstruction?: string,
    tools?: any[], // Gemini format function declarations
    responseSchema?: any, // Gemini format schema
    skipLog?: boolean
): Promise<{ text: string, functionCalls?: any[] }> => {
    
    if (!skipLog) {
        let requestText = '';
        if (typeof prompt === 'string') requestText = prompt;
        else if (Array.isArray(prompt)) {
            // Try to extract text from content array
            try {
                requestText = prompt.map((p: any) => p.parts?.map((part: any) => part.text).join('')).join('\n');
            } catch (e) { requestText = '(Complex Content)'; }
        }

        aiLogger.log({
            role: 'user',
            text: requestText,
            requestPayload: {
                modelId: config.modelId,
                prompt,
                systemInstruction,
                tools,
                responseSchema
            }
        });
    }

    if (config.provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.API_KEY });
        const geminiConfig: any = {};
        if (systemInstruction) geminiConfig.systemInstruction = systemInstruction;
        if (tools) geminiConfig.tools = [{ functionDeclarations: tools }];
        if (responseSchema) {
            geminiConfig.responseMimeType = "application/json";
            geminiConfig.responseSchema = responseSchema;
        }

        const response = await ai.models.generateContent({
            model: config.modelId,
            contents: prompt,
            config: geminiConfig
        });
        
        const result = {
            text: response.text || "",
            functionCalls: response.functionCalls
        };

        if (!skipLog) {
            let rawJson = undefined;
            try { if (responseSchema) rawJson = JSON.parse(result.text); } catch(e) {}
            aiLogger.log({
                role: 'model',
                text: result.text,
                functionCalls: result.functionCalls,
                rawJson
            });
        }

        return result;
    } 
    
    if (config.provider === 'openai' || config.provider === 'anthropic' || config.provider === 'grok' || config.provider === 'ollama') {
        // Basic mapping for OpenAI-compatible endpoints
        
        if (!config.apiKey && config.provider !== 'ollama') throw new Error(`${config.provider} API Key is missing in settings.`);
        
        const messages = [];
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        
        // Map content
        if (typeof prompt === 'string') {
            messages.push({ role: "user", content: prompt });
        } else if (Array.isArray(prompt)) {
            // Best effort mapping from Gemini Content to OpenAI Messages
            prompt.forEach((p: any) => {
                let role = p.role === 'model' ? 'assistant' : 'user';
                
                // Flatten parts to text
                let content = "";
                if (p.parts) {
                    p.parts.forEach((part: any) => {
                        if (part.text) content += part.text;
                    });
                }
                
                if (content) {
                    messages.push({ role, content });
                }
            });
        }

        const body: any = {
            model: config.modelId,
            messages: messages
        };

        // Simple JSON mode support (OpenAI requires "json_object" and usually specific instruction)
        if (responseSchema) {
            body.response_format = { type: "json_object" };
        }

        // Determine Endpoint
        let baseUrl = config.baseUrl;
        if (!baseUrl) {
            if (config.provider === 'openai') baseUrl = 'https://api.openai.com/v1';
            else if (config.provider === 'anthropic') baseUrl = 'https://api.anthropic.com/v1'; // Placeholder, Anthropic needs specific handling usually
            else if (config.provider === 'grok') baseUrl = 'https://api.x.ai/v1';
            else if (config.provider === 'ollama') baseUrl = 'http://localhost:11434/v1';
        }
        
        // Ensure no trailing slash
        baseUrl = baseUrl?.replace(/\/$/, '');
        const url = `${baseUrl}/chat/completions`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (config.apiKey) {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }
        if (config.provider === 'anthropic') {
            headers['x-api-key'] = config.apiKey;
            headers['anthropic-version'] = '2023-06-01';
            delete headers['Authorization'];
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
                throw new Error(err.error?.message || `${config.provider} Error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "";
            
            const result = { text: content, functionCalls: undefined };

            if (!skipLog) {
                let rawJson = undefined;
                try { if (responseSchema) rawJson = JSON.parse(content); } catch(e) {}
                aiLogger.log({
                    role: 'model',
                    text: content,
                    rawJson
                });
            }

            return result;
        } catch (e: any) {
            console.error("AI Call Failed", e);
            throw new Error(`Failed to call ${config.provider}: ${e.message}`);
        }
    }

    throw new Error(`Provider '${config.provider}' is not fully supported in this version.`);
};