
import { useRef, useEffect, useCallback } from 'react';
import { FunctionCall, FunctionResponse } from '@google/genai';
import { ModelActions, Element, Relationship, KanbanBoard } from '../../types';
import { createKanbanBoard, generateUUID } from '../../utils';
import { parseParameters } from './utils';

interface UseChatToolsProps {
    modelActions: ModelActions;
    elements: Element[];
    relationships: Relationship[];
    kanbanBoards: KanbanBoard[];
    setKanbanBoards: React.Dispatch<React.SetStateAction<KanbanBoard[]>>;
    activeKanbanBoardId: string | null;
    setActiveKanbanBoardId: (id: string | null) => void;
    onOpenTool?: (tool: string, subTool?: string) => void;
}

export const useChatTools = ({
    modelActions,
    elements,
    relationships,
    kanbanBoards,
    setKanbanBoards,
    activeKanbanBoardId,
    setActiveKanbanBoardId,
    onOpenTool
}: UseChatToolsProps) => {

    // Ref to track latest state for async operations (Kanban)
    const kanbanBoardsRef = useRef<KanbanBoard[]>([]);

    useEffect(() => {
        if (kanbanBoards) kanbanBoardsRef.current = kanbanBoards;
    }, [kanbanBoards]);

    const executeFunctionCalls = useCallback((functionCalls: FunctionCall[]) => {
        const responses: FunctionResponse[] = [];

        functionCalls.forEach((call) => {
            let result: any;
            const args = parseParameters(call.args);

            try {
                switch (call.name) {
                    case 'addElement':
                        console.log('[DEBUG] useChatTools calling addElement with', args);
                        const id = modelActions.addElement(args);
                        result = { success: true, message: `Added element '${args.name}' with ID ${id}` };
                        break;
                    case 'updateElement':
                        const updated = modelActions.updateElement(args.name as string, args);
                        result = { success: updated, message: updated ? `Updated '${args.name}'` : `Could not find element '${args.name}'` };
                        break;
                    case 'deleteElement':
                        const deleted = modelActions.deleteElement(args.name as string);
                        result = { success: deleted, message: deleted ? `Deleted '${args.name}'` : `Could not find element '${args.name}'` };
                        break;
                    case 'addRelationship':
                        if (args.sourceName && args.targetName) {
                            const relAdded = modelActions.addRelationship(
                                args.sourceName,
                                args.targetName,
                                args.label || '',
                                args.direction
                            );
                            result = { success: relAdded, message: relAdded ? `Connected '${args.sourceName}' to '${args.targetName}'` : `Failed to connect. Check nodes.` };
                        } else {
                            result = { success: false, message: "Missing sourceName or targetName" };
                        }
                        break;
                    case 'deleteRelationship':
                        const relDeleted = modelActions.deleteRelationship(args.sourceName, args.targetName);
                        result = { success: relDeleted, message: relDeleted ? `Removed connection.` : `Connection not found.` };
                        break;
                    case 'setElementAttribute':
                        const elAttrSet = modelActions.setElementAttribute(args.elementName, args.key, args.value);
                        result = { success: elAttrSet, message: elAttrSet ? `Attribute set.` : `Element not found` };
                        break;
                    case 'deleteElementAttribute':
                        const elAttrDel = modelActions.deleteElementAttribute(args.elementName, args.key);
                        result = { success: elAttrDel, message: elAttrDel ? `Attribute deleted.` : `Element not found` };
                        break;
                    case 'setRelationshipAttribute':
                        const relAttrSet = modelActions.setRelationshipAttribute(args.sourceName, args.targetName, args.key, args.value);
                        result = { success: relAttrSet, message: relAttrSet ? `Attribute set.` : `Relationship not found` };
                        break;
                    case 'deleteRelationshipAttribute':
                        const relAttrDel = modelActions.deleteRelationshipAttribute(args.sourceName, args.targetName, args.key);
                        result = { success: relAttrDel, message: relAttrDel ? `Attribute deleted.` : `Relationship not found` };
                        break;
                    case 'readDocument':
                        const content = modelActions.readDocument(args.title);
                        result = { success: content !== null, content: content !== null ? content : "Document not found." };
                        break;
                    case 'createDocument':
                        const newDocId = modelActions.createDocument(args.title, args.content);
                        result = { success: true, message: `Created document '${args.title}' (ID: ${newDocId}).`, docId: newDocId };
                        break;
                    case 'updateDocument':
                        const docUpdated = modelActions.updateDocument(args.title, args.content, args.mode);
                        result = { success: docUpdated, message: docUpdated ? `Updated document '${args.title}'.` : "Document not found." };
                        break;
                    case 'kanban': {
                        const action = args.action;

                        if (action === 'createBoard') {
                            if (!args.boardName) throw new Error("boardName is required for createBoard");
                            const boardName = args.boardName.trim();
                            const existingBoard = kanbanBoardsRef.current.find(b => b.name.toLowerCase() === boardName.toLowerCase());
                            if (existingBoard) {
                                result = { success: true, message: `Board "${boardName}" already exists (ID: ${existingBoard.id}). Set as active.` };
                                setActiveKanbanBoardId(existingBoard.id);
                            } else {
                                const newBoard = createKanbanBoard(boardName);
                                setKanbanBoards(prev => [...prev, newBoard]);
                                setActiveKanbanBoardId(newBoard.id);
                                kanbanBoardsRef.current = [...kanbanBoardsRef.current, newBoard];
                                result = { success: true, message: `Created board "${boardName}" (ID: ${newBoard.id}) and set as active.` };
                            }
                        }

                        if (action === 'moveNode' || action === 'addNode' || action === 'addToBoard') {
                            let boardId = args.targetBoardId || args.boardName || activeKanbanBoardId;
                            const currentBoards = kanbanBoardsRef.current;
                            let board = currentBoards.find(b => b.id === boardId);
                            if (!board && boardId) {
                                board = currentBoards.find(b => b.name.toLowerCase() === boardId.toLowerCase());
                            }
                            if (!board) {
                                if (!args.targetBoardId && !args.boardName && activeKanbanBoardId) {
                                    board = currentBoards.find(b => b.id === activeKanbanBoardId);
                                }
                            }
                            if (!board) throw new Error(`Board not found: "${boardId}". Available boards: ${currentBoards.map(b => b.name).join(', ')}`);

                            const targetColumn = args.targetColumn || board.columns[0];
                            if (!board.columns.includes(targetColumn)) throw new Error(`Column "${targetColumn}" does not exist on board "${board.name}". Columns: ${board.columns.join(', ')}`);

                            let elementName = args.nodeName;
                            if (args.nodeId) {
                                const el = elements.find(e => e.id === args.nodeId);
                                if (el) elementName = el.name;
                            }
                            if (!elementName) throw new Error("nodeName or nodeId is required.");

                            const exists = modelActions.hasElement(elementName);
                            if ((action === 'addNode' || action === 'addToBoard') && !exists) {
                                modelActions.addElement({ name: elementName });
                            } else if (action === 'moveNode' && !exists) {
                                throw new Error(`Node "${elementName}" not found.`);
                            }

                            const success = modelActions.setElementAttribute(elementName, board.attributeKey, targetColumn);
                            if (!success) throw new Error(`Failed to update node "${elementName}".`);

                            result = { success: true, message: `Added/Moved node "${elementName}" to "${targetColumn}" on "${board.name}" (Key: ${board.attributeKey}).` };
                        }

                        if (action === 'findNodes') {
                            const boardId = args.boardId || activeKanbanBoardId;
                            const board = kanbanBoardsRef.current.find(b => b.id === boardId);
                            if (!board) throw new Error("Board not found.");
                            const columnFilter = args.column;
                            const found = elements.filter(e => {
                                const status = e.attributes?.[board.attributeKey];
                                if (!status) return false;
                                if (columnFilter && status !== columnFilter) return false;
                                return true;
                            }).map(e => ({ name: e.name, status: e.attributes?.[board.attributeKey] }));
                            result = { success: true, message: `Found ${found.length} nodes in board "${board.name}":\n` + found.map(f => `- ${f.name} (${f.status})`).join('\n') };
                        }

                        if (!result) {
                            result = { success: true, message: `Kanban action "${action}" processed.` };
                        }
                        break;
                    }
                    case 'getCurrentDate':
                        result = { success: true, date: new Date().toISOString() };
                        break;
                    case 'openTool':
                        if (onOpenTool) {
                            onOpenTool(args.tool, args.subTool);
                            result = { success: true, message: `Opened tool ${args.tool}` };
                        } else {
                            result = { success: false, message: "Tool opening not supported" };
                        }
                        break;
                    case 'searchNodes': {
                        let results = elements;
                        if (args.query) {
                            const q = args.query.toLowerCase();
                            results = results.filter(e => e.name.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q));
                        }
                        if (args.tag) {
                            const t = args.tag.toLowerCase();
                            results = results.filter(e => e.tags.some(tag => tag.toLowerCase() === t));
                        }
                        const validateDate = (d: string, name: string) => {
                            const time = new Date(d).getTime();
                            if (isNaN(time)) throw new Error(`Invalid date format for '${name}': "${d}". use ISO 8601 (YYYY-MM-DD).`);
                            return time;
                        };
                        if (args.createdAfter) {
                            const date = validateDate(args.createdAfter, 'createdAfter');
                            results = results.filter(e => new Date(e.createdAt).getTime() > date);
                        }
                        if (args.createdBefore) {
                            const date = validateDate(args.createdBefore, 'createdBefore');
                            results = results.filter(e => new Date(e.createdAt).getTime() < date);
                        }
                        if (args.updatedAfter) {
                            const date = validateDate(args.updatedAfter, 'updatedAfter');
                            results = results.filter(e => new Date(e.updatedAt).getTime() > date);
                        }
                        if (args.updatedBefore) {
                            const date = validateDate(args.updatedBefore, 'updatedBefore');
                            results = results.filter(e => new Date(e.updatedAt).getTime() < date);
                        }

                        if (results.length === 0) {
                            result = { success: true, message: "No nodes found matching criteria." };
                        } else {
                            const summary = results.map(e => `- ${e.name} (Created: ${e.createdAt})`).join('\n');
                            result = { success: true, message: `Found ${results.length} nodes:\n${summary}` };
                        }
                        break;
                    }
                    default:
                        result = { success: false, message: "Unknown function" };
                }
            } catch (e: any) {
                result = { success: false, message: `Error executing ${call.name}: ${e.message || e}` };
            }

            responses.push({
                name: call.name,
                id: call.id,
                response: { result }
            });
        });
        return responses;
    }, [modelActions, elements, relationships, kanbanBoardsRef, activeKanbanBoardId, onOpenTool, setKanbanBoards, setActiveKanbanBoardId]);

    return { executeFunctionCalls };
};
