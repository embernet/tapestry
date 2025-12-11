
import { FunctionCall, FunctionResponse } from '@google/genai';

export enum RelationshipDirection {
  None = 'NONE',
  To = 'TO', // Source -> Target
  From = 'FROM', // Target -> Source
  Both = 'BOTH', // Source <-> Target
}

export type NodeShape = 'rectangle' | 'oval' | 'circle' | 'point';

export interface Relationship {
  id: string;
  source: string; // Element ID
  target: string; // Element ID
  label: string;
  direction: RelationshipDirection;
  tags: string[];
  attributes?: Record<string, string>;
  meta?: {
    highlightColor?: string;
    [key: string]: any;
  };
}

export interface Element {
  id:string;
  name: string;
  notes: string;
  tags: string[];
  attributes?: Record<string, string>;
  customLists?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  meta?: {
    highlightColor?: string;
    [key: string]: any;
  };
}

export interface TapestryDocument {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  type?: 'text' | 'swot-analysis' | 'triz-analysis' | 'scamper-analysis' | string;
  data?: any; // Structured data for tools (e.g. SWOT arrays)
}

export interface TapestryFolder {
  id: string;
  name: string;
  parentId: string | null; // For future nested folders
  createdAt: string;
}

export interface MermaidDiagram {
  id: string;
  title: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  tool: string;
  subTool?: string;
  toolParams?: any;
  timestamp: string;
  content: string;
  summary?: string;
}

export interface PlanStep {
  id: string;
  description: string;
  prompt: string; // The specific instruction for the AI agent for this step
  dependencies: string[]; // IDs of steps that must finish first
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  result?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text?: string;
  functionCalls?: FunctionCall[]; // To display tool usage
  functionResponses?: FunctionResponse[];
  isPending?: boolean; // If true, the tool calls are waiting for user confirmation
  // Store raw JSON if available for history reconstruction
  rawJson?: any;
  requestPayload?: any; // Store the raw request sent to the AI
  plan?: PlanStep[]; // If this message proposed a plan
  isVerbose?: boolean; // Debug logging for plan execution
}

export interface RelationshipDefinition {
  label: string;
  description?: string;
}

export interface ColorScheme {
  id: string;
  name: string;
  tagColors: { [tag: string]: string };
  tagDescriptions?: { [tag: string]: string };
  relationshipDefinitions?: RelationshipDefinition[];
  relationshipLabels?: string[]; // Legacy support
  defaultRelationshipLabel?: string;
  customLists?: Record<string, string[]>;
  customListDescriptions?: Record<string, string>;
}

export interface SimulationNodeDatum {
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export type D3Node = Element & SimulationNodeDatum & {
  width?: number;
  height?: number;
};

export interface SimulationLinkDatum<NodeDatum extends SimulationNodeDatum> {
  source: NodeDatum | string | number;
  target: NodeDatum | string | number;
  index?: number;
}

export type D3Link = SimulationLinkDatum<D3Node> & Relationship;

export interface SystemPromptConfig {
  defaultPrompt: string;
  userPrompt: string;
  userContext?: string;
  responseStyle?: string;
  enabledTools?: string[];
  toolPrompts?: Record<string, string>;
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'grok' | 'ollama' | 'custom';

export interface AIConnection {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  modelId: string;
}

export interface AIConfig {
    provider: string;
    apiKey: string;
    modelId: string;
    baseUrl?: string;
    language?: string;
}

export interface CustomStrategyCategory {
  id: string;
  label: string;
  tag: string;
  colorName: string; // e.g., 'Red', 'Blue'
  color: string; // text class
  borderColor: string; // border class
}

export interface CustomStrategyTool {
  id: string;
  name: string;
  description: string;
  basePrompt: string;
  categories: CustomStrategyCategory[];
  gridCols: string;
}

export interface GlobalSettings {
  toolsBarOpenByDefault: boolean;
  theme: 'light' | 'dark';
  activeProvider: AIProvider;
  aiConnections: Record<AIProvider, AIConnection>;
  customStrategies: CustomStrategyTool[];
  language: string;
  githubToken?: string;
}

// --- Scripting Types ---

export interface Script {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptSnippet {
    id: string;
    name: string;
    description: string;
    code: string;
    isSystem: boolean;
}

export interface ActionDescriptor {
  name: string;
  description?: string;
  args?: string[]; // Simplified arg list for hints
}

export interface ToolClient {
  id: string;
  listActions(): ActionDescriptor[];
  invoke(action: string, args: Record<string, any>): Promise<any>;
}

export interface ToolRegistry {
  registerTool(tool: ToolClient): void;
  getTool(id: string): ToolClient | undefined;
  listTools(): ToolClient[];
  unregisterTool(id: string): void;
}

export interface ToolActionEvent {
  toolId: string;
  action: string;
  args: Record<string, any>;
  result?: any;
}

// --- Views ---

export interface TagFilterState {
    included: string[]; 
    excluded: string[];
}

export interface GraphView {
  id: string;
  name: string;
  description?: string;
  // Visual Identity
  tapestryPrompt?: string; 
  tapestrySvg?: string;    
  tapestryVisible: boolean;
  // Configuration
  filters: {
     tags: TagFilterState;
     date: DateFilterState;
     nodeFilter: NodeFilterState;
  };
  // Curated Content
  explicitInclusions: string[]; 
  explicitExclusions: string[]; 
  // Camera State
  camera?: { x: number, y: number, k: number };
}

export interface ModelMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  filename?: string;
  contentHash?: string; // Used to detect if content has changed
  lastDiskHash?: string; // Used to detect if content has changed since last disk save
}

export interface PanelState {
  view: 'details' | 'addRelationship';
  sourceElementId: string | null;
  targetElementId: string | null;
  isNewTarget?: boolean;
}

export interface DateFilterState {
  createdAfter: string;
  createdBefore: string;
  updatedAfter: string;
  updatedBefore: string;
}

export interface NodeFilterState {
  centerId: string | null;
  hops: number;
  active: boolean;
}

export interface ModelActions {
  addElement: (data: { name: string; notes?: string; tags?: string[]; attributes?: Record<string, string>; customLists?: Record<string, string[]>; x?: number; y?: number }) => string;
  updateElement: (name: string, data: Partial<Element>) => boolean;
  deleteElement: (name: string) => boolean;
  addRelationship: (sourceName: string, targetName: string, label: string, direction?: string) => boolean;
  deleteRelationship: (sourceName: string, targetName: string) => boolean;
  setElementAttribute: (elementName: string, key: string, value: string) => boolean;
  deleteElementAttribute: (elementName: string, key: string) => boolean;
  setRelationshipAttribute: (sourceName: string, targetName: string, key: string, value: string) => boolean;
  deleteRelationshipAttribute: (sourceName: string, targetName: string, key: string) => boolean;
  
