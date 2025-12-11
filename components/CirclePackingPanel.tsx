
import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { Element, Relationship, ColorScheme } from '../types';

interface CirclePackingPanelProps {
    elements: Element[];
    relationships: Relationship[];
    onClose: () => void;
    onNodeClick: (elementId: string) => void;
    isDarkMode: boolean;
    activeColorScheme: ColorScheme | undefined;
}

type LabelMode = 'hover' | 'always' | 'zoom';
type ColorMode = 'schema' | 'pastel' | 'blue' | 'grey' | 'rainbow';

export const CirclePackingPanel: React.FC<CirclePackingPanelProps> = ({ 
    elements, relationships, onClose, onNodeClick, isDarkMode, activeColorScheme 
}) => {
    // State for configuration
    const [groupingFields, setGroupingFields] = useState<string[]>(['Tag']);
    const [newGroupInput, setNewGroupInput] = useState('');
    const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);
    const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, name: string, isGroup: boolean } | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null);
    
    // View State
    const [labelMode, setLabelMode] = useState<LabelMode>('hover');
    const [colorMode, setColorMode] = useState<ColorMode>('schema');

    // D3 Refs
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomToRootRef = useRef<(() => void) | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    
    // Track the last focused node name to persist zoom across re-renders
    const lastFocusName = useRef<string | null>(null);
    const hoveredNodeRef = useRef<any>(null); // Track node for hiding label on hover
    const currentZoomK = useRef<number>(1);   // Track zoom K for restoring opacity

    // Stable ref for onNodeClick to prevent D3 re-renders on prop change
    const onNodeClickRef = useRef(onNodeClick);
    useEffect(() => {
        onNodeClickRef.current = onNodeClick;
    }, [onNodeClick]);

    // Initialize attributes list
    useEffect(() => {
        const attrs = new Set<string>(['Tag']);
        elements.forEach(e => {
            if (e.attributes) {
                Object.keys(e.attributes).forEach(k => attrs.add(k));
            }
        });
        setAvailableAttributes(Array.from(attrs).sort());
    }, [elements]);

    // Handle Resize
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height
                    });
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Color Resolution Logic
    const resolveNodeColor = (el: Element, index: number) => {
        if (colorMode === 'schema') {
            if (activeColorScheme) {
                for (const tag of el.tags) {
                    const match = Object.keys(activeColorScheme.tagColors).find(k => k.toLowerCase() === tag.toLowerCase());
                    if (match) return activeColorScheme.tagColors[match];
                }
            }
            return isDarkMode ? '#4b5563' : '#e5e7eb';
        }

        if (colorMode === 'pastel') {
            const scheme = d3.schemePastel1; // 9 colors
            return scheme[index % scheme.length];
        }

        if (colorMode === 'blue') {
            return d3.interpolateBlues(0.3 + (index % 10) / 20); // 0.3 to 0.8 range
        }
        
        if (colorMode === 'grey') {
             return d3.interpolateGreys(0.2 + (index % 10) / 20);
        }

        if (colorMode === 'rainbow') {
            return d3.interpolateRainbow(index / elements.length);
        }

        return '#ccc';
    };

    // Construct Hierarchy Data
    const hierarchyData = useMemo(() => {
        const root: any = { name: "All", children: [] };
        
        elements.forEach((el, index) => {
            let currentLevel = root.children;
            let skipNode = false;

            // Navigate/Build hierarchy based on fields
            for (const field of groupingFields) {
                let value = "Uncategorized";
                
                if (field === 'Tag') {
                    value = el.tags[0] || "No Tag";
                } else if (el.attributes && el.attributes[field]) {
                    value = el.attributes[field];
                }
                
                if (hiddenGroups.has(value)) {
                    skipNode = true;
                    break;
                }

                let existingGroup = currentLevel.find((g: any) => g.name === value && g.children);
                if (!existingGroup) {
                    existingGroup = { name: value, children: [] };
                    currentLevel.push(existingGroup);
                }
                currentLevel = existingGroup.children;
            }
            
            // Add leaf node
            if (!skipNode) {
                currentLevel.push({ 
                    name: el.name, 
                    value: 1, 
                    id: el.id, 
                    leafColor: resolveNodeColor(el, index),
                    data: el 
                });
            }
        });

        // Recursively prune empty groups
        const prune = (node: any) => {
            if (node.children) {
                node.children = node.children.filter((c: any) => {
                    if (c.children) {
                        prune(c);
                        return c.children.length > 0;
                    }
                    return true;
                });
            }
        };
        prune(root);

        return root;
    }, [elements, groupingFields, activeColorScheme, isDarkMode, hiddenGroups, colorMode]);

    // D3 Render Effect
    useEffect(() => {
        if (!svgRef.current || !hierarchyData || dimensions.width === 0 || dimensions.height === 0) return;

        const width = dimensions.width;
        const height = dimensions.height;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const pack = d3.pack()
            .size([width, height])
            .padding(3);

        const root: any = d3.hierarchy(hierarchyData)
            .sum((d: any) => d.value)
            .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

        const nodes = pack(root).descendants();
        
        // Restore focus if available
        let initialFocus = root;
        if (lastFocusName.current) {
            const found = nodes.find((n: any) => n.data.name === lastFocusName.current);
            if (found) initialFocus = found;
        }

        let focus: any = initialFocus;
        let view: [number, number, number];

        // Color Scale for Groups (Depth based)
        const groupColorScale = d3.scaleLinear<string>()
            .domain([0, 5])
            .range(isDarkMode 
                ? ["hsl(220, 20%, 20%)", "hsl(220, 40%, 40%)"] 
                : ["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
            .interpolate(d3.interpolateHcl);

        svg.attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
           .style("background", groupColorScale(0))
           .style("cursor", "pointer")
           .on("click", (event) => {
                // Background click zooms out to root
                if (focus !== root) {
                    zoom(event, root);
                }
           });

        // --- Render Nodes (Circles) ---
        const nodeGroup = svg.append("g").attr("class", "nodes");
        
        const circle = nodeGroup.selectAll("circle")
            .data(nodes.slice(1)) // Skip root
            .join("circle")
            .attr("fill", (d: any) => d.children ? groupColorScale(d.depth) : d.data.leafColor)
            .attr("pointer-events", "all")
            .style("transition", "fill 0.2s ease");

        // --- Render Labels (ForeignObject for wrapping) ---
        const labelGroup = svg.append("g").attr("class", "labels");
        
        const label = labelGroup.selectAll("foreignObject")
            .data(nodes)
            .join("foreignObject")
            .attr("class", "label-container")
            .style("overflow", "visible")
            .style("pointer-events", "none"); // Let clicks pass through to circle

        // Append div inside foreignObject
        label.each(function(d: any) {
            const fo = d3.select(this);
            fo.html('');
            
            const textColor = isDarkMode ? "#e5e7eb" : "#1f2937";
            const isGroup = !!d.children;
            
            fo.append("xhtml:div")
                .style("width", "100%")
                .style("height", "100%")
                .style("display", "flex")
                .style("justify-content", "center")
                .style("align-items", "center")
                .style("text-align", "center")
                .style("word-wrap", "break-word")
                .style("overflow", "hidden")
                .style("line-height", "1.1")
                .style("color", textColor)
                .style("font-weight", isGroup ? "bold" : "normal")
                .text(d.data.name);
        });

        // --- Visibility Logic Helper ---
        const getOpacity = (d: any, k: number) => {
            // Rule 0: If hovered (and thus showing tooltip), hide internal label
            if (hoveredNodeRef.current === d) return 0;

            // Rule 1: Always show labels for direct children of the focused node (Zoomed view)
            if (d.parent === focus) return 1;

            // Rule 2: Label Modes
            if (labelMode === 'always') return ((d as any).r * k > 10) ? 1 : 0; // Basic clutter filter
            if (labelMode === 'zoom') return ((d as any).r * k > 40) ? 1 : 0; // Only large ones
            
            // Rule 3: Hover mode default state is hidden (unless rule 1 applies)
            if (labelMode === 'hover') return 0;
            
            return 0;
        };

        const updateLabelVisibility = (k: number) => {
             label.select("div")
                .style("font-size", (d: any) => {
                    const r = d.r * k; // current radius in pixels
                    const name = d.data.name;
                    
                    const len = name.length;
                    let size = r / 2.5; // Start reasonable relative to radius
                    
                    // Scale by area approximation: More text = smaller font
                    if (len > 0) {
                        size = Math.min(size, (r * 3.5) / Math.sqrt(len));
                    }
                    
                    // Constrain by longest word width to prevent overflow
                    const words = name.split(/[\s-_]+/);
                    const maxWordLen = Math.max(...words.map((w: string) => w.length));
                    if (maxWordLen > 0) {
                        // Assume approx 0.6em width per char. 
                        // We want maxWordLen * size * 0.6 <= 1.9 * r (fit within 95% diameter)
                        const maxCharSize = (r * 1.9) / (maxWordLen * 0.6);
                        size = Math.min(size, maxCharSize);
                    }

                    return `${size}px`;
                })
                .style("opacity", (d: any) => getOpacity(d, k));
        };

        // --- Zoom Functions ---
        const zoomTo = (v: [number, number, number]) => {
            const k = width / v[2];
            currentZoomK.current = k;
            view = v;
            
            circle.attr("transform", (d: any) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            circle.attr("r", (d: any) => d.r * k);
            
            label
                .attr("transform", (d: any) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
                .attr("width", (d: any) => d.r * 2 * k)
                .attr("height", (d: any) => d.r * 2 * k)
                .attr("x", (d: any) => -d.r * k) // Access r from any cast
                .attr("y", (d: any) => -d.r * k)
                .style("display", (d: any) => (d.r * k > 10) ? "inline" : "none");

            updateLabelVisibility(k);
        };

        const zoom = (event: any, d: any) => {
            focus = d;
            lastFocusName.current = d.data.name;

            const transition = svg.transition()
                .duration(750)
                .tween("zoom", () => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + 20]);
                    return (t: number) => zoomTo(i(t));
                });
        };

        zoomToRootRef.current = () => zoom(null, root);

        // --- Event Listeners ---
        circle
            .on("click", (event, d: any) => {
                event.stopPropagation();
                if (d.children) {
                    if (focus !== d) zoom(event, d);
                    else zoom(event, d.parent || root);
                } else {
                    if (onNodeClickRef.current) onNodeClickRef.current((d.data as any).id);
                }
            })
            .on("contextmenu", (event, d: any) => {
                event.preventDefault();
                event.stopPropagation();
                const [mx, my] = d3.pointer(event, containerRef.current);
                setContextMenu({ x: mx, y: my, name: d.data.name, isGroup: !!d.children });
            })
            .on("mousemove", (event) => {
                 const [mx, my] = d3.pointer(event, containerRef.current);
                 // Update tooltip position to follow mouse with offset
                 setTooltip(prev => prev ? { ...prev, x: mx + 15, y: my } : null);
            })
            .on("mouseenter", (event, d: any) => {
                 hoveredNodeRef.current = d;

                 if (labelMode === 'hover') {
                     // Show direct children labels when hovering a group
                     // Also hide the hovered node's center label
                     label.select("div").style("opacity", (l: any) => {
                         if (l === d) return 0; // Hide self (shown in tooltip)
                         if (l.parent === focus) return 1; // Keep focus visible
                         if (l.parent === d) return 1; // Show children of hovered
                         return 0;
                     });
                 } else {
                     // In other modes, just hide the hovered node's label
                     label.filter((l: any) => l === d).select("div").style("opacity", 0);
                 }
                 
                 d3.select(event.currentTarget).attr("stroke", isDarkMode ? "#fff" : "#000").attr("stroke-width", 2);
                 
                 const [mx, my] = d3.pointer(event, containerRef.current);
                 setTooltip({ x: mx + 15, y: my, text: d.data.name });
            })
            .on("mouseleave", (event, d: any) => {
                 hoveredNodeRef.current = null;

                 if (labelMode === 'hover') {
                     // Reset to base state: Only direct children of focus are visible
                     label.select("div").style("opacity", (l: any) => getOpacity(l, currentZoomK.current));
                 } else {
                     // Restore opacity for this node
                     label.filter((l: any) => l === d).select("div").style("opacity", getOpacity(d, currentZoomK.current));
                 }

                 setTooltip(null);
                 d3.select(event.currentTarget).attr("stroke", null);
            });

        // Initial Zoom
        zoomTo([root.x, root.y, root.r * 2 + 20]);

    }, [hierarchyData, dimensions, isDarkMode, activeColorScheme, labelMode, colorMode]); 

    // --- Configuration Handlers ---

    const handleAddGroup = (value: string) => {
        if (value && !groupingFields.includes(value)) {
            setGroupingFields(prev => [...prev, value]);
            setNewGroupInput('');
        }
    };

    const handleMoveGroupRight = (index: number) => {
        if (index < groupingFields.length - 1) {
            const newFields = [...groupingFields];
            [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
            setGroupingFields(newFields);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (availableAttributes.includes(val)) {
            handleAddGroup(val);
            setNewGroupInput('');
        } else {
            setNewGroupInput(val);
        }
    };
    
    const handleHideGroup = () => {
        if (contextMenu) {
            setHiddenGroups(prev => new Set([...prev, contextMenu.name]));
            setContextMenu(null);
        }
    };

    const handleResetHidden = () => setHiddenGroups(new Set());
    const handleRemoveGroup = (field: string) => setGroupingFields(prev => prev.filter(f => f !== field));
    const handleZoomToFit = () => { if (zoomToRootRef.current) zoomToRootRef.current(); };

    const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const inputClass = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const pillClass = isDarkMode ? 'bg-blue-900/50 text-blue-200 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200';
    const iconBtnClass = isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-black';
    const selectClass = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

    return (
        <div className={`w-full h-full flex flex-col ${bgClass}`}>
            <div className={`p-4 border-b ${borderClass} flex justify-between items-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <h2 className={`text-xl font-bold ${textClass}`}>Circle Packing</h2>
                <div className="flex gap-2">
                    <button onClick={handleZoomToFit} className={`p-1 rounded transition-colors ${iconBtnClass}`} title="Zoom to Fit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                        </svg>
                    </button>
                    <button onClick={onClose} className={`${subTextClass} hover:text-blue-500`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className={`p-3 border-b ${borderClass} flex flex-col gap-3`}>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold uppercase ${subTextClass} mr-1`}>Hierarchy:</span>
                    {groupingFields.map((field, idx) => (
                        <React.Fragment key={field}>
                            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${pillClass}`}>
                                <span>{field}</span>
                                <button onClick={() => handleRemoveGroup(field)} className="hover:text-red-400 font-bold ml-1">×</button>
                            </div>
                            {idx < groupingFields.length - 1 && (
                                <button onClick={() => handleMoveGroupRight(idx)} className="text-gray-500 hover:text-blue-500 mx-1 font-bold transition-colors cursor-pointer">→</button>
                            )}
                        </React.Fragment>
                    ))}
                    {groupingFields.length === 0 && <span className="text-xs text-gray-500 italic">No groups selected. Nodes are flat.</span>}
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-grow max-w-xs">
                        <input list="attributes-list" type="text" value={newGroupInput} onChange={handleInputChange} className={`w-full text-xs px-2 py-1.5 rounded border outline-none focus:ring-1 focus:ring-blue-500 ${inputClass}`} placeholder="Add grouping (e.g. Tag, Priority)..." onKeyDown={(e) => { if (e.key === 'Enter' && newGroupInput.trim()) { handleAddGroup(newGroupInput.trim()); setNewGroupInput(''); } }} />
                        <datalist id="attributes-list">{availableAttributes.map(attr => <option key={attr} value={attr} />)}</datalist>
                    </div>

                    <div className="w-px h-6 bg-gray-600 mx-2"></div>

                    <div className="flex items-center gap-2">
                         <span className={`text-xs ${subTextClass}`}>Labels:</span>
                         <select 
                            value={labelMode}
                            onChange={(e) => setLabelMode(e.target.value as LabelMode)}
                            className={`text-xs rounded border px-2 py-1 outline-none ${selectClass}`}
                         >
                             <option value="hover">Hover</option>
                             <option value="always">Always Shown</option>
                             <option value="zoom">Zoom Level</option>
                         </select>
                    </div>

                    <div className="flex items-center gap-2">
                         <span className={`text-xs ${subTextClass}`}>Colors:</span>
                         <select 
                            value={colorMode}
                            onChange={(e) => setColorMode(e.target.value as ColorMode)}
                            className={`text-xs rounded border px-2 py-1 outline-none ${selectClass}`}
                         >
                             <option value="schema">Schema</option>
                             <option value="pastel">Pastel</option>
                             <option value="blue">Blue</option>
                             <option value="grey">Grey</option>
                             <option value="rainbow">Rainbow</option>
                         </select>
                    </div>

                    {hiddenGroups.size > 0 && (
                        <button onClick={handleResetHidden} className="text-xs text-red-400 hover:text-red-300 ml-auto border border-red-900/50 px-2 py-1 rounded bg-red-900/20">Reset Hidden ({hiddenGroups.size})</button>
                    )}
                </div>
            </div>

            <div className="flex-grow overflow-hidden relative" ref={containerRef}>
                <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block w-full h-full" />
                {tooltip && <div className={`absolute px-2 py-1 text-xs rounded pointer-events-none z-50 shadow-md whitespace-nowrap ${isDarkMode ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-300'}`} style={{ left: tooltip.x, top: tooltip.y }}>{tooltip.text}</div>}
                {contextMenu && (
                    <div className={`absolute z-50 rounded shadow-xl border py-1 w-32 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`} style={{ left: contextMenu.x, top: contextMenu.y }} onMouseLeave={() => setContextMenu(null)}>
                        <div className="px-3 py-1 text-xs font-bold border-b border-gray-600 mb-1 opacity-70 truncate">{contextMenu.name}</div>
                        <button onClick={handleHideGroup} className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-500 hover:text-white transition-colors`}>Hide Group</button>
                    </div>
                )}
            </div>
        </div>
    );
};
