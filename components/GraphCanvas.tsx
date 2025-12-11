
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import * as d3Import from 'd3';
import { Element, Relationship, ColorScheme, D3Node, D3Link, RelationshipDirection, SimulationNodeState, NodeShape } from '../types';
import { LINK_DISTANCE, NODE_MAX_WIDTH, NODE_PADDING, DEFAULT_NODE_COLOR } from '../constants';

const d3: any = d3Import;

interface GraphCanvasProps {
  elements: Element[];
  relationships: Relationship[];
  onNodeClick: (elementId: string, event: MouseEvent) => void;
  onLinkClick: (relationshipId: string) => void;
  onCanvasClick: () => void;
  onCanvasDoubleClick: (coords: { x: number, y: number }) => void;
  onNodeContextMenu: (event: React.MouseEvent, elementId: string) => void;
  onLinkContextMenu: (event: React.MouseEvent, relationshipId: string) => void;
  onCanvasContextMenu: (event: React.MouseEvent) => void;
  onNodeConnect: (sourceId: string, targetId: string) => void;
  onNodeConnectToNew: (sourceId: string, coords: { x: number, y: number }) => void;
  activeColorScheme: ColorScheme | undefined;
  selectedElementId: string | null;
  setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>;
  multiSelection: Set<string>;
  setMultiSelection: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedRelationshipId: string | null;
  focusMode: 'narrow' | 'wide' | 'zoom';
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  isPhysicsModeActive: boolean;
  layoutParams: { linkDistance: number; repulsion: number };
  onJiggleTrigger?: number;
  isBulkEditActive: boolean;
  isSimulationMode?: boolean;
  simulationState?: Record<string, SimulationNodeState>;
  analysisHighlights?: Map<string, string>;
  isDarkMode?: boolean;
  nodeShape?: NodeShape;
  isHighlightToolActive?: boolean;
}

export interface GraphCanvasRef {
  getFinalNodePositions: () => { id: string; x: number; y: number }[];
  zoomToFit: () => void;
  getCamera: () => { x: number; y: number; k: number };
  setCamera: (x: number, y: number, k: number) => void;
  exportAsImage: (filename: string, bgColor: string) => void;
}

