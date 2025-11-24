
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import * as d3 from 'd3';
import { Element, Relationship, ColorScheme, D3Node, D3Link, RelationshipDirection, SimulationNodeState } from '../types';
import { LINK_DISTANCE, NODE_MAX_WIDTH, NODE_PADDING, DEFAULT_NODE_COLOR } from '../constants';

interface GraphCanvasProps {
  elements: Element[];
  relationships: Relationship[];
  onNodeClick: (elementId: string, event: MouseEvent) => void;
  onLinkClick: (relationshipId: string) => void;
  onCanvasClick: () => void;
  onCanvasDoubleClick: (coords: { x: number, y: number }) => void;
  onNodeContextMenu: (event: React.MouseEvent, elementId: string) => void;
  onCanvasContextMenu: (event: React.MouseEvent) => void;
  onNodeConnect: (sourceId: string, targetId: string) => void;
  onNodeConnectToNew: (sourceId: string, coords: { x: number, y: number }) => void;
  activeColorScheme: ColorScheme | undefined;
  selectedElementId: string | null;
  multiSelection: Set<string>;
  selectedRelationshipId: string | null;
  focusMode: 'narrow' | 'wide' | 'zoom';
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  isPhysicsModeActive: boolean;
  layoutParams: { linkDistance: number; repulsion: number };
  onJiggleTrigger?: number;
  isBulkEditActive: boolean;
  simulationState?: Record<string, SimulationNodeState>;
  analysisHighlights?: Map<string, string>;
}

export interface GraphCanvasRef {
  getFinalNodePositions: () => { id: string; x: number; y: number }[];
  zoomToFit: () => void;
  getCamera: () => { x: number; y: number; k: number };
  setCamera: (x: number, y: number, k: number) => void;
}

/**
 * Calculates the intersection point of a line (from source to target) with the
 * bounding box of the source node.
 */
function getRectIntersection(sNode: D3Node, tNode: { x?: number; y?: number }) {
    const { x: sx, y: sy, width: sw = 0, height: sh = 0 } = sNode;
    const { x: tx, y: ty } = tNode;

    if (sx === undefined || sy === undefined || tx === undefined || ty === undefined) {
        return { x: sx ?? 0, y: sy ?? 0 };
    }

    const dx = tx - sx;
    const dy = ty - sy;
    
    const w = sw / 2;
    const h = sh / 2;

    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
      return { x: sx, y: sy };
    }

    let x, y;

    if (Math.abs(dy) * w > Math.abs(dx) * h) {
        // Intersects with top or bottom side
        const sign = dy > 0 ? 1 : -1;
        y = sy + sign * h;
        x = sx + dx * (sign * h / dy);
    } else {
        // Intersects with left or right side
        const sign = dx > 0 ? 1 : -1;
        x = sx + sign * w;
        y = sy + dy * (sign * w / dx);
    }
    
    return { x, y };
}

