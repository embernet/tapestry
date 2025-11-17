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
}

export interface Element {
  id:string;
  name: string;
  type: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ColorScheme {
  id: string;
  name: string;
  tagColors: { [tag: string]: string };
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
}

export interface ModelMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PanelState {
  view: 'details' | 'addRelationship';
  sourceElementId: string | null;
  targetElementId: string | null;
  isNewTarget?: boolean;
}