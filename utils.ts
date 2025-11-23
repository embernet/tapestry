
import { Element, Relationship, RelationshipDirection } from './types';

/**
 * A simple UUID v4 generator.
 * This is used to avoid potential TypeScript typing issues with `crypto.randomUUID()`
 * across different environments and `tsconfig.json` settings.
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
