
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Element, ColorScheme } from '../types';
import { DEFAULT_NODE_COLOR } from '../constants';

interface GridPanelProps {
  elements: Element[];
  activeColorScheme: ColorScheme | undefined;
  onClose: () => void;
  onNodeClick?: (elementId: string) => void;
}

const GridPanel: React.FC<GridPanelProps> = ({ elements, activeColorScheme, onClose, onNodeClick }) => {
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(11);
  const [dotSize, setDotSize] = useState(5);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Store positions to persist them between renders (e.g., when changing font size or stopping physics)
  const nodePositionsRef = useRef<Map<string, {x: number, y: number}>>(new Map());
  // Track axes to reset positions when axes change
  const prevAxes = useRef({ x: '', y: '' });

  // Extract all unique attribute keys available in the elements
  const availableAttributes = useMemo(() => {
    const keys = new Set<string>();
    elements.forEach(el => {
      if (el.attributes) {
        Object.keys(el.attributes).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys).sort();
  }, [elements]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isFullscreen]);

  // Toggle Simulation
  useEffect(() => {
      if (simulationRef.current) {
          if (isSimulating) {
              simulationRef.current.alpha(1).restart();
          } else {
              simulationRef.current.stop();
          }
      }
  }, [isSimulating]);

  const handleCopyCSV = () => {
      if (!xAxisKey || !yAxisKey) return;
      
      const data = elements.filter(e => 
        e.attributes && 
        e.attributes[xAxisKey] !== undefined && 
        e.attributes[yAxisKey] !== undefined
      );

      const headers = ['Name', xAxisKey, yAxisKey];
      const rows = data.map(d => {
          // Escape commas in content
          const name = d.name.includes(',') ? `"${d.name}"` : d.name;
          const xVal = String(d.attributes![xAxisKey]).includes(',') ? `"${d.attributes![xAxisKey]}"` : d.attributes![xAxisKey];
          const yVal = String(d.attributes![yAxisKey]).includes(',') ? `"${d.attributes![yAxisKey]}"` : d.attributes![yAxisKey];
          return [name, xVal, yVal].join(',');
      });
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      navigator.clipboard.writeText(csvContent).then(() => {
          alert("CSV data copied to clipboard!");
      }).catch(err => {
          console.error("Failed to copy CSV", err);
          alert("Failed to copy to clipboard.");
      });
  };

  const handleCopyImage = async () => {
      if (!svgRef.current) return;
      
      try {
          // 1. Serialize SVG
          const svg = svgRef.current;
          const serializer = new XMLSerializer();
          let source = serializer.serializeToString(svg);
          
          // Add namespaces if missing
          if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
              source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          if(!source.match(/^<svg[^>]+xmlns:xlink/)){
              source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
          }

          // 2. Create Blob and URL
          const svgBlob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
          const url = URL.createObjectURL(svgBlob);

          // 3. Load into Image to draw on Canvas
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = dimensions.width;
              canvas.height = dimensions.height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                  // Fill background (otherwise it's transparent)
                  ctx.fillStyle = "#111827"; // matches bg-gray-900
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                  
                  canvas.toBlob(blob => {
                      if (blob) {
                          // 4. Write to clipboard
                          navigator.clipboard.write([
                              new ClipboardItem({ "image/png": blob })
                          ]).then(() => {
                              alert("Image copied to clipboard!");
                          }).catch((e) => {
                              // Fallback for browsers that don't support clipboard write
                              const a = document.createElement('a');
                              a.href = canvas.toDataURL("image/png");
                              a.download = "attribute-grid.png";
                              a.click();
                          });
                      }
                      URL.revokeObjectURL(url);
                  }, "image/png");
              }
          };
          img.src = url;

      } catch (e) {
          console.error("Error exporting image", e);
          alert("Failed to create image.");
      }
  };

  // Draw Chart
  useEffect(() => {
    if (!svgRef.current || !xAxisKey || !yAxisKey) return;

    // Reset stored positions if axes have changed
    if (prevAxes.current.x !== xAxisKey || prevAxes.current.y !== yAxisKey) {
        nodePositionsRef.current.clear();
        prevAxes.current = { x: xAxisKey, y: yAxisKey };
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    const margin = { top: 40, right: 120, bottom: 60, left: 80 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter elements that have values for both axes
    const data = elements.filter(e => 
      e.attributes && 
      e.attributes[xAxisKey] !== undefined && 
      e.attributes[yAxisKey] !== undefined
    );

    if (data.length === 0) {
        g.append('text')
         .attr('x', width / 2)
         .attr('y', height / 2)
         .attr('text-anchor', 'middle')
         .attr('fill', '#9ca3af')
         .text('No elements found with both selected attributes.');
        return;
    }

    // --- Scale Logic ---
    
    const isNumeric = (key: string) => {
        const values = data.map(d => d.attributes![key]);
        const numCount = values.filter(v => !isNaN(parseFloat(v)) && isFinite(Number(v))).length;
        return numCount / values.length > 0.8; 
    };

    const xIsNumeric = isNumeric(xAxisKey);
    const yIsNumeric = isNumeric(yAxisKey);

    let xScale: any, yScale: any;

    // X Scale
    if (xIsNumeric) {
        const values = data.map(d => parseFloat(d.attributes![xAxisKey]));
        const min = d3.min(values) || 0;
        const max = d3.max(values) || 100;
        const padding = (max - min) * 0.1 || 10; 
        xScale = d3.scaleLinear()
            .domain([min - padding, max + padding])
            .range([0, width]);
    } else {
        const values = Array.from(new Set(data.map(d => d.attributes![xAxisKey]))).sort();
        xScale = d3.scalePoint()
            .domain(values)
            .range([0, width])
            .padding(0.5);
    }

    // Y Scale
    if (yIsNumeric) {
        const values = data.map(d => parseFloat(d.attributes![yAxisKey]));
        const min = d3.min(values) || 0;
        const max = d3.max(values) || 100;
        const padding = (max - min) * 0.1 || 10;
        yScale = d3.scaleLinear()
            .domain([min - padding, max + padding])
            .range([height, 0]); 
    } else {
        const values = Array.from(new Set(data.map(d => d.attributes![yAxisKey]))).sort();
        yScale = d3.scalePoint()
            .domain(values)
            .range([height, 0])
            .padding(0.5);
    }

    // --- Axes ---
    g.append('g')
     .attr('transform', `translate(0,${height})`)
     .call(d3.axisBottom(xScale))
     .selectAll('text')
     .attr('transform', 'rotate(-15)')
     .style('text-anchor', 'end')
     .attr('fill', '#9ca3af');

    g.append('g')
     .call(d3.axisLeft(yScale))
     .selectAll('text')
     .attr('fill', '#9ca3af');
     
    // Axis Labels
    g.append('text')
     .attr('x', width / 2)
     .attr('y', height + 45)
     .attr('fill', 'white')
     .attr('text-anchor', 'middle')
     .attr('font-weight', 'bold')
     .text(xAxisKey);

    g.append('text')
     .attr('transform', 'rotate(-90)')
     .attr('x', -height / 2)
     .attr('y', -60)
     .attr('fill', 'white')
     .attr('text-anchor', 'middle')
     .attr('font-weight', 'bold')
     .text(yAxisKey);

    // --- Grid Lines ---
    g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => '').ticks(10))
        .attr('stroke-opacity', 0.1)
        .attr('color', '#4b5563');

    g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => '').ticks(10))
        .attr('stroke-opacity', 0.1)
        .attr('color', '#4b5563');


    // --- Data Points & Label Simulation ---

    const getNodeColor = (el: Element) => {
        if (!activeColorScheme) return DEFAULT_NODE_COLOR;
        for (const tag of el.tags) {
             const match = Object.keys(activeColorScheme.tagColors).find(k => k.toLowerCase() === tag.toLowerCase());
             if (match) return activeColorScheme.tagColors[match];
        }
        return DEFAULT_NODE_COLOR;
    };

    const anchors = data.map(d => ({
        id: `anchor-${d.id}`,
        fx: xScale(xIsNumeric ? parseFloat(d.attributes![xAxisKey]) : d.attributes![xAxisKey]),
        fy: yScale(yIsNumeric ? parseFloat(d.attributes![yAxisKey]) : d.attributes![yAxisKey]),
        color: getNodeColor(d),
        type: 'anchor',
        elementId: d.id // Store original ID for click handling
    }));

    const labels = data.map(d => {
        const labelId = `label-${d.id}`;
        const savedPos = nodePositionsRef.current.get(labelId);
        
        // Initial calculate position (centered on dot, slightly above)
        const dx = xScale(xIsNumeric ? parseFloat(d.attributes![xAxisKey]) : d.attributes![xAxisKey]);
        const dy = yScale(yIsNumeric ? parseFloat(d.attributes![yAxisKey]) : d.attributes![yAxisKey]);
        
        // Closer static position
        const defaultX = dx;
        const defaultY = dy - 12;

        return {
            id: labelId,
            // Use saved position if available, otherwise default
            x: savedPos ? savedPos.x : defaultX,
            y: savedPos ? savedPos.y : defaultY,
            name: d.name,
            width: d.name.length * (fontSize * 0.6) + 10,
            height: fontSize + 4,
            type: 'label',
            elementId: d.id // Store original ID for click handling
        };
    });

    const links = data.map((d) => ({
        source: `anchor-${d.id}`,
        target: `label-${d.id}`,
        id: `link-${d.id}`
    }));

    const allNodes = [...anchors, ...labels];

    // Initialize simulation early to resolve link references
    const simulation = d3.forceSimulation(allNodes as any)
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(dotSize + 2).strength(0.8))
        .force('charge', d3.forceManyBody().strength(-30))
        .force('collide', d3.forceCollide().radius((d: any) => d.type === 'label' ? (d.width/2 + 1) : dotSize + 2).strength(1))
        .stop(); // Don't auto-start

    // Draw Links
    const linkGroup = g.append('g').attr('class', 'links');
    const linkSelection = linkGroup.selectAll('.label-link')
        .data(links)
        .join('line')
        .attr('class', 'label-link')
        .attr('id', d => (d as any).id)
        .attr('stroke', '#4b5563')
        .attr('stroke-width', 1)
        .attr('opacity', 0.6)
        .style('pointer-events', 'none') // Make lines unclickable/undraggable
        // Set initial coordinates immediately
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

    // Draw Anchors (Dots)
    g.selectAll('.anchor')
     .data(anchors)
     .enter() // Anchors don't move or change size dynamically in this view usually, but could join if needed
     .append('circle')
     .attr('class', 'anchor')
     .attr('cx', d => d.fx!)
     .attr('cy', d => d.fy!)
     .attr('r', dotSize)
     .attr('fill', d => d.color)
     .attr('stroke', '#1f2937')
     .attr('stroke-width', 1.5)
     .style('cursor', 'pointer')
     .on('click', (e, d) => {
         if (onNodeClick) onNodeClick(d.elementId);
     });

    // Draw Labels
    const labelGroup = g.append('g').attr('class', 'labels');
    const labelSelection = labelGroup.selectAll<SVGTextElement, any>('.label-text')
        .data(labels, d => d.id)
        .join('text') // Use join to update existing elements when fontSize changes
        .attr('class', 'label-text')
        .attr('id', d => d.id)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e5e7eb')
        .style('font-size', `${fontSize}px`)
        .style('cursor', 'grab')
        .style('text-shadow', '1px 1px 2px #000')
        // Set position
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .text(d => d.name);
    
    // Drag Behavior
    let startX = 0;
    let startY = 0;
    let hasMoved = false;

    const drag = d3.drag<SVGTextElement, any>()
        .on("start", function(event, d) {
            if (!event.active && isSimulating) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            startX = event.x;
            startY = event.y;
            hasMoved = false;
            d3.select(this).style("cursor", "grabbing");
        })
        .on("drag", function(event, d) {
            d.fx = event.x;
            d.fy = event.y;
            // Update data
            d.x = event.x; 
            d.y = event.y;
            
            if (!hasMoved && (Math.abs(event.x - startX) > 3 || Math.abs(event.y - startY) > 3)) {
                hasMoved = true;
            }

            // Save position to ref immediately so it persists on re-render/resize
            nodePositionsRef.current.set(d.id, { x: event.x, y: event.y });

            // If simulation is NOT running, manually update the DOM elements
            if (!isSimulating) {
                d3.select(this)
                    .attr('x', event.x)
                    .attr('y', event.y);
                
                // Find associated link and update it
                const linkId = d.id.replace('label-', 'link-');
                linkGroup.select(`#${linkId}`)
                    .attr('x2', event.x)
                    .attr('y2', event.y);
            }
        })
        .on("end", function(event, d) {
            if (!event.active && isSimulating) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            d3.select(this).style("cursor", "grab");
            
            if (!hasMoved && onNodeClick) {
                onNodeClick(d.elementId);
            }
        });

    labelSelection.call(drag);

    // Simulation Tick
    simulation.on('tick', () => {
        linkSelection
            .attr('x1', d => (d.source as any).x)
            .attr('y1', d => (d.source as any).y)
            .attr('x2', d => (d.target as any).x)
            .attr('y2', d => (d.target as any).y);

        labelSelection
            .attr('x', d => {
                 d.x = Math.max(d.width/2, Math.min(width - d.width/2, d.x));
                 return d.x;
            })
            .attr('y', d => {
                 d.y = Math.max(10, Math.min(height - 10, d.y));
                 return d.y;
            });
            
        // Update stored positions on every tick
        labels.forEach((l: any) => {
            nodePositionsRef.current.set(l.id, { x: l.x, y: l.y });
        });
    });

    simulationRef.current = simulation;
    
    if (isSimulating) {
        simulation.restart();
    }
        
  }, [dimensions, elements, xAxisKey, yAxisKey, activeColorScheme, fontSize, dotSize, isSimulating, onNodeClick]); 

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 flex flex-col bg-gray-800" : "w-full h-full flex flex-col bg-gray-800"}>
      <div className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-700 bg-gray-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Attribute Grid
            <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                {elements.length} items
            </span>
        </h2>
        
        <div className="flex items-center gap-2">
            {/* Size Controls */}
            <div className="flex flex-col px-2 border-r border-gray-700 mr-2">
               <div className="flex items-center gap-2 mb-1">
                   <span className="text-[10px] text-gray-500 w-8">TEXT</span>
                   <input 
                      type="range" min="8" max="24" 
                      value={fontSize} 
                      onChange={e => setFontSize(Number(e.target.value))}
                      className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                   />
               </div>
               <div className="flex items-center gap-2">
                   <span className="text-[10px] text-gray-500 w-8">DOT</span>
                   <input 
                      type="range" min="2" max="20" 
                      value={dotSize} 
                      onChange={e => setDotSize(Number(e.target.value))}
                      className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                   />
               </div>
            </div>

            <div className="flex bg-gray-800 rounded border border-gray-600 p-0.5">
                 <button 
                    onClick={() => setIsSimulating(!isSimulating)}
                    title={isSimulating ? "Physics ON (Auto-Arrange)" : "Physics OFF (Static)"}
                    className={`p-1.5 rounded transition-colors ${isSimulating ? 'text-green-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                 >
                    {isSimulating ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                    )}
                 </button>
                 <div className="w-px bg-gray-600 my-1"></div>
                 <button 
                    onClick={handleCopyImage}
                    title="Copy Chart as Image"
                    className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                 </button>
                 <button 
                    onClick={handleCopyCSV}
                    title="Copy Data as CSV"
                    className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                 </button>
                 <div className="w-px bg-gray-600 my-1"></div>
                 <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                 >
                     {isFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0l5 0m-5 0l0 5M15 9l5-5m0 0l-5 0m5 0l0 5M9 15l-5 5m0 0l5 0m-5 0l0-5M15 15l5 5m0 0l-5 0m5 0l0-5" />
                        </svg>
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                     )}
                 </button>
            </div>
            
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>
      
      <div className="p-4 flex gap-4 bg-gray-900 border-b border-gray-700 flex-shrink-0">
          <div className="flex flex-col gap-1 flex-grow">
              <label className="text-xs font-bold text-gray-400 uppercase">X Axis Attribute</label>
              <select 
                value={xAxisKey} 
                onChange={e => setXAxisKey(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded border border-gray-600 p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                  <option value="">-- Select Attribute --</option>
                  {availableAttributes.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
          </div>
          <div className="flex flex-col gap-1 flex-grow">
              <label className="text-xs font-bold text-gray-400 uppercase">Y Axis Attribute</label>
              <select 
                value={yAxisKey} 
                onChange={e => setYAxisKey(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded border border-gray-600 p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                  <option value="">-- Select Attribute --</option>
                  {availableAttributes.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
          </div>
      </div>

      <div className="flex-grow relative bg-gray-900 overflow-hidden select-none" ref={containerRef}>
        {!xAxisKey || !yAxisKey ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-medium text-gray-400">Configure Axes</p>
                <p className="text-sm mt-1">Select custom attributes for X and Y axes to generate the scatter plot.</p>
            </div>
        ) : (
            <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block cursor-default" />
        )}
      </div>
    </div>
  );
};

export default GridPanel;