  // Document Actions
  readDocument: (title: string) => string | null;
  createDocument: (title: string, content?: string, type?: string, data?: any) => string;
  updateDocument: (title: string, content: string, mode: 'replace' | 'append' | 'prepend') => boolean;
  createFolder: (name: string, parentId?: string | null) => string;
  moveDocument: (docId: string, folderId: string | null) => boolean;
}

export interface ScamperSuggestion {
  id: string; // Temporary ID for list management
  name: string;
  description: string;
  relationshipLabel: string;
  status: 'pending' | 'accepted' | 'rejected';
  actionLog?: string;
}

export interface PanelLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  isFloating: boolean;
}

// --- New Feature Types ---

export type SimulationNodeState = 'neutral' | 'increased' | 'decreased';

export interface StorySlide {
  id: string;
  title: string;
  description: string;
  camera: { x: number; y: number; k: number };
  selectedElementId: string | null;
}

export interface GuidanceSection {
  title?: string;
  text?: string;
  items?: string[];
}

export interface GuidanceContent {
  title: string;
  sections: GuidanceSection[];
}

// --- CSV Import Types ---
export type CsvColumnMappingType = 'ignore' | 'id' | 'name' | 'notes' | 'tags' | 'attribute' | 'list' | 'relationship' | 'source' | 'target' | 'label' | 'x' | 'y' | 'created' | 'updated';

export interface CsvColumnConfig {
    index: number;
    header: string;
    mappingType: CsvColumnMappingType;
    separator?: string; // For lists and relationship targets
    attributeKey?: string; // For attributes and relationships (the rel label)
}

export interface CsvImportStats {
    nodesCreated: number;
    nodesUpdated: number;
    relationshipsCreated: number;
    relationshipsUpdated: number;
    errors: string[];
}

// ---

export type TrizToolType = 'contradiction' | 'principles' | 'ariz' | 'sufield' | 'trends' | null;
export type LssToolType = 'charter' | 'sipoc' | 'voc' | 'ctq' | 'stakeholder' | 'dmaic' | '5whys' | 'fishbone' | 'fmea' | 'vsm' | null;
export type TocToolType = 'crt' | 'ec' | 'frt' | 'tt' | null;
export type SsmToolType = 'rich_picture' | 'catwoe' | 'activity_models' | 'comparison' | null;
export type SwotToolType = 'matrix' | 'pestel' | 'steer' | 'destep' | 'longpest' | 'five_forces' | 'cage' | 'custom_create' | string | null;
export type ExplorerToolType = 'tags' | 'relationships' | 'sunburst' | 'matrix' | 'table' | 'random_walk' | null;
export type TagCloudToolType = 'tags' | 'nodes' | 'words' | 'full_text' | null;
export type DataToolType = 'csv' | 'markdown' | 'json' | null;
export type MiningToolType = 'dashboard' | null;
export type MermaidToolType = 'editor' | null;
export type VisualiseToolType = 'grid' | 'mermaid' | 'circle_packing' | 'treemap' | null;