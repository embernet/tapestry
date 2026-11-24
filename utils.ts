
import { Element, Relationship, RelationshipDirection, ChatMessage, ColorScheme, GraphView, AIConfig, KanbanBoard } from './types';
import type { Content, FunctionCall, FunctionDeclaration, Schema } from './services/aiSchema';
import { buildChatCompletionsBody, chatCompletionsEndpoint, isOpenAICompatible, readChatCompletion } from './services/aiRequest';

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

export const normalizeTag = (tag: string): string => {
  return tag.trim().toLowerCase();
};

export const formatTag = (tag: string): string => {
  if (!tag) return '';
  return tag.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
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

export const compareVersions = (a: string, b: string): number => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (nb > na) return -1;
  }
  return 0;
};

export const createDefaultView = (): GraphView => {
  return {
    id: generateUUID(),
    name: 'Full Graph',
    description: 'Default view showing all nodes and relationships.',
    tapestryVisible: false,
    filters: {
      tags: { included: [], excluded: [] },
      date: { createdAfter: '', createdBefore: '', updatedAfter: '', updatedBefore: '' },
      nodeFilter: { centerId: null, hops: 1, active: false }
    },
    explicitInclusions: [],
    explicitExclusions: [],
    nodePositions: {}
  };
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
      str += `:${element.tags.map(formatTag).join(',')}`;
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
  allElements: Element[],
  activeColorScheme?: ColorScheme
): string => {
  const elementMap = new Map(allElements.map(e => [e.id, e]));
  const lines: string[] = [`## ${element.name}`];

  if (element.tags.length > 0) lines.push(`**Tags:** ${element.tags.map(formatTag).join(', ')}`);
  if (element.attributes && Object.keys(element.attributes).length > 0) {
    lines.push("**Attributes:**");
    Object.entries(element.attributes).forEach(([k, v]) => {
      lines.push(`- ${k}: ${v}`);
    });
  }

  // Merge Schema Lists
  const mergedCustomLists: Record<string, string[]> = { ...element.customLists };
  if (activeColorScheme?.customLists) {
    Object.entries(activeColorScheme.customLists).forEach(([key, defaultItems]) => {
      if (!mergedCustomLists[key]) {
        mergedCustomLists[key] = [...(defaultItems as string[])];
      }
    });
  }

  if (Object.keys(mergedCustomLists).length > 0) {
    Object.entries(mergedCustomLists).forEach(([listName, items]) => {
      if (items && items.length > 0) {
        lines.push(`**${listName}:**`);
        items.forEach(item => lines.push(`- ${item}`));
      }
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

    return `${el.name}\nTags: ${el.tags.map(formatTag).join(', ')}\nRelationships:\n${relStrings}`;
  }).join('\n\n');
};

// --- AI Service Adapter ---

export type { AIConfig };

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

// One way in to every AI feature, whatever the provider. With the Tapestry
// server's shared AI ('server', the default for users without a key) the request
// goes to /api/ai/v1/chat/completions on this origin with no key; the server adds
// it. Structured output and tools are mapped by services/aiRequest.ts. A user's
// own Gemini key goes through services/geminiClient.ts, loaded only then.
export const callAI = async (
  config: AIConfig,
  prompt: string | Content[],
  systemInstruction?: string,
  tools?: FunctionDeclaration[],
  responseSchema?: Schema,
  skipLog?: boolean
): Promise<{ text: string, functionCalls?: FunctionCall[] }> => {

  // Append language instruction
  let effectiveSystemInstruction = systemInstruction;
  if (config.language) {
    effectiveSystemInstruction = effectiveSystemInstruction
      ? `${effectiveSystemInstruction}\nProvide all responses in ${config.language}.`
      : `Provide all responses in ${config.language}.`;
  }

  if (!skipLog) {
    let requestText = '';
    if (typeof prompt === 'string') requestText = prompt;
    else if (Array.isArray(prompt)) {
      try {
        requestText = prompt.map((p: any) => p.parts?.map((part: any) => part.text).join('')).join('\n');
      } catch (e) { requestText = '(Complex Content)'; }
    }
    aiLogger.log({
      role: 'user',
      text: requestText,
      requestPayload: { modelId: config.modelId, prompt, systemInstruction: effectiveSystemInstruction, tools, responseSchema }
    });
  }

  const logResult = (result: { text: string, functionCalls?: FunctionCall[] }) => {
    if (skipLog) return;
    let rawJson = undefined;
    try { if (responseSchema) rawJson = JSON.parse(result.text); } catch (e) { }
    aiLogger.log({ role: 'model', text: result.text, functionCalls: result.functionCalls, rawJson });
  };

  if (config.provider === 'gemini') {
    const { callGemini } = await import('./services/geminiClient');
    const result = await callGemini({
      apiKey: config.apiKey, baseUrl: config.baseUrl, modelId: config.modelId,
      prompt, systemInstruction: effectiveSystemInstruction, tools, responseSchema
    });
    logResult(result);
    return result;
  }

  if (isOpenAICompatible(config.provider)) {
    if (!config.apiKey && config.provider !== 'ollama' && config.provider !== 'server') throw new Error(`${config.provider} API Key is missing in settings.`);
    const who = config.provider === 'server' ? 'the shared AI' : config.provider;
    const { url, headers } = chatCompletionsEndpoint(config);
    const { body, wrapped } = buildChatCompletionsBody({
      provider: config.provider, modelId: config.modelId, prompt,
      systemInstruction: effectiveSystemInstruction, tools, responseSchema
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: config.provider === 'server' ? 'same-origin' : 'omit'
      });
    } catch (e: any) {
      throw new Error(`Failed to call ${who}: ${e.message}`);
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Failed to call ${who}: ${err.error?.message || `error ${response.status}`}`);
    }
    const result = readChatCompletion(await response.json(), wrapped);
    logResult(result);
    return result;
  }

  throw new Error(`Provider '${config.provider}' is not fully supported in this version.`);
};

export const createKanbanBoard = (name: string): KanbanBoard => {
  const id = generateUUID();
  // Using a sanitized ID for the attribute key to ensure it's a safe property name
  const attributeKey = `Status_${id.replace(/-/g, '')}`;

  return {
    id,
    name: name.trim(),
    columns: ['To Do', 'Doing', 'Done'],
    attributeKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};