const createDragHandler = (
  setElementsState: React.Dispatch<React.SetStateAction<Element[]>>,
  onNodeClickCallback: (elementId: string, event: MouseEvent) => void,
  onNodeConnectCallback: (sourceId: string, targetId: string) => void,
  onNodeConnectToNew: (sourceId: string, coords: { x: number, y: number }) => void
) => {
  let isMoving = false; // Flag to track drag mode
  let hasMoved = false; // Flag to distinguish click from drag
  let startX = 0;
  let startY = 0;

  function dragstarted(this: SVGGElement, event: any, d: D3Node) {
    const target = event.sourceEvent.target as SVGElement;
    isMoving = target.classList.contains('move-zone');
    
    hasMoved = false;
    const e = event as any;
    startX = e.x;
    startY = e.y;

    // Pin the node during any drag operation to prevent interference from the simulation
    d.fx = d.x;
    d.fy = d.y;
    
    if (!isMoving) {
      // It's a connect drag. Draw a temporary line from edge to actual mouse pointer.
      // We use d3.pointer to get coordinates relative to the parent group (model space)
      const parent = this.parentNode as SVGGElement;
      const [mx, my] = d3.pointer(event.sourceEvent, parent);
      
      const start = getRectIntersection(d, { x: mx, y: my });

      d3.select(this.ownerSVGElement).select('g')
        .append('path')
        .attr('class', 'temp-drag-line')
        .attr('d', `M${start.x},${start.y} L${mx},${my}`)
        .attr('stroke', '#a5b4fc')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('pointer-events', 'none');
    }
  }

  function dragged(this: SVGGElement, event: any, d: D3Node) {
    const e = event as any;
    // Check for significant movement to determine if this is a drag or a click
    if (!hasMoved && (Math.abs(e.x - startX) > 3 || Math.abs(e.y - startY) > 3)) {
        hasMoved = true;
    }

    if (isMoving) {
      // For a move drag, update the node's fixed position.
      d.fx = e.x;
      d.fy = e.y;
    } else {
      // For a connect drag, use absolute mouse pointer position
      const parent = this.parentNode as SVGGElement;
      const [mx, my] = d3.pointer(event.sourceEvent, parent);
      
      const start = getRectIntersection(d, { x: mx, y: my });
      d3.select(this.ownerSVGElement).select('.temp-drag-line')
        .attr('d', `M${start.x},${start.y} L${mx},${my}`);
    }
  }

  function dragended(this: SVGGElement, event: any, d: D3Node) {
    setElementsState(prev => prev.map(e => e.id === d.id ? { ...e, fx: d.fx, fy: d.fy } : e));
    
    if (!isMoving) {
        const tempLine: any = d3.select(this.ownerSVGElement).select('.temp-drag-line');
        if (tempLine) tempLine.remove();
    }

    // If we haven't moved significantly, treat it as a click
    if (!hasMoved) {
        onNodeClickCallback(d.id, event.sourceEvent);
        return; 
    }

    // If we moved, and it wasn't a move-zone drag (meaning it was a connect drag)
    if (!isMoving) {
        const dropTargetElement = event.sourceEvent.target as HTMLElement;
        const dropNodeElement = dropTargetElement?.closest('.node');
        const dropNodeSelection = dropNodeElement ? d3.select(dropNodeElement) : d3.select(null as any);

        const dropNode = !dropNodeSelection.empty() ? (dropNodeSelection as any).datum() as D3Node : null;
        
        if (dropNode && dropNode.id !== d.id) {
            onNodeConnectCallback(d.id, dropNode.id);
        } else {
            const parent = this.parentNode as SVGGElement;
            const [mx, my] = d3.pointer(event.sourceEvent, parent);
            onNodeConnectToNew(d.id, { x: mx, y: my });
        }
    }
  }

  return d3.drag<SVGGElement, D3Node>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};

