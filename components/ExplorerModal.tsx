
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Element, Relationship } from '../types';
import * as d3Import from 'd3';
import { formatTag } from '../utils';

const d3: any = d3Import;

// --- D3 Treemap Component ---
const D3Treemap: React.FC<{ 
    data: any, 
    width: number, 
    height: number, 
    onLeafClick: (node: any) => void,
    isDarkMode: boolean
}> = ({ data, width, height, onLeafClick, isDarkMode }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const textColor = isDarkMode ? "#6b7280" : "#9ca3af";

        // Handle empty data gracefully
        if (!data.children || data.children.length === 0) {
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .attr("fill", textColor)
                .text("No data available");
            return;
        }

        const root = d3.hierarchy(data)
            .sum((d: any) => d.value)
            .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

        d3.treemap()
            .size([width, height])
            .paddingTop(20)
            .paddingRight(4)
            .paddingInner(2)
            (root);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Render Leaf Nodes (Rectangles)
        const leaf = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`);

        leaf.append("rect")
            .attr("width", (d: any) => d.x1 - d.x0)
            .attr("height", (d: any) => d.y1 - d.y0)
            .attr("fill", (d: any) => {
                // Use parent category for color consistency
                let parentName = d.parent?.data.name || "unknown";
                return colorScale(parentName);
            })
            .attr("opacity", 0.8)
            .style("cursor", "pointer")
            .on("mouseenter", function() { d3.select(this).attr("opacity", 1).attr("stroke", "#fff"); })
            .on("mouseleave", function() { d3.select(this).attr("opacity", 0.8).attr("stroke", "none"); })
            .on("click", (e: any, d: any) => onLeafClick(d.data));

        // Clip path for text
        leaf.append("clipPath")
            .attr("id", (d: any) => `clip-${d.data.id || Math.random()}`)
            .append("rect")
            .attr("width", (d: any) => d.x1 - d.x0)
            .attr("height", (d: any) => d.y1 - d.y0);

        leaf.append("text")
            .attr("clip-path", (d: any) => `url(#clip-${d.data.id})`)
            .selectAll("tspan")
            .data((d: any) => (d.data.name || "").split(/(?=[A-Z][a-z])|\s+/g))
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d: any, i: number, nodes: any) => 13 + (i * 10))
            .text((d: any) => d)
            .attr("font-size", "10px")
            .attr("fill", "white")
            .style("pointer-events", "none");

        // Render Titles (Categories)
        svg.selectAll("titles")
            .data(root.descendants().filter((d: any) => d.depth === 1))
            .enter()
            .append("text")
            .attr("x", (d: any) => d.x0 + 4)
            .attr("y", (d: any) => d.y0 + 14)
            .text((d: any) => d.data.name)
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#fff")
            .attr("opacity", 0.7)
            .style("pointer-events", "none");

    }, [data, width, height, onLeafClick, isDarkMode]);

    return <svg ref={svgRef} width={width} height={height} className="rounded" />;
};

interface TreemapPanelProps {
    elements: Element[];
    relationships: Relationship[];
    onNodeSelect: (id: string) => void;
    isDarkMode: boolean;
}

export const TreemapPanel: React.FC<TreemapPanelProps> = ({ elements, relationships, onNodeSelect, isDarkMode }) => {
    const [view, setView] = useState<'tags' | 'relationships'>('tags');
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (containerRef.current) {
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
        }
    }, []);

    const treemapData = useMemo(() => {
        if (view === 'tags') {
            const tagGroups: Record<string, any[]> = {};
            elements.forEach(el => {
                const tags = el.tags.length > 0 ? el.tags : ['Uncategorized'];
                tags.forEach(tag => {
                    if (!tagGroups[tag]) tagGroups[tag] = [];
                    // Calculate weight (e.g. degree of connections)
                    const degree = relationships.filter(r => r.source === el.id || r.target === el.id).length + 1;
                    tagGroups[tag].push({ name: el.name, value: degree, id: el.id });
                });
            });

            return {
                name: "Tags",
                children: Object.entries(tagGroups).map(([tag, items]) => ({
                    name: formatTag(tag),
                    children: items
                }))
            };
        } else {
            // View by Outgoing Relationships
            const relGroups: Record<string, any[]> = {};
            relationships.forEach(rel => {
                if (!relGroups[rel.label]) relGroups[rel.label] = [];
                // Find source element
                const source = elements.find(e => e.id === rel.source);
                if (source) {
                    relGroups[rel.label].push({ name: source.name, value: 1, id: source.id });
                }
            });
             return {
                name: "Relationships",
                children: Object.entries(relGroups).map(([label, items]) => ({
                    name: label,
                    children: items
                }))
            };
        }
    }, [elements, relationships, view]);

    return (
        <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 border-b flex justify-between items-center flex-shrink-0 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Treemap Explorer</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setView('tags')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${view === 'tags' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                    >
                        By Tags
                    </button>
                    <button 
                        onClick={() => setView('relationships')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${view === 'relationships' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                    >
                        By Relationships
                    </button>
                </div>
            </div>
            
            <div className="flex-grow p-4 overflow-hidden" ref={containerRef}>
                 <D3Treemap 
                    data={treemapData} 
                    width={dimensions.width} 
                    height={dimensions.height} 
                    onLeafClick={(d) => onNodeSelect(d.id)}
                    isDarkMode={isDarkMode}
                />
            </div>
        </div>
    );
};

export const TagDistributionPanel: React.FC<{ elements: Element[], isDarkMode: boolean }> = ({ elements, isDarkMode }) => {
    const tagStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => e.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [elements]);

    return (
        <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
             <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tag Frequency</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-2">
                    {tagStats.map(([tag, count]) => (
                        <div key={tag} className="flex items-center gap-2 text-xs">
                            <div className={`w-24 text-right truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatTag(tag)}</div>
                            <div className={`flex-grow rounded-full h-4 overflow-hidden relative ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                                <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${Math.max(5, (count / tagStats[0][1]) * 100)}%` }}
                                ></div>
                                <span className={`absolute right-2 top-0 text-[9px] leading-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{count}</span>
                            </div>
                        </div>
                    ))}
                    {tagStats.length === 0 && <p className="text-gray-500 italic text-center py-4">No tags found.</p>}
                </div>
            </div>
        </div>
    );
};

export const RelationshipDistributionPanel: React.FC<{ relationships: Relationship[], isDarkMode: boolean }> = ({ relationships, isDarkMode }) => {
    const relStats = useMemo(() => {
        const counts = new Map<string, number>();
        relationships.forEach(r => counts.set(r.label, (counts.get(r.label) || 0) + 1));
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [relationships]);

    return (
        <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
             <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Relationship Usage</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-2">
                    {relStats.map(([label, count]) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                            <div className={`w-24 text-right truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</div>
                            <div className={`flex-grow rounded-full h-4 overflow-hidden relative ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                                <div 
                                    className="h-full bg-green-500 rounded-full" 
                                    style={{ width: `${Math.max(5, (count / relStats[0][1]) * 100)}%` }}
                                ></div>
                                <span className={`absolute right-2 top-0 text-[9px] leading-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{count}</span>
                            </div>
                        </div>
                    ))}
                    {relStats.length === 0 && <p className="text-gray-500 italic text-center py-4">No relationships found.</p>}
                </div>
            </div>
        </div>
    );
};
