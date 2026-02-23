import { ToolDefinition } from './types';
import { Type, Schema } from '@google/genai';

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
    addElement: {
        description: "Add a new node to the graph.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Name of the element" },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of tags (max 20 chars each)" },
                notes: { type: Type.STRING, description: "Additional details" },
                rationale: { type: Type.STRING, description: "Why this element is being added" }
            },
            required: ["name"]
        }
    },
    updateElement: {
        description: "Update an existing node's properties.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Name of the element to update" },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of tags (max 20 chars each)" },
                notes: { type: Type.STRING },
                rationale: { type: Type.STRING }
            },
            required: ["name"]
        }
    },
    deleteElement: {
        description: "Delete a node from the graph.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Name of the element to delete" },
                rationale: { type: Type.STRING }
            },
            required: ["name"]
        }
    },
    addRelationship: {
        description: "Connect two nodes with a relationship.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                sourceName: { type: Type.STRING, description: "Name of the source element" },
                targetName: { type: Type.STRING, description: "Name of the target element" },
                label: { type: Type.STRING, description: "Label for the connection (e.g. 'causes')" },
                direction: { type: Type.STRING, enum: ["TO", "FROM", "BOTH", "NONE"], description: "Direction of the relationship" },
                rationale: { type: Type.STRING }
            },
            required: ["sourceName", "targetName", "label"]
        }
    },
    deleteRelationship: {
        description: "Remove a connection between two nodes.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                sourceName: { type: Type.STRING },
                targetName: { type: Type.STRING },
                rationale: { type: Type.STRING }
            },
            required: ["sourceName", "targetName"]
        }
    },
    setElementAttribute: {
        description: "Set a key-value pair attribute on a node.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                elementName: { type: Type.STRING },
                key: { type: Type.STRING },
                value: { type: Type.STRING },
                rationale: { type: Type.STRING }
            },
            required: ["elementName", "key", "value"]
        }
    },
    deleteElementAttribute: {
        description: "Remove a key-value attribute from a node.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                elementName: { type: Type.STRING },
                key: { type: Type.STRING },
                rationale: { type: Type.STRING }
            },
            required: ["elementName", "key"]
        }
    },
    setRelationshipAttribute: {
        description: "Set a key-value pair attribute on a relationship.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                sourceName: { type: Type.STRING },
                targetName: { type: Type.STRING },
                key: { type: Type.STRING },
                value: { type: Type.STRING },
                rationale: { type: Type.STRING }
            },
            required: ["sourceName", "targetName", "key", "value"]
        }
    },
    deleteRelationshipAttribute: {
        description: "Remove a key-value attribute from a relationship.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                sourceName: { type: Type.STRING },
                targetName: { type: Type.STRING },
                key: { type: Type.STRING },
                rationale: { type: Type.STRING }
            },
            required: ["sourceName", "targetName", "key"]
        }
    },
    kanban: {
        description: "Manage Kanban boards and tasks. Use this tool to create boards and organize work.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING, description: "Action: 'createBoard', 'addNode', 'moveNode', 'findNodes'. USE 'addNode' to add an existing graph node to the board. USE 'moveNode' to change the column/board of a node already on a board." },
                boardName: { type: Type.STRING, description: "For 'createBoard': Name of the new board." },
                nodeId: { type: Type.STRING, description: "ID of the node to move or add." },
                nodeName: { type: Type.STRING, description: "Name of node to find or add/move." },
                targetBoardId: { type: Type.STRING, description: "Target board ID." },
                targetColumn: { type: Type.STRING, description: "Target column name (e.g., 'To Do', 'Doing', 'Done')." }
            },
            required: ["action"]
        }
    },
    getCurrentDate: {
        description: "Get the current date and time in ISO 8601 format.",
        parameters: { type: Type.OBJECT, properties: {} }
    },
    searchNodes: {
        description: "Search for nodes in the graph based on name, tags, or timestamps.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING, description: "Text to search for in node name or notes." },
                tag: { type: Type.STRING, description: "Filter by specific tag." },
                createdAfter: { type: Type.STRING, description: "ISO 8601 date string (e.g. '2024-12-01'). Filters nodes created AFTER this date (00:00). To get 'last N days' (inclusive of today), use date = Today - (N-1) days." },
                createdBefore: { type: Type.STRING, description: "ISO 8601 date string (e.g. '2024-12-01'). Filter nodes created BEFORE this date." },
                updatedAfter: { type: Type.STRING, description: "ISO 8601 date string (e.g. '2024-12-01'). Filter nodes updated AFTER this date." },
                updatedBefore: { type: Type.STRING, description: "ISO 8601 date string (e.g. '2024-12-01'). Filter nodes updated BEFORE this date." }
            }
        }
    },
    // Document tools
    readDocument: {
        description: "Read the content of a document.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING }
            },
            required: ["title"]
        }
    },
    createDocument: {
        description: "Create a new document. Content is mandatory.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING, description: "The full Markdown text content of the document." }
            },
            required: ["title", "content"]
        }
    },
    updateDocument: {
        description: "Update an existing document.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING, description: "The full Markdown text content to add or replace." },
                mode: { type: Type.STRING, enum: ["replace", "append", "prepend"], description: "How to apply the content." }
            },
            required: ["title", "content"]
        }
    },
    openTool: {
        description: "Open a specific UI tool in the application.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                tool: { type: Type.STRING, enum: ["triz", "lss", "toc", "ssm", "scamper", "mining", "tagcloud", "swot", "explorer"] },
                subTool: { type: Type.STRING }
            },
            required: ["tool"]
        }
    }
};

// Updated Schema to support DAG Plans
export const CHAT_RESPONSE_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        analysis: { type: Type.STRING, description: "Internal reasoning about the user's request." },
        message: { type: Type.STRING, description: "The conversational response. DO NOT describe plans here. Only use this for greetings, clarifications, or final summaries." },
        plan: {
            type: Type.ARRAY,
            description: "MANDATORY for complex multi-step requests (e.g., 'create a graph', 'analyze this', 'research X'). A Directed Acyclic Graph (DAG) of execution steps. DO NOT describe the plan in the 'message' field; you must populate this array instead.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique ID for this step (e.g., '1', '2', 'step-search')." },
                    description: { type: Type.STRING, description: "Short description of the step." },
                    prompt: { type: Type.STRING, description: "The EXACT instruction to be sent to the AI for this step." },
                    dependencies: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "IDs of steps that must complement before this step starts."
                    }
                },
                required: ["id", "description", "prompt", "dependencies"]
            }
        },
        actions: {
            type: Type.ARRAY,
            description: "List of immediate actions to perform (ONLY for simple, single-step requests). If a 'plan' is present, this array MUST be empty.",
            items: {
                type: Type.OBJECT,
                properties: {
                    tool: { type: Type.STRING, description: "The name of the tool to use (e.g., addElement)." },
                    parameters: { type: Type.STRING, description: "JSON string of key-value pairs for the tool arguments." }
                },
                required: ["tool", "parameters"]
            }
        }
    },
    required: ["analysis", "message", "plan", "actions"]
};

// Strict Schema for Execution Phase (No planning allowed)
export const EXECUTION_RESPONSE_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        analysis: CHAT_RESPONSE_SCHEMA.properties!.analysis,
        message: CHAT_RESPONSE_SCHEMA.properties!.message,
        actions: CHAT_RESPONSE_SCHEMA.properties!.actions
    },
    required: ["analysis", "message", "actions"]
};
