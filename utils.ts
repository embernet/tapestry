
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

export const generateMarkdownFromGraph = (elements: Element[], relationships: Relationship[]): string => {
  const elementMap = new Map(elements.map(f => [f.id, f]));
  const handledElementIds = new Set<string>();
  const lines: string[] = [];

  const formatElement = (element: Element) => {
    // Quote name if it contains characters that could be ambiguous for the parser.
    const needsQuotes = /[():]/.test(element.name);
    let str = needsQuotes ? `"${element.name}"` : element.name;

    if (element.tags && element.tags.length > 0) {
      str += `:${element.tags.join(',')}`;
    }
    return str;
  };

  // Group relationships by source, label, and direction to handle one-to-many syntax
  const relGroups = new Map<string, string[]>(); // key: `sourceId:label:direction`, value: formatted target strings
  relationships.forEach(rel => {
      const source = elementMap.get(rel.source as string);
      const target = elementMap.get(rel.target as string);
      if (!source || !target) return;

      const key = `${source.id}:${rel.label}:${rel.direction}`;
      if (!relGroups.has(key)) {
          relGroups.set(key, []);
      }
      relGroups.get(key)!.push(formatElement(target));

      handledElementIds.add(source.id);
      handledElementIds.add(target.id);
  });

  relGroups.forEach((targetStrs, key) => {
      const [sourceId, label, direction] = key.split(':');
      const source = elementMap.get(sourceId)!;
      const sourceStr = formatElement(source);

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
      lines.push(`- \`${sourceElement.name}\` ${arrow} \`${targetElement.name}\``);
    });
  }
  
  return lines.join('\n\n---\n\n');
};