// --- Helper: Seeded Random for Consistent Scribbles ---
const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; 
  }
  return hash;
};

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// --- Helper: Generate Hand-Drawn Loop Path ---
const generateScribblePath = (width: number, height: number, seedStr: string) => {
    let seed = hashCode(seedStr);
    const padding = 15; // Extend beyond the node
    const w = width / 2 + padding;
    const h = height / 2 + padding;
    
    // Generate roughly elliptical points
    // We'll do 2 loops (approx 720 degrees)
    const points: [number, number][] = [];
    const steps = 16; // Points per loop
    const loops = 2;
    const totalSteps = steps * loops;
    
    for (let i = 0; i <= totalSteps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        // Add noise to radius
        const noise = (pseudoRandom(seed++) - 0.5) * 10; 
        const rw = w + noise;
        const rh = h + noise;
        
        // Add slight wobble to center to make it look spirally/messy
        const cx = (pseudoRandom(seed++) - 0.5) * 5;
        const cy = (pseudoRandom(seed++) - 0.5) * 5;

        points.push([
            cx + rw * Math.cos(angle),
            cy + rh * Math.sin(angle)
        ]);
    }

    // Use D3 to create a smooth closed curve through these messy points
    const lineGen = d3.line().curve(d3.curveBasis);
    return lineGen(points) || "";
};

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
  onNodeConnectToNew: (sourceId: string, coords: { x: number, y: number }) => void,
  multiSelection: Set<string>
) => {
  let isMoving = false; // Flag to track drag mode
  let hasMoved = false; // Flag to distinguish click from drag
  let startX = 0;
  let startY = 0;

  function dragstarted(this: SVGGElement, event: any, d: D3Node) {
    const target = event.sourceEvent.target as SVGElement;
    
    // Check if dragging via a quick-add button
    if (target.closest('.quick-add-btn')) return;
    
    // If Alt key is pressed, let the canvas handle box selection, don't drag node
    if (event.sourceEvent.altKey) return;

    isMoving = target.classList.contains('move-zone');
    hasMoved = false;
    const e = event as any;
    startX = e.x;
    startY = e.y;

    if (!isMoving) {
      // It's a connect drag. Draw a temporary line.
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
    const target = event.sourceEvent.target as SVGElement;
    if (target.closest('.quick-add-btn')) return;
    if (event.sourceEvent.altKey) return;

    const e = event as any;
    if (!hasMoved && (Math.abs(e.x - startX) > 3 || Math.abs(e.y - startY) > 3)) {
        hasMoved = true;
    }

    if (isMoving) {
        // D3 v6+ automatically handles transforms for us in event.dx/dy if attached correctly
        // so we do not divide by transform.k here.
        const dx = event.dx;
        const dy = event.dy;

        const isGroupDrag = multiSelection.has(d.id);
        const nodesToMove = d3.select(this.ownerSVGElement)
            .selectAll('.node')
            .filter((n: any) => isGroupDrag ? multiSelection.has(n.id) : n.id === d.id);

        // Update D3 data and DOM for nodes
        nodesToMove.each(function(n: any) {
            n.x = (n.x || 0) + dx;
            n.y = (n.y || 0) + dy;
            n.fx = n.x;
            n.fy = n.y;
            d3.select(this).attr('transform', `translate(${n.x},${n.y})`);
        });

        // Helper to get node data by ID for link updates
        const nodeDataMap = new Map<string, D3Node>();
        d3.select(this.ownerSVGElement).selectAll('.node').each((n: any) => nodeDataMap.set(n.id, n));

        // Update connected Links efficiently by filtering first
        d3.select(this.ownerSVGElement).selectAll('.link')
            .filter((l: any) => {
                const sourceId = typeof l.source === 'object' ? l.source.id : l.source as string;
                const targetId = typeof l.target === 'object' ? l.target.id : l.target as string;
                
                return (isGroupDrag && (multiSelection.has(sourceId) || multiSelection.has(targetId))) || 
                       (!isGroupDrag && (sourceId === d.id || targetId === d.id));
            })
            .attr('d', (l: any) => {
                const sourceId = typeof l.source === 'object' ? l.source.id : l.source as string;
                const targetId = typeof l.target === 'object' ? l.target.id : l.target as string;
                
                const sNode = nodeDataMap.get(sourceId);
                const tNode = nodeDataMap.get(targetId);
                
                if (sNode && tNode) {
                     const startPoint = getRectIntersection(sNode, tNode);
                     const endPoint = getRectIntersection(tNode, sNode);
                     return `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`;
                }
                return null;
            });

    } else {
      // Connect drag
      const parent = this.parentNode as SVGGElement;
      const [mx, my] = d3.pointer(event.sourceEvent, parent);
      
      const start = getRectIntersection(d, { x: mx, y: my });
      d3.select(this.ownerSVGElement).select('.temp-drag-line')
        .attr('d', `M${start.x},${start.y} L${mx},${my}`);
    }
  }

  function dragended(this: SVGGElement, event: any, d: D3Node) {
    const target = event.sourceEvent.target as SVGElement;
    if (target.closest('.quick-add-btn')) return;
    if (event.sourceEvent.altKey) return;

    // Cleanup temp line
    if (!isMoving) {
        const tempLine: any = d3.select(this.ownerSVGElement).select('.temp-drag-line');
        if (tempLine) tempLine.remove();
    }

    // Click handling
    if (!hasMoved) {
        onNodeClickCallback(d.id, event.sourceEvent);
        return; 
    }

    if (isMoving) {
        // Get final positions from D3 data
        const d3Nodes = d3.select(this.ownerSVGElement).selectAll('.node').data() as D3Node[];
        const nodeMap = new Map(d3Nodes.map(n => [n.id, { x: n.x, y: n.y, fx: n.fx, fy: n.fy }]));
        const isGroupDrag = multiSelection.has(d.id);

        setElementsState(prev => prev.map(el => {
            // If in group drag, update all selected. Else update dragged one.
            if (isGroupDrag ? multiSelection.has(el.id) : el.id === d.id) {
                const d3N = nodeMap.get(el.id);
                if (d3N) {
                    return { ...el, x: d3N.x, y: d3N.y, fx: d3N.fx, fy: d3N.fy, updatedAt: new Date().toISOString() };
                }
            }
            return el;
        }));
    } else {
        // Connect drag end
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

  return d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};

const createPhysicsDragHandler = (
    simulation: any, 
    onNodeClickCallback: (elementId: string, event: MouseEvent) => void,
    setElementsState: React.Dispatch<React.SetStateAction<Element[]>>,
    multiSelection: Set<string>
) => {
  let startX = 0;
  let startY = 0;
  let hasMoved = false;

  function dragstarted(this: SVGGElement, event: any, d: D3Node) {
    const target = event.sourceEvent.target as SVGElement;
    if (target.closest('.quick-add-btn')) return;
    if (event.sourceEvent.altKey) return;

    if (!event.active) {
      simulation.alphaTarget(0.3);
      (simulation as any).restart();
    }
    
    // Pin all nodes being moved
    const isGroupDrag = multiSelection.has(d.id);
    d3.select(this.ownerSVGElement).selectAll('.node')
        .filter((n: any) => isGroupDrag ? multiSelection.has(n.id) : n.id === d.id)
        .each((n: any) => {
            n.fx = n.x;
            n.fy = n.y;
        });

    const e = event as any;
    startX = e.x;
    startY = e.y;
    hasMoved = false;
  }

  function dragged(this: SVGGElement, event: any, d: D3Node) {
    const target = event.sourceEvent.target as SVGElement;
    if (target.closest('.quick-add-btn')) return;
    if (event.sourceEvent.altKey) return;

    const e = event as any;
    if (!hasMoved && (Math.abs(e.x - startX) > 3 || Math.abs(e.y - startY) > 3)) {
        hasMoved = true;
    }

    // Update fx/fy for all selected nodes
    // D3 v6+ handles zoom transform in dx/dy automatically
    const dx = event.dx;
    const dy = event.dy;

    const isGroupDrag = multiSelection.has(d.id);
    d3.select(this.ownerSVGElement).selectAll('.node')
        .filter((n: any) => isGroupDrag ? multiSelection.has(n.id) : n.id === d.id)
        .each((n: any) => {
            if (n.fx !== undefined && n.fx !== null) n.fx += dx;
            if (n.fy !== undefined && n.fy !== null) n.fy += dy;
            // Note: n.x/n.y will be updated by simulation tick
        });
  }

  function dragended(this: SVGGElement, event: any, d: D3Node) {
    const target = event.sourceEvent.target as SVGElement;
    if (target.closest('.quick-add-btn')) return;
    if (event.sourceEvent.altKey) return;

    if (!event.active) simulation.alphaTarget(0);
    
    if (!hasMoved) {
        onNodeClickCallback(d.id, event.sourceEvent);
    }

    // Unpin nodes (or keep them fixed if that's the design, here we unpin)
    // NOTE: Standard d3 force drag unpins on end.
    const isGroupDrag = multiSelection.has(d.id);
    
    // Capture final positions before unpinning to save state
    const d3Nodes = d3.select(this.ownerSVGElement).selectAll('.node').data() as D3Node[];
    const nodeMap = new Map(d3Nodes.map(n => [n.id, { x: n.x, y: n.y }]));

    d3.select(this.ownerSVGElement).selectAll('.node')
        .filter((n: any) => isGroupDrag ? multiSelection.has(n.id) : n.id === d.id)
        .each((n: any) => {
            n.fx = null;
            n.fy = null;
        });
    
    // Sync back to React
    setElementsState(prev => prev.map(el => {
        if (isGroupDrag ? multiSelection.has(el.id) : el.id === d.id) {
            const d3N = nodeMap.get(el.id);
            if (d3N) {
                return { ...el, x: d3N.x, y: d3N.y, fx: null, fy: null, updatedAt: new Date().toISOString() };
            }
        }
        return el;
    }));
  }

  return d3.drag()
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
  onLinkContextMenu,
  onCanvasContextMenu,
  onNodeConnect,
  onNodeConnectToNew,
  activeColorScheme,
  selectedElementId,
  setSelectedElementId,
  multiSelection,
  setMultiSelection,
  selectedRelationshipId,
  focusMode,
  setElements,
  isPhysicsModeActive,
  layoutParams,
  onJiggleTrigger,
  isBulkEditActive,
  isSimulationMode = false,
  simulationState,
  analysisHighlights,
  isDarkMode = true,
  nodeShape = 'rectangle',
  isHighlightToolActive = false
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<any | null>(null);
  const zoomRef = useRef<any | null>(null);
  
  // Box Selection State
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number; } | null>(null);
  
  // Refs for selection drag processing
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionDragRef = useRef<{ 
      startX: number; 
      startY: number; 
      currentX: number; 
      currentY: number; 
      initialSelection: Set<string>;
  } | null>(null);
  
  // Ref to prevent click event on canvas after drag selection
  const preventClickRef = useRef(false);

  // Use a separate useEffect to attach/detach window listeners for selection drag
  // This avoids stale closures and re-binding listeners constantly
  useEffect(() => {
    if (!isSelecting) return;

    const handleMouseMove = (e: MouseEvent) => {
        if (selectionDragRef.current && svgRef.current && gRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update ref for logic
            selectionDragRef.current = {
                ...selectionDragRef.current,
                currentX: x,
                currentY: y
            };
            
            // Update visual box
            setSelectionBox({ 
                startX: selectionDragRef.current.startX, 
                startY: selectionDragRef.current.startY, 
                currentX: x, 
                currentY: y 
            });

            // --- Dynamic Selection Logic ---
            const box = selectionDragRef.current;
            const xMin = Math.min(box.startX, box.currentX);
            const xMax = Math.max(box.startX, box.currentX);
            const yMin = Math.min(box.startY, box.currentY);
            const yMax = Math.max(box.startY, box.currentY);

            if ((xMax - xMin) > 5 && (yMax - yMin) > 5) {
                 const transform = d3.zoomTransform(svgRef.current);
                 const boxSelection = new Set<string>();

                 // We iterate through D3 nodes to get current positions
                 d3.select(gRef.current).selectAll('.node').each(function(d: any) {
                     if (d.x !== undefined && d.y !== undefined) {
                         // Convert simulation coords to screen coords
                         const screenX = d.x * transform.k + transform.x;
                         const screenY = d.y * transform.k + transform.y;
                         
                         // Check intersection
                         if (screenX >= xMin && screenX <= xMax && screenY >= yMin && screenY <= yMax) {
                             boxSelection.add(d.id);
                         }
                     }
                 });
                 
                 // Determine final selection based on Modifier keys
                 let finalSelection: Set<string>;
                 
                 if (e.metaKey || e.ctrlKey) {
                     // Invert Selection (XOR)
                     // Keep everything in initial, toggle everything in box
                     finalSelection = new Set(box.initialSelection);
                     boxSelection.forEach(id => {
                         if (finalSelection.has(id)) {
                             finalSelection.delete(id);
                         } else {
                             finalSelection.add(id);
                         }
                     });
                 } else if (e.shiftKey) {
                     // Add to selection
                     finalSelection = new Set([...box.initialSelection, ...boxSelection]);
                 } else {
                     // Replace selection
                     finalSelection = boxSelection;
                 }
                 
                 // Update state if selection changed to trigger visual feedback
                 setMultiSelection(prev => {
                     if (prev.size === finalSelection.size && [...prev].every(id => finalSelection.has(id))) {
                         return prev;
                     }
                     return finalSelection;
                 });
                 
                 if (finalSelection.size > 0) {
                     setSelectedElementId(null);
                 }
            }
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (selectionDragRef.current) {
             const box = selectionDragRef.current;
             const width = Math.abs(box.currentX - box.startX);
             const height = Math.abs(box.currentY - box.startY);
             
             // Only clear if it was a tiny drag (click)
             if (width < 5 && height < 5) {
                 setMultiSelection(new Set());
                 setSelectedElementId(null);
             } else {
                 // Significant drag happened, keep selection and prevent subsequent click
                 preventClickRef.current = true;
                 setTimeout(() => { preventClickRef.current = false; }, 100);
             }
        }
        
        // Reset State
        setIsSelecting(false);
        selectionDragRef.current = null;
        setSelectionBox(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSelecting, setMultiSelection, setSelectedElementId]);

  const handleSelectionMouseDown = (e: React.MouseEvent) => {
      // Alt + Left Click starts selection
      if (e.button === 0 && e.altKey && svgRef.current) {
          e.preventDefault();
          e.stopPropagation();
          
          const rect = svgRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Capture current selection for adding to it
          const initialSelection = new Set(multiSelection);

          const initBox = { 
              startX: x, 
              startY: y, 
              currentX: x, 
              currentY: y,
              initialSelection
          };
          
          selectionDragRef.current = initBox;
          // For UI rendering, we just need coords
          setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
          setIsSelecting(true);
      }
  };

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
    },
    exportAsImage: (filename: string, bgColor: string = '#ffffff') => {
        if (!svgRef.current) return;
        
        const svg = svgRef.current;
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);
        
        // Namespace fix
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if(!source.match(/^<svg[^>]+xmlns:xlink/)){
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }
        
        // Fix for foreignObject issues in some browsers (ensure XHTML namespace)
        source = source.replace(/<foreignObject/g, '<foreignObject xmlns="http://www.w3.org/2000/svg"');

        const svgBlob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const rect = svg.getBoundingClientRect();
            const scale = 2; // Higher resolution
            canvas.width = rect.width * scale;
            canvas.height = rect.height * scale;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Background
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // Draw
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Download
                const a = document.createElement('a');
                a.download = filename;
                a.href = canvas.toDataURL("image/png");
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
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

    if (analysisHighlights) {
        analysisHighlights.forEach((_, id) => ids.add(id));
    }

    return ids;
  }, [selectedElementId, selectedRelationshipId, relationships, multiSelection, analysisHighlights]);

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
          const linkForce = sim.force('link');
          if (linkForce) {
              linkForce.distance(layoutParams.linkDistance);
          }

          const chargeForce = sim.force('charge');
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
        simulationRef.current = d3.forceSimulation([]);
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
    
    // Theme Colors
    const linkColor = isDarkMode ? '#6b7280' : '#4b5563'; // gray-500 : gray-600
    const textFillColor = isDarkMode ? '#9ca3af' : '#374151'; // gray-400 : gray-700
    const selectedLinkColor = '#60a5fa'; // blue-400

    const link = linkGroup.selectAll('.link')
      .data(d3Links, (d: any) => d.id)
      .join('path')
      .attr('class', 'link')
      .attr('id', (d: any) => d.id) // Ensure ID is set on path for label textPath reference
      .attr('stroke', (d: any) => (d.id === selectedRelationshipId ? selectedLinkColor : linkColor))
      .attr('stroke-width', (d: any) => (d.id === selectedRelationshipId ? 3 : 2))
      .attr('fill', 'none')
      .attr('marker-end', (d: any) => (d.direction === RelationshipDirection.To || d.direction === RelationshipDirection. Both ? (isDarkMode ? 'url(#arrow)' : 'url(#arrow-light)') : null))
      .attr('marker-start', (d: any) => (d.direction === RelationshipDirection.From || d.direction === RelationshipDirection.Both ? (isDarkMode ? 'url(#arrow-rev)' : 'url(#arrow-rev-light)') : null))
      .style('transition', 'opacity 0.3s ease, stroke 0.2s ease, stroke-width 0.2s ease')
      .attr('opacity', (l: any) => {
        if (focusMode === 'narrow') return 1.0;
        if (multiSelection.size === 0 && !selectedElementId && !selectedRelationshipId) return 1.0;
        if (selectedRelationshipId) return l.id === selectedRelationshipId ? 1.0 : 0.2;
        
        const sourceId = typeof l.source === 'object' ? (l.source as D3Node).id : l.source as string;
        const targetId = typeof l.target === 'object' ? (l.target as D3Node).id : l.target as string;
        
        // Highlight link if connected to selection
        const isConnectedToSelection = multiSelection.has(sourceId) || multiSelection.has(targetId);
        return isConnectedToSelection ? 1.0 : 0.2;
      })
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        onLinkClick(d.id);
      })
      .on('contextmenu', (event: any, d: any) => {
          onLinkContextMenu(event, d.id);
      })
      .style('cursor', 'pointer');

    labelGroup.selectAll('.link-label-group')
      .data(d3Links, (d: any) => d.id)
      .join(
        (enter: any) => {
          const textGroup = enter.append('text')
            .attr('class', 'link-label-group')
            .attr('dy', -5);

          textGroup.append('textPath')
            .attr('class', 'link-label')
            .attr('xlink:href', (d: any) => `#${d.id}`)
            .attr('startOffset', '50%')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text((d: any) => d.label);
          
          return textGroup;
        },
        (update: any) => {
            update.select('.link-label').text((d: any) => d.label);
            return update;
        }
      )
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        onLinkClick(d.id);
      })
      .on('contextmenu', (event: any, d: any) => {
          onLinkContextMenu(event, d.id);
      })
      .style('cursor', 'pointer')
      .style('transition', 'opacity 0.3s ease')
      .style('fill', (d: any) => (d.id === selectedRelationshipId ? selectedLinkColor : textFillColor))
      .attr('opacity', (l: any) => {
        if (focusMode === 'narrow') return 1.0;
        if (multiSelection.size === 0 && !selectedElementId && !selectedRelationshipId) return 1.0;
        if (selectedRelationshipId) return l.id === selectedRelationshipId ? 1.0 : 0.2;
        
        const sourceId = typeof l.source === 'object' ? (l.source as D3Node).id : l.source as string;
        const targetId = typeof l.target === 'object' ? (l.target as D3Node).id : l.target as string;
        
        const isConnectedToSelection = multiSelection.has(sourceId) || multiSelection.has(targetId);
        return isConnectedToSelection ? 1.0 : 0.2;
      });

    const node = nodeGroup.selectAll('.node')
      .data(d3Nodes, (d: any) => d.id)
      .join('g')
      .attr('class', 'node')
      .on('contextmenu', (event: any, d: any) => onNodeContextMenu(event, d.id))
      .on('mouseenter', function(event: any, d: any) {
          // Show Quick Add Buttons
          if (isBulkEditActive || isPhysicsModeActive || isHighlightToolActive) return; // Don't show in special modes
          
          const group = d3.select(this);
          const width = d.width || NODE_MAX_WIDTH;
          const height = d.height || 80;
          const w2 = width / 2;
          const h2 = height / 2;
          const pad = 15; // Distance from edge
          const btnR = 7;
          
          // Gap buffer ensures mouse can travel to button without leaving the group
          const gapBuffer = 15;
          const extension = pad + btnR + gapBuffer;

          // Remove existing if any (cleanup)
          group.selectAll('.quick-add-group').remove();
          group.selectAll('.bridge-group').remove();

          // 1. Insert "Bridge" group at the bottom (first child) so it is behind the node
          // This ensures the main node center is still clickable (via Move Zone or Text),
          // but the "air" around the node captures mouse events to keep the menu open.
          const bridgeGroup = group.insert('g', ':first-child').attr('class', 'bridge-group');
          
          bridgeGroup.append('rect')
              .attr('width', width + extension * 2)
              .attr('height', height + extension * 2)
              .attr('x', -(width / 2) - extension)
              .attr('y', -(height / 2) - extension)
              .attr('rx', 20).attr('ry', 20)
              .attr('fill', 'transparent') 
              .style('pointer-events', 'all'); // Ensure it catches hover

          // 2. Append Controls Group (on top)
          const controls = group.append('g').attr('class', 'quick-add-group');
          
          // 8 Positions: N, NE, E, SE, S, SW, W, NW
          const directions = [
              { id: 'n',  x: 0, y: -h2 - pad, vx: 0, vy: -1 },
              { id: 'ne', x: w2 + pad, y: -h2 - pad, vx: 1, vy: -1 },
              { id: 'e',  x: w2 + pad, y: 0, vx: 1, vy: 0 },
              { id: 'se', x: w2 + pad, y: h2 + pad, vx: 1, vy: 1 },
              { id: 's',  x: 0, y: h2 + pad, vx: 0, vy: 1 },
              { id: 'sw', x: -w2 - pad, y: h2 + pad, vx: -1, vy: 1 },
              { id: 'w',  x: -w2 - pad, y: 0, vx: -1, vy: 0 },
              { id: 'nw', x: -w2 - pad, y: -h2 - pad, vx: -1, vy: -1 },
          ];

          controls.selectAll('g')
              .data(directions)
              .enter()
              .append('g')
              .attr('class', 'quick-add-btn')
              .attr('transform', (p: any) => `translate(${p.x}, ${p.y})`)
              .style('cursor', 'pointer')
              .style('opacity', 0)
              .on('click', (e: any, p: any) => {
                  e.stopPropagation();
                  // Calculate new position (approx 200px away)
                  const dist = 200;
                  const newX = (d.x || 0) + (p.vx * dist);
                  const newY = (d.y || 0) + (p.vy * dist);
                  onNodeConnectToNew(d.id, { x: newX, y: newY });
              })
              .each(function() {
                  const btn = d3.select(this);
                  btn.append('circle')
                      .attr('r', btnR)
                      .attr('fill', isDarkMode ? '#1f2937' : '#ffffff')
                      .attr('stroke', '#3b82f6')
                      .attr('stroke-width', 1.5);
                  
                  // Plus sign
                  btn.append('path')
                      .attr('d', 'M-3 0 h6 M0 -3 v6')
                      .attr('stroke', '#3b82f6')
                      .attr('stroke-width', 1.5);
              })
              .transition().duration(200).style('opacity', 1);

      })
      .on('mouseleave', function() {
          d3.select(this).selectAll('.quick-add-group').remove();
          d3.select(this).selectAll('.bridge-group').remove();
      })
      .style('transition', 'opacity 0.3s ease')
      .attr('opacity', (d: any) => {
          if (focusMode === 'narrow') return 1.0;
          return ((multiSelection.size === 0 && !selectedRelationshipId) || highlightedNodeIds.has(d.id)) ? 1.0 : 0.2;
      });

    // --- Node Shape Rendering Logic ---
    (node.selectAll('*') as any).remove(); 

    // Determine shape dimensions based on mode
    const getShapeSize = (nodeShape: NodeShape) => {
        if (nodeShape === 'circle') return { w: 60, h: 60 }; // R = 30
        if (nodeShape === 'point') return { w: 12, h: 12 };  // R = 6
        return { w: NODE_MAX_WIDTH, h: 80 }; // Rect/Oval default
    };

    const currentShapeSize = getShapeSize(nodeShape as NodeShape);
    const isCompact = nodeShape === 'circle' || nodeShape === 'point';

    // --- Highlighter "Scribble" Path ---
    node.append('path')
        .attr('class', 'highlight-scribble')
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        // We hide it initially or use display: none if not highlighted, logic below handles d/stroke
        .attr('d', '')
        .attr('stroke-width', 3) // Thinner for smaller shapes
        .attr('stroke-opacity', 0.6)
        .attr('filter', 'url(#marker-blur)')
        .style('pointer-events', 'none'); // Let clicks pass through

    // --- Main Shape ---
    if (nodeShape === 'oval') {
        node.append('ellipse')
            .attr('rx', (d: any) => (d.width || NODE_MAX_WIDTH)/2)
            .attr('ry', (d: any) => (d.height || 80)/2);
    } else if (nodeShape === 'circle') {
        node.append('circle')
            .attr('r', 30);
    } else if (nodeShape === 'point') {
        node.append('circle')
            .attr('r', 6);
    } else {
        // Rectangle (Default)
        node.append('rect')
            .attr('width', (d: any) => d.width || NODE_MAX_WIDTH)
            .attr('height', (d: any) => d.height || 80)
            .attr('x', (d: any) => -(d.width || NODE_MAX_WIDTH)/2)
            .attr('y', (d: any) => -(d.height || 80)/2)
            .attr('rx', 8).attr('ry', 8);
    }

    // Apply styling to the shape (whether rect, circle, or ellipse)
    node.select(nodeShape === 'oval' ? 'ellipse' : (isCompact ? 'circle' : 'rect'))
        .attr('fill', (d: any) => {
            if (!activeColorScheme) return DEFAULT_NODE_COLOR;
            for (const tag of d.tags) {
                const color = lowerCaseTagColors[tag.toLowerCase()];
                if (color) return color;
            }
            return DEFAULT_NODE_COLOR;
        })
        .attr('stroke', (d: any) => {
            if (simulationState && simulationState[d.id]) {
                const state = simulationState[d.id];
                if (state === 'increased') return '#22c55e'; // Green
                if (state === 'decreased') return '#ef4444'; // Red
            }
            if (multiSelection.has(d.id)) return '#eab308'; // Yellow-500
            return '#cbd5e1'; // Default border
        })
        .style('transition', 'stroke 0.2s ease, stroke-width 0.2s ease, filter 0.2s ease')
        .attr('stroke-width', (d: any) => {
            if (simulationState && simulationState[d.id] !== 'neutral') return 4;
            if (multiSelection.has(d.id)) return 4;
            return 1.5;
        })
        .attr('filter', (d: any) => {
            if (simulationState && simulationState[d.id] === 'increased') return 'url(#glow-green)';
            if (simulationState && simulationState[d.id] === 'decreased') return 'url(#glow-red)';
            if (multiSelection.has(d.id)) return 'url(#glow-yellow)';
            return null;
        });

    // --- Text Content ---
    const fo = node.append('foreignObject')
        .attr('pointer-events', 'none');
        
    const div = fo.append('xhtml:div')
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'flex')
        .style('justify-content', isCompact ? 'flex-start' : 'center')
        .style('align-items', 'center')
        .style('box-sizing', 'border-box')
        .style('font-weight', '600')
        .style('font-size', '14px')
        .style('word-break', 'break-word')
        .html((d: any) => d.name);

    if (isCompact) {
        // Text OUTSIDE to the right
        const offsetX = nodeShape === 'circle' ? 35 : 12;
        fo.attr('width', 200)
          .attr('height', 40)
          .attr('x', offsetX)
          .attr('y', -20); // Centered vertically relative to circle center
          
        div.style('color', isDarkMode ? '#ffffff' : '#000000')
           .style('text-shadow', isDarkMode ? '0px 0px 4px #000' : '0px 0px 4px #fff')
           .style('text-align', 'left')
           .style('padding', '0');
    } else {
        // Text INSIDE
        fo.attr('width', NODE_MAX_WIDTH);
        
        div.style('color', '#1f2937')
           .style('text-align', 'center')
           .style('min-height', '80px')
           .style('padding', `${NODE_PADDING * 1.5}px ${NODE_PADDING}px`);
    }

    // --- Move Zone (Interaction Layer) ---
    node.append('rect')
        .attr('class', 'move-zone')
        .attr('fill', 'transparent');

    // --- Size Calculation Loop ---
    node.each(function (d: any) {
        const nodeElement = d3.select(this);
        
        // Determine logical dimensions for connections
        let width = NODE_MAX_WIDTH;
        let height = 80;
        
        if (isCompact) {
            // Fixed size for connections
            width = currentShapeSize.w;
            height = currentShapeSize.h;
        } else {
            // Dynamic size based on text
            const foDiv = nodeElement.select('div').node();
            if (foDiv) {
                height = foDiv.scrollHeight;
                width = NODE_MAX_WIDTH;
                
                // Update FO size/pos for internal text
                nodeElement.select('foreignObject')
                    .attr('width', width).attr('height', height)
                    .attr('x', -width / 2).attr('y', -height / 2);
                
                // Update Shape size
                if (nodeShape === 'oval') {
                    nodeElement.select('ellipse')
                        .attr('rx', width/2)
                        .attr('ry', height/2);
                } else {
                    nodeElement.select('rect:not(.move-zone)')
                        .attr('width', width).attr('height', height)
                        .attr('x', -width / 2).attr('y', -height / 2);
                }
            }
        }

        const dNode = d as D3Node;
        dNode.width = width;
        dNode.height = height;
            
        // Scribble Path update: Check META highlight OR Analysis highlight
        const metaHighlight = d.meta?.highlightColor;
        const analysisHighlight = analysisHighlights?.get(d.id);
        const activeHighlightColor = analysisHighlight || metaHighlight;

        if (activeHighlightColor) {
             const scribblePath = generateScribblePath(width, height, d.id);
             
             nodeElement.select('.highlight-scribble')
                .attr('d', scribblePath)
                .attr('stroke', activeHighlightColor) 
                .style('display', 'block');
        } else {
             nodeElement.select('.highlight-scribble')
                .style('display', 'none');
        }
        
        const CONNECT_BORDER_WIDTH = isCompact ? 5 : 20;
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

    // Custom SVG Cursor for Highlight Pen (yellow highlighter)
    const highlightCursorSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 2-2.5 2.5"/><path d="M13.5 6.5 8 12"/></svg>`);
    const highlightCursor = `url("data:image/svg+xml;charset=utf-8,${highlightCursorSvg}") 2 22, auto`;

    // Custom SVG Cursor for Connect Mode (blue plus circle)
    const connectCursorSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.2)" stroke="#3b82f6" stroke-width="2" /><path d="M12 7v10M7 12h10" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" /></svg>`);
    const connectCursor = `url("data:image/svg+xml;charset=utf-8,${connectCursorSvg}") 12 12, crosshair`;

    let moveZoneCursor = isPhysicsModeActive ? 'grab' : 'move';

    if (isBulkEditActive) {
        cursorStyle = bulkCursor;
        moveZoneCursor = bulkCursor;
    } else if (isHighlightToolActive) {
        cursorStyle = highlightCursor;
        moveZoneCursor = highlightCursor;
    } else if (isSimulationMode) {
        cursorStyle = 'pointer'; // Click to stimulate
        moveZoneCursor = 'pointer';
    } else if (isPhysicsModeActive) {
        cursorStyle = 'grab';
    } else {
        cursorStyle = connectCursor; // Custom Connect Cursor
    }

    node.style('cursor', cursorStyle);
    node.select('.move-zone').style('cursor', moveZoneCursor);

    const zoom = d3.zoom()
        .filter((event: any) => {
            // Allow zoom if NO buttons are pressed (wheel) OR if left button is pressed WITHOUT Alt
            return (!event.button && !event.altKey) || (event.button === 0 && !event.altKey);
        })
        .on('zoom', (event: any) => {
          g.attr('transform', event.transform);
        });

    zoomRef.current = zoom;
    svg.call(zoom as any);
    svg.on('click', (event: any) => {
        if (preventClickRef.current) {
            preventClickRef.current = false;
            return;
        }
        onCanvasClick();
    });
    
    // Add SVG text/background double click listener
    svg.on('dblclick.zoom', null)
      .on('dblclick', (event: any) => {
        // Check if click target is svg background
        if (event.target.tagName === 'svg' || event.target === svg.node() || event.target.tagName === 'rect' && event.target.classList.contains('selection-box')) {
            const node = g.node();
            if (node) {
                const [x, y] = d3.pointer(event, node);
                onCanvasDoubleClick({x, y});
            }
        }
      });

    if (isPhysicsModeActive) {
      simulation
        .force('link', d3.forceLink(d3Links).id((d: any) => d.id).distance(layoutParams.linkDistance))
        .force('charge', d3.forceManyBody().strength(layoutParams.repulsion))
        .force('center', d3.forceCenter(width / 2, height / 2));

      const physicsDragHandler = createPhysicsDragHandler(simulation, onNodeClick, setElements, multiSelection);
      node.call(physicsDragHandler as any);
    } else {
      simulation
        .force('link', null)
        .force('charge', null)
        .force('center', null);
        
      const staticDragHandler = createDragHandler(setElements, onNodeClick, onNodeConnect, onNodeConnectToNew, multiSelection);
      node.call(staticDragHandler as any);
    }

    simulation.on('tick', () => {
      const simGetter = simulation as any;
      const nodesById = new Map<string, D3Node>((simGetter.nodes() as D3Node[]).map((n: D3Node) => [n.id, n]));
      
      link.attr('id', (d: any) => d.id)
        .attr('d', (d: any) => {
          const source = (typeof d.source === 'string' ? nodesById.get(d.source) : d.source) as D3Node | undefined;
          const target = (typeof d.target === 'string' ? nodesById.get(d.target) : d.target) as D3Node | undefined;
          
          if (!source || !target || !(source as any).width || !(target as any).width) return null;

          const startPoint = getRectIntersection(source, target);
          const endPoint = getRectIntersection(target, source);
          
          return `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`;
        });

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
    
    (simulation.alpha(0.3) as any).restart();

  }, [elements, relationships, activeColorScheme, selectedElementId, selectedRelationshipId, multiSelection, onNodeClick, onLinkClick, onCanvasClick, onCanvasDoubleClick, onNodeContextMenu, onLinkContextMenu, setElements, onNodeConnect, onNodeConnectToNew, focusMode, isPhysicsModeActive, highlightedNodeIds, onCanvasContextMenu, isBulkEditActive, simulationState, isSimulationMode, analysisHighlights, isDarkMode, nodeShape, isHighlightToolActive]);

  return (
    <div className={`w-full h-full flex-grow cursor-grab active:cursor-grabbing select-none ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} 
         onContextMenu={handleCanvasContextMenu}
         onMouseDownCapture={handleSelectionMouseDown}
    >
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
          {/* Light Mode Markers */}
          <marker
            id="arrow-light"
            viewBox="0 -5 10 10"
            refX={10}
            refY={0}
            markerWidth={6}
            markerHeight={6}
            orient="auto">
            <path d="M0,-5L10,0L0,5" fill="#4b5563"></path>
          </marker>
          <marker
            id="arrow-rev-light"
            viewBox="0 -5 10 10"
            refX={0}
            refY={0}
            markerWidth={6}
            markerHeight={6}
            orient="auto">
            <path d="M10,-5L0,0L10,5" fill="#4b5563"></path>
          </marker>

          <filter id="marker-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
          </filter>

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
        
        {/* Selection Box Overlay */}
        {selectionBox && (
            <rect 
                x={Math.min(selectionBox.startX, selectionBox.currentX)}
                y={Math.min(selectionBox.startY, selectionBox.currentY)}
                width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                fill="rgba(59, 130, 246, 0.1)" 
                stroke="#3b82f6" 
                strokeWidth="1" 
                strokeDasharray="4"
                className="selection-box"
                pointerEvents="none"
            />
        )}
      </svg>
    </div>
  );
});

export default GraphCanvas;
