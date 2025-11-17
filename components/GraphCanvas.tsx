import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import * as d3 from 'd3';
import { Element, Relationship, ColorScheme, D3Node, D3Link, RelationshipDirection } from '../types';
import { LINK_DISTANCE, NODE_MAX_WIDTH, NODE_PADDING, DEFAULT_NODE_COLOR } from '../constants';

interface GraphCanvasProps {
  elements: Element[];
  relationships: Relationship[];
  onNodeClick: (elementId: string) => void;
  onLinkClick: (relationshipId: string) => void;
  onCanvasClick: () => void;
  onCanvasDoubleClick: (coords: { x: number, y: number }) => void;
  onNodeContextMenu: (event: React.MouseEvent, elementId: string) => void;
  onCanvasContextMenu: (event: React.MouseEvent) => void;
  onNodeConnect: (sourceId: string, targetId: string) => void;
  onNodeConnectToNew: (sourceId: string, coords: { x: number, y: number }) => void;
  activeColorScheme: ColorScheme | undefined;
  selectedElementId: string | null;
  selectedRelationshipId: string | null;
  focusMode: 'narrow' | 'wide' | 'zoom';
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  isPhysicsModeActive: boolean;
}

export interface GraphCanvasRef {
  getFinalNodePositions: () => { id: string; x: number; y: number }[];
  zoomToFit: () => void;
}

/**
 * Calculates the intersection point of a line (from source to target) with the
 * bounding box of the source node.
 */
// Fix: Renamed parameters to avoid potential 'Duplicate identifier' naming collisions.
function getRectIntersection(sNode: D3Node, tNode: D3Node) {
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
        x = sx + dx * (sign * h / dy) ;
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
  onNodeClickCallback: (elementId: string) => void,
  onNodeConnectCallback: (sourceId: string, targetId: string) => void,
  onNodeConnectToNew: (sourceId: string, coords: { x: number, y: number }) => void
) => {
  let isMoving = false; // Flag to track drag mode

  function dragstarted(this: SVGGElement, event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
    const target = event.sourceEvent.target as SVGElement;
    isMoving = target.classList.contains('move-zone');

    // Pin the node during any drag operation to prevent interference from the simulation
    d.fx = d.x;
    d.fy = d.y;
    
    if (!isMoving) {
      // It's a connect drag. Draw a temporary line.
      d3.select(this.ownerSVGElement).select('g')
        .append('path')
        .attr('class', 'temp-drag-line')
        .attr('d', `M${d.x},${d.y} L${event.x},${event.y}`)
        .attr('stroke', '#a5b4fc')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('pointer-events', 'none');
    }
  }

  function dragged(this: SVGGElement, event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
    if (isMoving) {
      // For a move drag, update the node's fixed position.
      d.fx = event.x;
      d.fy = event.y;
    } else {
      // For a connect drag, only update the temporary line's endpoint.
      d3.select(this.ownerSVGElement).select('.temp-drag-line')
        .attr('d', `M${d.x},${d.y} L${event.x},${event.y}`);
    }
  }

  function dragended(this: SVGGElement, event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
    // FIX: Unconditionally persist the node's final position to React state.
    // This is the single source of truth and prevents the "spring back" bug by
    // ensuring React and D3 are synchronized after any drag operation.
    setElementsState(prev => prev.map(e => e.id === d.id ? { ...e, fx: d.fx, fy: d.fy } : e));
    
    // Clean up temporary line from connect drag
    if (!isMoving) {
        // Fix: Replace d3.selection.remove() with an .each() loop to call the native
        // element's .remove() method. This works around a typing issue in some versions
        // of @types/d3 where .remove() is incorrectly declared to require an argument.
        d3.select(this.ownerSVGElement).select('.temp-drag-line').each(function() {
            // FIX: Add type guard to ensure `this` is an Element with a parentNode before removing.
            // This resolves the "Property 'parentNode' does not exist on type 'BaseType'" error.
            if (this instanceof Element && this.parentNode) {
              this.parentNode.removeChild(this);
            }
        });
    }

    const isClick = Math.abs(event.x - event.subject.x) < 5 && Math.abs(event.y - event.subject.y) < 5;

    if (isClick) {
        onNodeClickCallback(d.id);
        return; // It was a click, no more actions needed.
    }

    // It was a drag, not a click. Handle connect logic if necessary.
    if (!isMoving) {
        // Finalize the connect drag by checking the mouseup event's target.
        const dropTargetElement = event.sourceEvent.target as HTMLElement;
        const dropNodeSelection = d3.select(dropTargetElement?.closest('.node'));

        // Check if the drop target is a valid, different node.
        if (!dropNodeSelection.empty() && (dropNodeSelection.datum() as D3Node).id !== d.id) {
            onNodeConnectCallback(d.id, (dropNodeSelection.datum() as D3Node).id);
        } else {
            // Otherwise, treat it as a drop on the canvas to create a new element.
            onNodeConnectToNew(d.id, { x: event.x, y: event.y });
        }
    }
  }

  return d3.drag<SVGGElement, D3Node>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};

