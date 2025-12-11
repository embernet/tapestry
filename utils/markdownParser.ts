
import { Element, Relationship, RelationshipDirection } from '../types';
import { generateUUID, normalizeTag } from '../utils';

interface ParsedGraphData {
    newElements: Element[];
    newRelationships: Relationship[];
}

export const parseMarkdownToGraph = (
    markdown: string,
    existingElements: Element[],
    existingRelationships: Relationship[],
    shouldMerge: boolean
): ParsedGraphData => {
    // Pre-processing
    let processedMarkdown = markdown
        .replace(/\s*\/>\s*/g, ' -[Counteracts]-> ')
        .replace(/(?<!\-|\[)>(?!\-|\])/g, ' -[Produces]-> ');

    const lines = processedMarkdown.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed !== '' && !trimmed.startsWith('#');
    });

    const parsedElements = new Map<string, { tags: string[] }>();
    const parsedRels: { sourceName: string, targetName: string, label: string, direction: RelationshipDirection }[] = [];

    // Helper to parse "Name:Tag1,Tag2" strings
    function parseElementStr(str: string) {
        let workStr = str.trim();
        if (!workStr) return null;
        
        let name: string;
        let tags: string[] = [];
        
        const lastColonIndex = workStr.lastIndexOf(':');
        const lastParenOpenIndex = workStr.lastIndexOf('('); // Ignore colons inside parens if any
        
        if (lastColonIndex > -1 && lastColonIndex > lastParenOpenIndex) {
            const tagsStr = workStr.substring(lastColonIndex + 1);
            tags = tagsStr.split(',').map(t => normalizeTag(t)).filter(t => !!t);
            workStr = workStr.substring(0, lastColonIndex).trim();
        }
        
        // Shorthand syntax support (+ or - suffix)
        if (workStr.endsWith('+')) {
            workStr = workStr.slice(0, -1).trim();
            tags.push('useful'); // Lowercase normalization
        } else if (workStr.endsWith('-')) {
            workStr = workStr.slice(0, -1).trim();
            tags.push('harmful'); // Lowercase normalization
        }
        
        name = workStr;
        
        // Remove surrounding quotes
        if (name.startsWith('"') && name.endsWith('"')) {
            name = name.substring(1, name.length - 1);
        }
        
        if (!name) return null;
        return { name, tags };
    }

    function updateParsedElement(elementData: { name: string, tags: string[] }) {
        const existing = parsedElements.get(elementData.name);
        if (existing) {
            const newTags = [...new Set([...existing.tags, ...elementData.tags])];
            parsedElements.set(elementData.name, { tags: newTags });
        } else {
            parsedElements.set(elementData.name, { tags: elementData.tags });
        }
    }

    // Line Processing Loop
    for (const line of lines) {
        // Regex to split by relationships e.g. -[label]-> or -> or <--
        const relSeparatorRegex = /(<?-\[.*?]->?)/g;
        const parts = line.split(relSeparatorRegex);
        const tokens = parts.map(p => p.trim()).filter(t => !!t);

        if (tokens.length === 0) continue;

        // Case: Single Element definition "Node:Tag"
        if (tokens.length === 1) {
            const element = parseElementStr(tokens[0]);
            if (element) {
                updateParsedElement(element);
            }
            continue;
        }

        // Case: Chain "A -> B -> C"
        let currentSourceElementStr = tokens.shift();
        
        while (tokens.length > 0) {
            const relStr = tokens.shift();
            const targetsStr = tokens.shift();

            if (!currentSourceElementStr || !relStr || !targetsStr) break;

            const sourceElementData = parseElementStr(currentSourceElementStr);
            if (!sourceElementData) break;
            updateParsedElement(sourceElementData);

            // Parse Arrow
            const singleRelRegex = /<?-\[(.*?)]->?/;
            const relMatch = relStr.match(singleRelRegex);
            
            const label = relMatch ? relMatch[1] : '';
            
            let direction = RelationshipDirection.None;
            if (relStr.startsWith('<-') && relStr.endsWith('->')) direction = RelationshipDirection.Both;
            else if (relStr.startsWith('<-')) direction = RelationshipDirection.From;
            else if (relStr.endsWith('->')) direction = RelationshipDirection.To;

            // Handle multiple targets separated by semicolon "A -> B; C"
            const targetElementStrs = targetsStr.split(';').map(t => t.trim()).filter(t => !!t);

            for (const targetElementStr of targetElementStrs) {
                const targetElementData = parseElementStr(targetElementStr);
                if (targetElementData) {
                    updateParsedElement(targetElementData);
                    parsedRels.push({ 
                        sourceName: sourceElementData.name, 
                        targetName: targetElementData.name, 
                        label, 
                        direction 
                    });
                }
            }

            // Chain continuation
            if (targetElementStrs.length === 1) {
                currentSourceElementStr = targetElementStrs[0];
            } else {
                break; // Cannot chain from multiple targets easily in this syntax
            }
        }
    }

    // Build Final Arrays
    let nextElements: Element[] = [];
    let nextRelationships: Relationship[] = [];
    const newElementNames = new Set<string>();

    if (shouldMerge) {
        nextElements = [...existingElements];
        nextRelationships = [...existingRelationships];
        
        const existingMap = new Map<string, Element>();
        const nameToIdMap = new Map<string, string>();
        
        nextElements.forEach(e => {
            existingMap.set(e.name.toLowerCase(), e);
            nameToIdMap.set(e.name.toLowerCase(), e.id);
        });

        // Merge Nodes
        parsedElements.forEach(({ tags }, name) => {
            const lowerName = name.toLowerCase();
            const existing = existingMap.get(lowerName);
            
            if (existing) {
                // Update existing tags
                const mergedTags = Array.from(new Set([...existing.tags, ...tags]));
                // Only update timestamp if tags changed
                if (mergedTags.length !== existing.tags.length || !mergedTags.every(t => existing.tags.includes(t))) {
                    const updated = { ...existing, tags: mergedTags, updatedAt: new Date().toISOString() };
                    const idx = nextElements.findIndex(e => e.id === existing.id);
                    if (idx !== -1) nextElements[idx] = updated;
                    existingMap.set(lowerName, updated);
                }
            } else {
                // Create new
                const now = new Date().toISOString();
                const newId = generateUUID();
                const newEl: Element = { 
                    id: newId, 
                    name, 
                    tags, 
                    notes: '', 
                    createdAt: now, 
                    updatedAt: now 
                };
                nextElements.push(newEl);
                existingMap.set(lowerName, newEl);
                nameToIdMap.set(lowerName, newId);
                newElementNames.add(name);
            }
        });

        // Merge Relationships
        parsedRels.forEach(rel => {
            const sId = nameToIdMap.get(rel.sourceName.toLowerCase());
            const tId = nameToIdMap.get(rel.targetName.toLowerCase());
            
            if (sId && tId) {
                const exists = nextRelationships.some(r => 
                    r.source === sId && 
                    r.target === tId && 
                    r.label === rel.label && 
                    r.direction === rel.direction
                );
                
                if (!exists) {
                    nextRelationships.push({ 
                        id: generateUUID(), 
                        source: sId, 
                        target: tId, 
                        label: rel.label, 
                        direction: rel.direction, 
                        tags: [] 
                    });
                }
            }
        });

    } else {
        // Replace Mode 
        const nameToIdMap = new Map<string, string>();
        
        parsedElements.forEach(({ tags }, name) => {
            // Check if it existed in the OLD set to keep ID constant
            const existing = existingElements.find(e => e.name.toLowerCase() === name.toLowerCase());
            
            if (existing) {
                const updated = { ...existing, tags, updatedAt: new Date().toISOString() };
                nextElements.push(updated);
                nameToIdMap.set(name.toLowerCase(), existing.id);
            } else {
                const now = new Date().toISOString();
                const newId = generateUUID();
                const newEl: Element = { id: newId, name, tags, notes: '', createdAt: now, updatedAt: now };
                nextElements.push(newEl);
                nameToIdMap.set(name.toLowerCase(), newId);
                newElementNames.add(name);
            }
        });

        parsedRels.forEach(rel => {
            const sId = nameToIdMap.get(rel.sourceName.toLowerCase());
            const tId = nameToIdMap.get(rel.targetName.toLowerCase());
            
            if (sId && tId) {
                nextRelationships.push({ 
                    id: generateUUID(), 
                    source: sId, 
                    target: tId, 
                    label: rel.label, 
                    direction: rel.direction, 
                    tags: [] 
                });
            }
        });
    }
    
    // Auto-Layout New Elements (Basic positioning)
    let placedNewElementsCount = 0;
    
    nextElements.forEach(element => {
        if (newElementNames.has(element.name) && element.x === undefined) {
            let connectedAnchor: Element | undefined;
            
            // Try to find a connected node that already has a position
            for (const rel of nextRelationships) {
                let anchorId: string | undefined;
                if (rel.source === element.id) anchorId = rel.target as string;
                else if (rel.target === element.id) anchorId = rel.source as string;
                
                if (anchorId) {
                    const potentialAnchor = nextElements.find(f => f.id === anchorId && f.x !== undefined);
                    if (potentialAnchor) {
                        connectedAnchor = potentialAnchor;
                        break;
                    }
                }
            }
            
            if (connectedAnchor && connectedAnchor.x && connectedAnchor.y) {
                element.x = connectedAnchor.x + (Math.random() - 0.5) * 300;
                element.y = connectedAnchor.y + (Math.random() - 0.5) * 300;
            } else {
                // Default spiral
                element.x = 200 + (placedNewElementsCount * 50);
                element.y = 200 + (placedNewElementsCount * 50);
                placedNewElementsCount++;
            }
            element.fx = element.x;
            element.fy = element.y;
        }
    });

    return { newElements: nextElements, newRelationships: nextRelationships };
};
