
// Fix: Import d3 types to resolve "Cannot find namespace 'd3'" errors.
import * as d3 from 'd3';

export enum RelationshipDirection {
  None = 'NONE',
  To = 'TO', // Source -> Target
  From = 'FROM', // Target -> Source
}

export interface Relationship {
  id: string;
  source: string; // Element ID
  target: string; // Element ID
  label: string;
  direction: RelationshipDirection;
  tags: string[];
  attributes?: Record<string, string>;
}

export interface Element {
  id:string;
  name: string;
  notes: string;
  tags: string[];
  attributes?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface TapestryDocument {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TapestryFolder {
  id: string;
  name: string;
  parentId: string | null; // For future nested folders
  createdAt: string;
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
}

export type D3Node = Element & d3.SimulationNodeDatum & {
  width?: number;
  height?: number;
};

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  source: string | D3Node;
  target: string | D3Node;
  label: string;
  direction: RelationshipDirection;
  tags: string[];
  attributes?: Record<string, string>;
}

export interface SystemPromptConfig {
  defaultPrompt: string;
  userPrompt: string;
  userContext?: string;
  responseStyle?: string;
  enabledTools?: string[];
}

export interface GlobalSettings {
  toolsBarOpenByDefault: boolean;
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

export interface ModelActions {
  addElement: (data: { name: string; notes?: string; tags?: string[]; attributes?: Record<string, string> }) => string;
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
  createDocument: (title: string, content?: string) => string;
  updateDocument: (title: string, content: string, mode: 'replace' | 'append') => boolean;
  createFolder: (name: string, parentId?: string | null) => string;
  moveDocument: (docId: string, folderId: string | null) => boolean;
}

export interface ScamperSuggestion {
  id: string; // Temporary ID for list management
  name: string;
  description: string;
  relationshipLabel: string;
  status: 'pending' | 'accepted' | 'rejected';
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

// ---

export type TrizToolType = 'contradiction' | 'principles' | 'ariz' | 'sufield' | 'trends' | null;
export type LssToolType = 'dmaic' | '5whys' | 'fishbone' | 'fmea' | 'vsm' | null;
export type TocToolType = 'crt' | 'ec' | 'frt' | 'tt' | null;
export type SsmToolType = 'rich_picture' | 'catwoe' | 'activity_models' | 'comparison' | null;
export type SwotToolType = 'matrix' | null;
export type MiningToolType = 'dashboard' | null;
export type TagCloudToolType = 'cloud' | null;