const createPhysicsDragHandler = (simulation: d3.Simulation<D3Node, D3Link>) => {
  function dragstarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
    // Correctly "reheat" the simulation on drag start. Chaining alphaTarget and restart
    // is the idiomatic D3 pattern.
    if (!event.active) {
      // The type definitions for d3-force's restart() method are faulty in some versions of @types/d3,
      // incorrectly expecting an argument. Casting the result of alphaTarget() to `any` before
      // calling restart() bypasses the faulty type check and resolves the error.
      (simulation.alphaTarget(0.3) as any).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
    if (!event.active) simulation.alphaTarget(0);
    // The node remains pinned where it was dropped.
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
  selectedRelationshipId,
  focusMode,
  setElements,
  isPhysicsModeActive
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  
  const zoomToFit = (nodesToFit?: D3Node[], limitMaxZoom = false) => {
    if (!svgRef.current || !gRef.current || !simulationRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    const nodes = nodesToFit || simulationRef.current.nodes();

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

    const padding = 0.9;
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
      if (simulationRef.current) {
        return simulationRef.current.nodes().map(node => ({
          id: node.id,
          x: node.x!,
          y: node.y!
        }));
      }
      return [];
    },
    zoomToFit: () => zoomToFit(),
  }));

  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedElementId) {
        ids.add(selectedElementId);
        relationships.forEach(rel => {
            if (rel.source === selectedElementId) ids.add(rel.target as string);
            if (rel.target === selectedElementId) ids.add(rel.source as string);
        });
    } else if (selectedRelationshipId) {
        const rel = relationships.find(r => r.id === selectedRelationshipId);
        if (rel) {
            ids.add(rel.source as string);
            ids.add(rel.target as string);
        }
    }
    return ids;
  }, [selectedElementId, selectedRelationshipId, relationships]);

  useEffect(() => {
    if (focusMode === 'zoom' && highlightedNodeIds.size > 0 && simulationRef.current) {
        const nodesToFit = simulationRef.current.nodes().filter(n => highlightedNodeIds.has(n.id));
        if (nodesToFit.length > 0) {
            zoomToFit(nodesToFit, true);
        }
    }
  }, [focusMode, highlightedNodeIds]);

  const handleCanvasContextMenu = (event: React.MouseEvent) => {
    // Prevent context menu if the target is a node or link
    const target = event.target as HTMLElement;
    if (target.closest('.node') || target.closest('.link-label-group')) {
        // Let the node/link's own D3 context menu handler take over
        return;
    }
    onCanvasContextMenu(event);
  };

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const { width, height } = svgRef.current.getBoundingClientRect();

    // Create dedicated layers for links and nodes to ensure nodes are always rendered on top.
    // The join pattern on a single-item data array is a standard way to ensure an element exists.
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
    
    const existingNodesMap = new Map(simulation.nodes().map(node => [node.id, node]));
    const d3Nodes = elements.map(element => {
      const existingNode = existingNodesMap.get(element.id);
      if (existingNode) {
        // Update existing D3 node with new data from React state, preserving simulation properties
        return Object.assign(existingNode, element);
      } else {
        // Create a new D3 node for a new element
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
        if (!selectedElementId && !selectedRelationshipId) return 1.0;
        if (selectedRelationshipId) return l.id === selectedRelationshipId ? 1.0 : 0.2;
        const sourceId = typeof l.source === 'object' ? (l.source as D3Node).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as D3Node).id : l.target;
        return (sourceId === selectedElementId || targetId === selectedElementId) ? 1.0 : 0.2;
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
        if (!selectedElementId && !selectedRelationshipId) return 1.0;
        if (selectedRelationshipId) return l.id === selectedRelationshipId ? 1.0 : 0.2;
        const sourceId = typeof l.source === 'object' ? (l.source as D3Node).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as D3Node).id : l.target;
        return (sourceId === selectedElementId || targetId === selectedElementId) ? 1.0 : 0.2;
      });


    const node = nodeGroup.selectAll<SVGGElement, D3Node>('.node')
      .data(d3Nodes, d => d.id)
      .join('g')
      .attr('class', 'node')
      .on('contextmenu', (event, d) => onNodeContextMenu(event, d.id))
      .style('transition', 'opacity 0.3s ease')
      .attr('opacity', d => {
          if (focusMode === 'narrow') return 1.0;
          return ((!selectedElementId && !selectedRelationshipId) || highlightedNodeIds.has(d.id)) ? 1.0 : 0.2;
      });

    // FIX: Using .each() with native element .remove() to work around a d3.selection.remove() typing issue
    // that incorrectly expects an argument. The cast to `SVGElement` resolves name collision with the app's `Element` type.
    node.selectAll('*').each(function() { (this as SVGElement).remove(); }); // Re-render content to reflect data changes

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
        .attr('stroke', d => (d.id === selectedElementId ? '#60a5fa' : '#cbd5e1'))
        .style('transition', 'stroke 0.2s ease, stroke-width 0.2s ease')
        .attr('stroke-width', d => (d.id === selectedElementId ? 3 : 1.5))
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
        .attr('fill', 'transparent')
        .style('cursor', 'grab');

    node.each(function (d) {
        const nodeElement = d3.select(this);
        const foDiv = nodeElement.select<HTMLDivElement>('div').node();
        if (!foDiv) return;

        // FIX: Use scrollHeight instead of getBoundingClientRect().height to get the
        // intrinsic, un-zoomed height of the content. This prevents the nodes from
        // incorrectly resizing themselves based on the current canvas zoom level.
        const height = foDiv.scrollHeight;
        const width = NODE_MAX_WIDTH;

        d.width = width;
        d.height = height;

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

    if (isPhysicsModeActive) {
      simulation
        .force('link', d3.forceLink<D3Node, D3Link>(d3Links).id(d => (d as D3Node).id).distance(LINK_DISTANCE))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2));

      node.style('cursor', 'grab');
      // The restart() method has faulty type definitions, so we cast to 'any' to bypass the check.
      const physicsDragHandler = createPhysicsDragHandler(simulation);
      node.call(physicsDragHandler as any);
    } else {
      simulation
        .force('link', null)
        .force('charge', null)
        .force('center', null);
        
      node.style('cursor', 'crosshair');
      const staticDragHandler = createDragHandler(setElements, onNodeClick, onNodeConnect, onNodeConnectToNew);
      node.call(staticDragHandler);
    }


    simulation.on('tick', () => {
      const nodesById = new Map(simulation.nodes().map(n => [n.id, n]));
      
      link.attr('id', d => d.id)
        .attr('d', d => {
          const source = typeof d.source === 'string' ? nodesById.get(d.source) : d.source as D3Node;
          const target = typeof d.target === 'string' ? nodesById.get(d.target) : d.target as D3Node;
          
          if (!source || !target || !source.width || !target.width) return null;

          const startPoint = getRectIntersection(source, target);
          const endPoint = getRectIntersection(target, source);
          
          return `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`;
        });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Fix: The restart() method has faulty type definitions in @types/d3, expecting
    // an argument. Casting the result of alpha() to `any` bypasses this check.
    (simulation.alpha(0.3) as any).restart();

    const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

    zoomRef.current = zoom;
    
    svg.call(zoom as any);
    svg.on('click', onCanvasClick);
    svg.on('dblclick.zoom', null)
      .on('dblclick', (event) => {
        const [x, y] = d3.pointer(event, g.node());
        onCanvasDoubleClick({x, y});
      });

  }, [elements, relationships, activeColorScheme, selectedElementId, selectedRelationshipId, onNodeClick, onLinkClick, onCanvasClick, onCanvasDoubleClick, onNodeContextMenu, setElements, onNodeConnect, onNodeConnectToNew, focusMode, isPhysicsModeActive, highlightedNodeIds, onCanvasContextMenu]);

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
        </defs>
        <g ref={gRef}></g>
      </svg>
    </div>
  );
});

export default GraphCanvas;