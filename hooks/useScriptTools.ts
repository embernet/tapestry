
import React, { useEffect } from 'react';
import { toolRegistry } from '../services/ToolRegistry';
import { ToolClient, ActionDescriptor, Element, Relationship, TapestryDocument } from '../types';
import { generateUUID, normalizeTag } from '../utils';

export interface UseScriptToolsProps {
    elementsRef: React.MutableRefObject<Element[]>;
    setElements: React.Dispatch<React.SetStateAction<Element[]>>;
    relationshipsRef: React.MutableRefObject<Relationship[]>;
    setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
    documentsRef: React.MutableRefObject<TapestryDocument[]>;
    setDocuments: React.Dispatch<React.SetStateAction<TapestryDocument[]>>;
    graphCanvasRef: React.RefObject<any>;
    setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>;
    setMultiSelection: React.Dispatch<React.SetStateAction<Set<string>>>;
    setAnalysisHighlights: React.Dispatch<React.SetStateAction<Map<string, string>>>;
    onOpenDocument: (id: string) => void;
}

export const useScriptTools = ({
    elementsRef, setElements,
    relationshipsRef, setRelationships,
    documentsRef, setDocuments,
    graphCanvasRef,
    setSelectedElementId,
    setMultiSelection,
    setAnalysisHighlights,
    onOpenDocument
}: UseScriptToolsProps) => {

    useEffect(() => {
        // --- Graph Tool ---
        const graphTool: ToolClient = {
            id: 'graph',
            listActions: (): ActionDescriptor[] => [
                { name: 'get_all_nodes', description: 'Return all nodes' },
                { name: 'get_node_by_name', description: 'Find node by name', args: ['name'] },
                { name: 'query_nodes', description: 'Find nodes by tag or attribute (e.g. tag:"Risk" or location:"London")', args: ['tag', '...attributes'] },
                { name: 'add_node', description: 'Create a node', args: ['name', 'tags', 'notes'] },
                { name: 'delete_node', description: 'Delete a node', args: ['id'] },
                { name: 'add_edge', description: 'Connect nodes', args: ['source', 'target', 'label'] },
                { name: 'get_neighbors', description: 'Get connected nodes', args: ['id'] },
                { name: 'get_connections', description: 'Get detailed connections for a node', args: ['id'] },
                { name: 'set_attribute', description: 'Set a custom attribute on a node', args: ['id', 'key', 'value'] },
                { name: 'add_tag', description: 'Add a tag to a node', args: ['id', 'tag'] },
                { name: 'remove_tag', description: 'Remove a tag from a node', args: ['id', 'tag'] },
                { name: 'set_highlight', description: 'Set persistent node highlight', args: ['id', 'color'] },
                { name: 'clear_highlight', description: 'Remove persistent node highlight', args: ['id'] },
                { name: 'get_date', description: 'Get current date string' },
                { name: 'get_formatted_attributes', description: 'Get attributes as list of strings', args: ['id'] },
                { name: 'get_formatted_lists', description: 'Get custom lists as list of strings', args: ['id'] }
            ],
            invoke: async (action, args) => {
                const elements = elementsRef.current;
                const relationships = relationshipsRef.current;

                switch (action) {
                    case 'get_all_nodes':
                        return elements;
                    case 'get_node_by_name':
                        return elements.find(e => e.name.toLowerCase() === (args.name as string).toLowerCase());
                    case 'query_nodes':
                        let results = elements;
                        // Filter by all provided arguments
                        for (const [key, value] of Object.entries(args)) {
                            if (!value) continue;
                            const term = String(value).toLowerCase();

                            if (key === 'tag') {
                                results = results.filter(e => e.tags.some(t => t.toLowerCase() === term));
                            } else if (key === 'name') {
                                results = results.filter(e => e.name.toLowerCase().includes(term));
                            } else {
                                // Assume attribute filter
                                results = results.filter(e => e.attributes && e.attributes[key] && String(e.attributes[key]).toLowerCase() === term);
                            }
                        }
                        return results;

                    case 'add_node':
                        const name = args.name as string;
                        if (!name) throw new Error("Name is required");
                        // Check exist
                        const existing = elements.find(e => e.name.toLowerCase() === name.toLowerCase());
                        if (existing) return existing;

                        const id = generateUUID();
                        const newNode: Element = {
                            id,
                            name,
                            tags: args.tags ? (Array.isArray(args.tags) ? args.tags : String(args.tags).split(',')) : [],
                            notes: args.notes || '',
                            attributes: {},
                            customLists: {},
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            // Random position around center
                            x: (window.innerWidth / 2) + (Math.random() - 0.5) * 200,
                            y: (window.innerHeight / 2) + (Math.random() - 0.5) * 200
                        };
                        setElements(prev => [...prev, newNode]);
                        return newNode;

                    case 'delete_node':
                        const targetId = args.id;
                        if (!targetId) return false;
                        setElements(prev => prev.filter(e => e.id !== targetId));
                        setRelationships(prev => prev.filter(r => r.source !== targetId && r.target !== targetId));
                        return true;

                    case 'add_edge':
                        const src = args.source; // ID
                        const tgt = args.target; // ID
                        if (!src || !tgt) throw new Error("Source and Target IDs required");
                        const newRel: Relationship = {
                            id: generateUUID(),
                            source: src,
                            target: tgt,
                            label: args.label || '',
                            direction: 'TO' as any, // Default
                            tags: []
                        };
                        setRelationships(prev => [...prev, newRel]);
                        return newRel;

                    case 'get_neighbors':
                        const nodeId = args.id;
                        const connected = relationships.filter(r => r.source === nodeId || r.target === nodeId);
                        const neighborIds = new Set<string>();
                        connected.forEach(r => {
                            if (r.source === nodeId) neighborIds.add(r.target as string);
                            else neighborIds.add(r.source as string);
                        });
                        return elements.filter(e => neighborIds.has(e.id));

                    case 'get_connections':
                        const tId = args.id as string;
                        const rels = relationships.filter(r => r.source === tId || r.target === tId);
                        return rels.map(r => {
                            const isSource = r.source === tId;
                            const otherId = isSource ? r.target : r.source;
                            const otherNode = elements.find(e => e.id === otherId);
                            // Ensure we return a safe object if the node is missing (zombie link)
                            const safeNeighbor = otherNode || { id: otherId, name: "Unknown", tags: [], notes: "", attributes: {} };

                            let arrow = "---";
                            if (r.direction === "TO") arrow = isSource ? "-->" : "<--";
                            if (r.direction === "FROM") arrow = isSource ? "<--" : "-->";
                            if (r.direction === "BOTH") arrow = "<-->";

                            return {
                                id: r.id,
                                neighbor: safeNeighbor,
                                label: r.label || '',
                                arrow: arrow,
                                isSource: isSource
                            };
                        });

                    case 'set_attribute':
                        if (!args.id || !args.key) throw new Error("ID and Key required");
                        setElements(prev => prev.map(e => {
                            if (e.id === args.id) {
                                return {
                                    ...e,
                                    attributes: { ...e.attributes, [args.key as string]: String(args.value) },
                                    updatedAt: new Date().toISOString()
                                };
                            }
                            return e;
                        }));
                        return true;


                    case 'add_tag':
                        if (!args.id || !args.tag) throw new Error("ID and Tag required");
                        const tagToAdd = normalizeTag(args.tag);
                        setElements(prev => prev.map(e => {
                            if (e.id === args.id && !e.tags.includes(tagToAdd)) {
                                return {
                                    ...e,
                                    tags: [...e.tags, tagToAdd],
                                    updatedAt: new Date().toISOString()
                                };
                            }
                            return e;
                        }));
                        return true;

                    case 'remove_tag':
                        if (!args.id || !args.tag) throw new Error("ID and Tag required");
                        const tagToRemove = normalizeTag(args.tag);
                        setElements(prev => prev.map(e => {
                            if (e.id === args.id) {
                                return {
                                    ...e,
                                    tags: e.tags.filter(t => t !== tagToRemove),
                                    updatedAt: new Date().toISOString()
                                };
                            }
                            return e;
                        }));
                        return true;

                    case 'set_highlight':
                        if (!args.id) throw new Error("ID required");
                        setElements(prev => prev.map(e => {
                            if (e.id === args.id) {
                                return {
                                    ...e,
                                    meta: { ...e.meta, highlightColor: String(args.color || '#facc15') },
                                    updatedAt: new Date().toISOString()
                                };
                            }
                            return e;
                        }));
                        return true;

                    case 'clear_highlight':
                        if (!args.id) throw new Error("ID required");
                        setElements(prev => prev.map(e => {
                            if (e.id === args.id) {
                                const newMeta = { ...(e.meta || {}) };
                                delete newMeta.highlightColor;
                                return {
                                    ...e,
                                    meta: newMeta,
                                    updatedAt: new Date().toISOString()
                                };
                            }
                            return e;
                        }));
                        return true;

                    case 'get_date':
                        return new Date().toLocaleDateString();

                    case 'get_formatted_attributes': {
                        const n = elements.find(e => e.id === args.id);
                        if (!n || !n.attributes) return [];
                        return Object.entries(n.attributes).map(([k, v]) => `${k}: ${v}`);
                    }

                    case 'get_formatted_lists': {
                        const n = elements.find(e => e.id === args.id);
                        if (!n || !n.customLists) return [];
                        return Object.entries(n.customLists).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`);
                    }

                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
            }
        };

        // --- Canvas Tool ---
        const canvasTool: ToolClient = {
            id: 'canvas',
            listActions: () => [
                { name: 'select_node', description: 'Select a node', args: ['id'] },
                { name: 'pan_to_node', description: 'Center camera on node', args: ['id'] },
                { name: 'highlight_node', description: 'Highlight node with color (Transient)', args: ['id', 'color'] },
                { name: 'clear_highlights', description: 'Clear all highlights' },
                { name: 'clear_selection', description: 'Deselect all' }
            ],
            invoke: async (action, args) => {
                switch (action) {
                    case 'select_node':
                        setSelectedElementId(args.id);
                        setMultiSelection(new Set([args.id]));
                        return true;
                    case 'pan_to_node':
                        const el = elementsRef.current.find(e => e.id === args.id);
                        if (el && graphCanvasRef.current) {
                            const cx = window.innerWidth / 2;
                            const cy = window.innerHeight / 2;
                            // Assuming standard zoom 1.5 for focus
                            graphCanvasRef.current.setCamera(-(el.x || 0) + cx, -(el.y || 0) + cy, 1.5);
                        }
                        return !!el;
                    case 'highlight_node':
                        setAnalysisHighlights(prev => {
                            const next = new Map(prev);
                            next.set(args.id, args.color || '#facc15');
                            return next;
                        });
                        return true;
                    case 'clear_highlights':
                        setAnalysisHighlights(new Map());
                        return true;
                    case 'clear_selection':
                        setSelectedElementId(null);
                        setMultiSelection(new Set());
                        return true;
                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
            }
        };

        // --- Markdown Tool ---
        const markdownTool: ToolClient = {
            id: 'markdown',
            listActions: () => [
                { name: 'create_doc', description: 'Create new document', args: ['title', 'content'] },
                { name: 'append_text', description: 'Append text to document', args: ['doc', 'text'] },
                { name: 'open_doc', description: 'Open document in UI', args: ['id'] }
            ],
            invoke: async (action, args) => {
                switch (action) {
                    case 'create_doc':
                        const newId = generateUUID();
                        const now = new Date().toISOString();
                        const doc: TapestryDocument = {
                            id: newId,
                            title: args.title || 'Script Report',
                            content: args.content || '',
                            folderId: null,
                            createdAt: now,
                            updatedAt: now,
                            type: 'text'
                        };
                        setDocuments(prev => [...prev, doc]);
                        return newId;
                    case 'append_text':
                        const query = args.doc; // Title or ID
                        const text = args.text;
                        setDocuments(prev => prev.map(d => {
                            if (d.id === query || d.title === query) {
                                return { ...d, content: d.content + '\n' + text, updatedAt: new Date().toISOString() };
                            }
                            return d;
                        }));
                        return true;
                    case 'open_doc':
                        if (args.id) {
                            onOpenDocument(args.id);
                            return true;
                        }
                        return false;
                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
            }
        };

        toolRegistry.registerTool(graphTool);
        toolRegistry.registerTool(canvasTool);
        toolRegistry.registerTool(markdownTool);

        return () => {
            toolRegistry.unregisterTool('graph');
            toolRegistry.unregisterTool('canvas');
            toolRegistry.unregisterTool('markdown');
        };
    }, [elementsRef, relationshipsRef, documentsRef, setElements, setRelationships, setDocuments, setSelectedElementId, setMultiSelection, setAnalysisHighlights, onOpenDocument]);
};