const createPhysicsDragHandler = (simulation: d3.Simulation<D3Node, D3Link>, onNodeClickCallback: (elementId: string, event: MouseEvent) => void) => {
  let startX = 0;
  let startY = 0;
  let hasMoved = false;

  function dragstarted(event: any, d: D3Node) {
    if (!event.active) {
      simulation.alphaTarget(0.3);
      (simulation as any).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
    const e = event as any;
    startX = e.x;
    startY = e.y;
    hasMoved = false;
  }

  function dragged(event: any, d: D3Node) {
    const e = event as any;
    d.fx = e.x;
    d.fy = e.y;
    if (!hasMoved && (Math.abs(e.x - startX) > 3 || Math.abs(e.y - startY) > 3)) {
        hasMoved = true;
    }
  }

  function dragended(event: any, d: D3Node) {
    if (!event.active) simulation.alphaTarget(0);
    
    // In physics mode, typical D3 drag swallows click events. 
    // We manually trigger click if no movement occurred.
    if (!hasMoved) {
        onNodeClickCallback(d.id, event.sourceEvent);
    }
    d.fx = null;
    d.fy = null;
  }

  return d3.drag<SVGGElement, D3Node>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};

const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(({
  elements,
  relationships,
  onNodeClick,
  onLinkClick,
  onCanvasClick,
  onCanvasDoubleClick,
  onNodeContextMenu,
  onCanvasContextMenu,
  onNodeConnect,
  onNodeConnectToNew,
  activeColorScheme,
  selectedElementId,
  multiSelection,
  selectedRelationshipId,
  focusMode,
  setElements,
  isPhysicsModeActive,
  layoutParams,
  onJiggleTrigger,
  isBulkEditActive,
  simulationState,
  analysisHighlights
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  const internalZoomToFit = (nodesToFit?: D3Node[], limitMaxZoom = false) => {
    if (!svgRef.current || !gRef.current || !simulationRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    const sim = simulationRef.current as any;
    const nodes: D3Node[] = nodesToFit || sim.nodes();

    if (nodes.length === 0) return;

    const { width, height } = svgRef.current.getBoundingClientRect();

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const nodeWidth = node.width || NODE_MAX_WIDTH;
      const nodeHeight = node.height || 80;
      minX = Math.min(minX, (node.x || 0) - nodeWidth / 2);
      minY = Math.min(minY, (node.y || 0) - nodeHeight / 2);
      maxX = Math.max(maxX, (node.x || 0) + nodeWidth / 2);
      maxY = Math.max(maxY, (node.y || 0) + nodeHeight / 2);
    });

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    if (boundsWidth <= 0 || boundsHeight <= 0) return;

    // Increased padding from 0.9 to 0.8 to provide more space around the model
    const padding = 0.8;
    let scale = padding * Math.min(width / boundsWidth, height / boundsHeight);
    
    if (limitMaxZoom && scale > 1) {
      scale = 1;
    }
    
    const translateX = width / 2 - scale * (minX + boundsWidth / 2);
    const translateY = height / 2 - scale * (minY + boundsHeight / 2);
    
    const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);

    svg.transition()
       .duration(750)
       .call(zoomRef.current.transform as any, transform);
  };

  useImperativeHandle(ref, () => ({
    getFinalNodePositions: () => {
      const sim = simulationRef.current;
      if (sim) {
        const nodes = (sim as any).nodes();
        return nodes.map((node: D3Node) => ({
          id: node.id,
          x: node.x!,
          y: node.y!
        }));
      }
      return [];
    },
    zoomToFit: (nodes?: any, limit?: boolean) => internalZoomToFit(nodes, limit),
    getCamera: () => {
        const transform = d3.zoomTransform(svgRef.current!);
        return { x: transform.x, y: transform.y, k: transform.k };
    },
    setCamera: (x: number, y: number, k: number) => {
        if (!svgRef.current || !zoomRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.transition().duration(750).call(zoomRef.current.transform as any, d3.zoomIdentity.translate(x, y).scale(k));
    }
  }));

  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (multiSelection.size > 0) {
        // If multi-selection is active, highlight all selected nodes
        multiSelection.forEach(id => {
            ids.add(id);
        });
        // Highlight internal connections between selected nodes if multiple
        if (multiSelection.size > 1) {
             relationships.forEach(rel => {
                if (multiSelection.has(rel.source as string) && multiSelection.has(rel.target as string)) {
                    // Keep them visible, effectively handled by node opacity check logic
                }
            });
        }
        // Ensure primary selection connections shown if only one
        if (multiSelection.size === 1 && selectedElementId) {
             relationships.forEach(rel => {
                if (rel.source === selectedElementId) ids.add(rel.target as string);
                if (rel.target === selectedElementId) ids.add(rel.source as string);
            });
        }
    } else if (selectedRelationshipId) {
        const rel = relationships.find(r => r.id === selectedRelationshipId);
        if (rel) {
            ids.add(rel.source as string);
            ids.add(rel.target as string);
        }
    }
    return ids;
  }, [selectedElementId, selectedRelationshipId, relationships, multiSelection]);

  useEffect(() => {
    if (focusMode === 'zoom' && highlightedNodeIds.size > 0 && simulationRef.current) {
        const sim = simulationRef.current as any;
        const nodesToFit = sim.nodes().filter((n: D3Node) => highlightedNodeIds.has(n.id));
        if (nodesToFit.length > 0) {
            internalZoomToFit(nodesToFit, true);
        }
    }
  }, [focusMode, highlightedNodeIds]);

  // Respond to layout param changes
  useEffect(() => {
      if (simulationRef.current && isPhysicsModeActive) {
          const sim = simulationRef.current;
          
          // Update existing forces rather than replacing them to maintain state
          const linkForce = sim.force('link') as d3.ForceLink<D3Node, D3Link>;
          if (linkForce) {
              linkForce.distance(layoutParams.linkDistance);
          }

          const chargeForce = sim.force('charge') as d3.ForceManyBody<D3Node>;
          if (chargeForce) {
              chargeForce.strength(layoutParams.repulsion);
          }

          sim.alpha(0.3).restart();
      }
  }, [layoutParams, isPhysicsModeActive]);

  // Respond to jiggle trigger
  useEffect(() => {
      if (onJiggleTrigger && simulationRef.current && isPhysicsModeActive) {
          const sim = simulationRef.current;
          sim.alpha(0.5).restart();
      }
  }, [onJiggleTrigger, isPhysicsModeActive]);

  const handleCanvasContextMenu = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('.node') || target.closest('.link-label-group')) {
        return;
    }
    onCanvasContextMenu(event);
  };

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const { width, height } = svgRef.current.getBoundingClientRect();

    const linkGroup = g.selectAll('g.links').data([null]).join('g').attr('class', 'links');
    const labelGroup = g.selectAll('g.labels').data([null]).join('g').attr('class', 'labels');
    const nodeGroup = g.selectAll('g.nodes').data([null]).join('g').attr('class', 'nodes');

    const lowerCaseTagColors: { [key: string]: string } = {};
    if (activeColorScheme) {
      for (const tag in activeColorScheme.tagColors) {
        lowerCaseTagColors[tag.toLowerCase()] = activeColorScheme.tagColors[tag];
      }
    }

    if (!simulationRef.current) {
        simulationRef.current = d3.forceSimulation<D3Node>([]);
    }
    
    const simulation = simulationRef.current;
    
    const simGetter = simulation as any;
    const existingNodesMap = new Map((simGetter.nodes() as D3Node[]).map((node: D3Node) => [node.id, node]));
    const d3Nodes = elements.map(element => {
      const existingNode = existingNodesMap.get(element.id);
      if (existingNode) {
        return Object.assign(existingNode, element);
      } else {
        return {
            ...element,
            x: element.x ?? width / 2,
            y: element.y ?? height / 2,
        };
      }
    });

    const d3Links: D3Link[] = relationships.map(rel => ({ ...rel, source: rel.source, target: rel.target }));

    simulation.nodes(d3Nodes);
    
    const link = linkGroup.selectAll<SVGPathElement, D3Link>('.link')
      .data(d3Links, d => d.id)
      .join('path')
      .attr('class', 'link')
      .attr('stroke', d => (d.id === selectedRelationshipId ? '#60a5fa' : '#6b7280'))
      .attr('stroke-width', d => (d.id === selectedRelationshipId ? 3 : 2))
      .attr('fill', 'none')
      .attr('marker-end', d => (d.direction === RelationshipDirection.To ? 'url(#arrow)' : null))
      .attr('marker-start', d => (d.direction === RelationshipDirection.From ? 'url(#arrow-rev)' : null))
      .style('transition', 'opacity 0.3s ease, stroke 0.2s ease, stroke-width 0.2s ease')
      .attr('opacity', l => {
        if (focusMode === 'narrow') return 1.0;
        if (multiSelection.size === 0 && !selectedElementId && !selectedRelationshipId) return 1.0;
        if (selectedRelationshipId) return l.id === selectedRelationshipId ? 1.0 : 0.2;
        
        const sourceId = typeof l.source === 'object' ? (l.source as D3Node).id : l.source as string;
        const targetId = typeof l.target === 'object' ? (l.target as D3Node).id : l.target as string;
        
        // Highlight link if connected to selection
        const isConnectedToSelection = multiSelection.has(sourceId) || multiSelection.has(targetId);
        return isConnectedToSelection ? 1.0 : 0.2;
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onLinkClick(d.id);
      })
      .style('cursor', 'pointer');

    labelGroup.selectAll<SVGTextElement, D3Link>('.link-label-group')
      .data(d3Links, d => d.id)
      .join(
        enter => {
          const textGroup = enter.append('text')
            .attr('class', 'link-label-group')
            .attr('dy', -5);

          textGroup.append('textPath')
            .attr('class', 'link-label')
            .attr('xlink:href', d => `#${d.id}`)
            .attr('startOffset', '50%')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text(d => d.label);
          
          return textGroup;
        },
        update => {
            update.select('.link-label').text(d => d.label);
            return update;
        }
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        onLinkClick(d.id);
      })
      .style('cursor', 'pointer')
      .style('transition', 'opacity 0.3s ease')
      .style('fill', d => (d.id === selectedRelationshipId ? '#60a5fa' : '#9ca3af'))
      .attr('opacity', l => {
        if (focusMode === 'narrow') return 1.0;
        if (multiSelection.size === 0 && !selectedElementId && !selectedRelationshipId) return 1.0;
        if (selectedRelationshipId) return l.id === selectedRelationshipId ? 1.0 : 0.2;
        
        const sourceId = typeof l.source === 'object' ? (l.source as D3Node).id : l.source as string;
        const targetId = typeof l.target === 'object' ? (l.target as D3Node).id : l.target as string;
        
        const isConnectedToSelection = multiSelection.has(sourceId) || multiSelection.has(targetId);
        return isConnectedToSelection ? 1.0 : 0.2;
      });

    const node = nodeGroup.selectAll<SVGGElement, D3Node>('.node')
      .data(d3Nodes, d => d.id)
      .join('g')
      .attr('class', 'node')
      .on('contextmenu', (event, d) => onNodeContextMenu(event, d.id))
      .style('transition', 'opacity 0.3s ease')
      .attr('opacity', d => {
          if (focusMode === 'narrow') return 1.0;
          return ((multiSelection.size === 0 && !selectedRelationshipId) || highlightedNodeIds.has(d.id)) ? 1.0 : 0.2;
      });

    (node.selectAll('*') as any).remove(); 

    node.append('rect')
        .attr('fill', d => {
            if (!activeColorScheme) return DEFAULT_NODE_COLOR;
            for (const tag of d.tags) {
                const color = lowerCaseTagColors[tag.toLowerCase()];
                if (color) {
                    return color;
                }
            }
            return DEFAULT_NODE_COLOR;
        })
        .attr('stroke', d => {
            if (simulationState && simulationState[d.id]) {
                const state = simulationState[d.id];
                if (state === 'increased') return '#22c55e'; // Green
                if (state === 'decreased') return '#ef4444'; // Red
            }
            if (analysisHighlights && analysisHighlights.has(d.id)) {
                return analysisHighlights.get(d.id)!;
            }
            // Multi-selection highlight
            if (multiSelection.has(d.id)) return '#eab308'; // Yellow-500
            
            return '#cbd5e1'; // Default border
        })
        .style('transition', 'stroke 0.2s ease, stroke-width 0.2s ease, filter 0.2s ease')
        .attr('stroke-width', d => {
            if (simulationState && simulationState[d.id] !== 'neutral') return 4;
            if (analysisHighlights && analysisHighlights.has(d.id)) return 4;
            if (multiSelection.has(d.id)) return 4;
            return 1.5;
        })
        .attr('filter', d => {
            if (simulationState && simulationState[d.id] === 'increased') return 'url(#glow-green)';
            if (simulationState && simulationState[d.id] === 'decreased') return 'url(#glow-red)';
            if (analysisHighlights && analysisHighlights.has(d.id)) {
                const color = analysisHighlights.get(d.id);
                if (color === '#ef4444') return 'url(#glow-red)';
                if (color === '#f97316') return 'url(#glow-orange)';
                if (color === '#3b82f6') return 'url(#glow-blue)';
                if (color === '#22c55e') return 'url(#glow-green)';
                if (color === '#a855f7') return 'url(#glow-purple)';
                if (color === '#eab308') return 'url(#glow-yellow)';
                if (color === '#fcd34d') return 'url(#glow-yellow)';
            }
            if (multiSelection.has(d.id)) return 'url(#glow-yellow)';
            return null;
        })
        .attr('rx', 8).attr('ry', 8);

    node.append('foreignObject')
        .attr('width', NODE_MAX_WIDTH)
        .attr('pointer-events', 'none')
        .append('xhtml:div')
        .style('width', '100%')
        .style('height', '100%')
        .style('min-height', '80px')
        .style('display', 'flex').style('justify-content', 'center').style('align-items', 'center')
        .style('padding', `${NODE_PADDING * 1.5}px ${NODE_PADDING}px`)
        .style('box-sizing', 'border-box')
        .style('color', '#1f2937').style('font-weight', '600').style('font-size', '14px')
        .style('text-align', 'center').style('word-break', 'break-word')
        .html(d => d.name);

    node.append('rect')
        .attr('class', 'move-zone')
        .attr('fill', 'transparent');
        // Cursor style set dynamically below

    node.each(function (d) {
        const nodeElement = d3.select(this);
        const foDiv = nodeElement.select<HTMLDivElement>('div').node();
        if (!foDiv) return;

        const height = foDiv.scrollHeight;
        const width = NODE_MAX_WIDTH;

        const dNode = d as D3Node;
        dNode.width = width;
        dNode.height = height;

        nodeElement.select('foreignObject')
            .attr('width', width).attr('height', height)
            .attr('x', -width / 2).attr('y', -height / 2);

        nodeElement.select('rect:not(.move-zone)')
            .attr('width', width).attr('height', height)
            .attr('x', -width / 2).attr('y', -height / 2);
        
        const CONNECT_BORDER_WIDTH = 20;
        const moveZoneWidth = Math.max(0, width - 2 * CONNECT_BORDER_WIDTH);
        const moveZoneHeight = Math.max(0, height - 2 * CONNECT_BORDER_WIDTH);
        
        nodeElement.select('.move-zone')
            .attr('width', moveZoneWidth)
            .attr('height', moveZoneHeight)
            .attr('x', -moveZoneWidth / 2)
            .attr('y', -moveZoneHeight / 2);
    });
    
    // Apply Cursor Style based on Mode
    let cursorStyle = 'default';
    
    // Custom SVG Cursor for Bulk Edit (pink lightning bolt to match toolbar)
    const bulkCursorSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`);
    const bulkCursor = `url("data:image/svg+xml;charset=utf-8,${bulkCursorSvg}") 12 12, auto`;

    let moveZoneCursor = isPhysicsModeActive ? 'grab' : 'move';

    if (isBulkEditActive) {
        cursorStyle = bulkCursor;
        moveZoneCursor = bulkCursor;
    } else if (simulationState) {
        cursorStyle = 'pointer'; // Click to stimulate
        moveZoneCursor = 'pointer';
    } else if (isPhysicsModeActive) {
        cursorStyle = 'grab';
    } else {
        cursorStyle = 'crosshair'; // Default Connect Mode
    }

    node.style('cursor', cursorStyle);
    node.select('.move-zone').style('cursor', moveZoneCursor);

    if (isPhysicsModeActive) {
      simulation
        .force('link', d3.forceLink<D3Node, D3Link>(d3Links).id(d => (d as D3Node).id).distance(layoutParams.linkDistance))
        .force('charge', d3.forceManyBody().strength(layoutParams.repulsion))
        .force('center', d3.forceCenter(width / 2, height / 2));

      const physicsDragHandler = createPhysicsDragHandler(simulation, onNodeClick);
      node.call(physicsDragHandler as any);
    } else {
      simulation
        .force('link', null)
        .force('charge', null)
        .force('center', null);
        
      const staticDragHandler = createDragHandler(setElements, onNodeClick, onNodeConnect, onNodeConnectToNew);
      node.call(staticDragHandler as any);
    }

    simulation.on('tick', () => {
      const simGetter = simulation as any;
      const nodesById = new Map<string, D3Node>((simGetter.nodes() as D3Node[]).map((n: D3Node) => [n.id, n]));
      
      link.attr('id', d => d.id)
        .attr('d', d => {
          const source = (typeof d.source === 'string' ? nodesById.get(d.source) : d.source) as D3Node | undefined;
          const target = (typeof d.target === 'string' ? nodesById.get(d.target) : d.target) as D3Node | undefined;
          
          if (!source || !target || !(source as any).width || !(target as any).width) return null;

          const startPoint = getRectIntersection(source, target);
          const endPoint = getRectIntersection(target, source);
          
          return `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`;
        });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    (simulation.alpha(0.3) as any).restart();

    const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

    zoomRef.current = zoom;
    
    svg.call(zoom as any);
    svg.on('click', onCanvasClick);
    svg.on('dblclick.zoom', null)
      .on('dblclick', (event: any) => {
        // Check if click target is svg background
        if (event.target.tagName === 'svg' || event.target === svg.node()) {
            const node = g.node();
            if (node) {
                const [x, y] = d3.pointer(event, node);
                onCanvasDoubleClick({x, y});
            }
        }
      });

  }, [elements, relationships, activeColorScheme, selectedElementId, selectedRelationshipId, multiSelection, onNodeClick, onLinkClick, onCanvasClick, onCanvasDoubleClick, onNodeContextMenu, setElements, onNodeConnect, onNodeConnectToNew, focusMode, isPhysicsModeActive, highlightedNodeIds, onCanvasContextMenu, isBulkEditActive, simulationState, analysisHighlights]);

  return (
    <div className="w-full h-full flex-grow bg-gray-900 cursor-grab active:cursor-grabbing" onContextMenu={handleCanvasContextMenu}>
      <svg ref={svgRef} className="w-full h-full">
        <defs>
          <marker
            id="arrow"
            viewBox="0 -5 10 10"
            refX={10}
            refY={0}
            markerWidth={6}
            markerHeight={6}
            orient="auto">
            <path d="M0,-5L10,0L0,5" fill="#6b7280"></path>
          </marker>
          <marker
            id="arrow-rev"
            viewBox="0 -5 10 10"
            refX={0}
            refY={0}
            markerWidth={6}
            markerHeight={6}
            orient="auto">
            <path d="M10,-5L0,0L10,5" fill="#6b7280"></path>
          </marker>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#22c55e" floodOpacity="0.8" />
          </filter>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="0.8" />
          </filter>
          <filter id="glow-yellow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#eab308" floodOpacity="0.8" />
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3b82f6" floodOpacity="0.8" />
          </filter>
          <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f97316" floodOpacity="0.8" />
          </filter>
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#a855f7" floodOpacity="0.8" />
          </filter>
        </defs>
        <g ref={gRef}></g>
      </svg>
    </div>
  );
});

export default GraphCanvas;
