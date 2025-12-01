
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Element, Relationship } from '../types';
import * as d3 from 'd3';

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
        const titleColor = isDarkMode ? "#fff" : "#1f2937";

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
            .sum(d => d.value)
            .sort((a, b) => (b.value || 0) - (a.value || 0));

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
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        leaf.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => {
                // Use parent category for color consistency
                let parentName = d.parent?.data.name || "unknown";
                return colorScale(parentName);
            })
            .attr("opacity", 0.8)
            .style("cursor", "pointer")
            .on("mouseenter", function() { d3.select(this).attr("opacity", 1).attr("stroke", "#fff"); })
            .on("mouseleave", function() { d3.select(this).attr("opacity", 0.8).attr("stroke", "none"); })
            .on("click", (e, d) => onLeafClick(d.data));

        // Clip path for text
        leaf.append("clipPath")
            .attr("id", d => `clip-${d.data.id || Math.random()}`)
            .append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

        leaf.append("text")
            .attr("clip-path", d => `url(#clip-${d.data.id})`)
            .selectAll("tspan")
            .data(d => (d.data.name || "").split(/(?=[A-Z][a-z])|\s+/g))
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, nodes) => 13 + (i * 10))
            .text((d: any) => d)
            .attr("font-size", "10px")
            .attr("fill", "white")
            .style("pointer-events", "none");

        // Render Titles (Categories)
        svg.selectAll("titles")
            .data(root.descendants().filter(d => d.depth === 1))
            .enter()
            .append("text")
            .attr("x", d => d.x0 + 4)
            .attr("y", d => d.y0 + 14)
            .text(d => d.data.name)
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", titleColor)
            .attr("opacity", 0.7)
            .style("pointer-events", "none");

    }, [data, width, height, onLeafClick, isDarkMode]);

    const bgClass = isDarkMode ? "bg-gray-900" : "bg-white";
    return <svg ref={svgRef} width={width} height={height} className={`${bgClass} rounded transition-colors`} />;
};

// --- Treemap Panel ---
interface TreemapPanelProps {
    elements: Element[];
    relationships: Relationship[];
    onNodeSelect: (elementId: string) => void;
    isDarkMode: boolean;
}

export const TreemapPanel: React.FC<TreemapPanelProps> = ({ elements, relationships, onNodeSelect, isDarkMode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

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
        const tagGroups: Record<string, any[]> = {};
        elements.forEach(el => {
            const tags = el.tags.length > 0 ? el.tags : ['Uncategorized'];
            tags.forEach(tag => {
                if (!tagGroups[tag]) tagGroups[tag] = [];
                const degree = relationships.filter(r => r.source === el.id || r.target === el.id).length + 1;
                tagGroups[tag].push({ name: el.name, value: degree, id: el.id });
            });
        });

        return {
            name: "Tags",
            children: Object.entries(tagGroups).map(([tag, items]) => ({
                name: tag,
                children: items
            }))
        };
    }, [elements, relationships]);

    const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const headerBg = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200';
    const contentBg = isDarkMode ? 'bg-gray-900' : 'bg-white';
    const titleColor = isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';

    return (
        <div className={`w-full h-full flex flex-col ${bgClass}`}>
            <div className={`p-4 border-b ${borderClass} ${headerBg}`}>
                <h2 className={`text-xl font-bold ${titleColor}`}>Treemap</h2>
            </div>
            <div className={`flex-grow overflow-hidden p-2 ${contentBg}`} ref={containerRef}>
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

// --- Tag Distribution Panel ---
interface TagDistributionPanelProps {
    elements: Element[];
    isDarkMode: boolean;
}

export const TagDistributionPanel: React.FC<TagDistributionPanelProps> = ({ elements, isDarkMode }) => {
    const tagStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => e.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [elements]);

    const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const headerBg = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200';
    const titleColor = isDarkMode ? 'text-blue-400' : 'text-blue-600';
    const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const barBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-100';
    const countColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';

    return (
        <div className={`w-full h-full flex flex-col ${bgClass}`}>
            <div className={`p-4 border-b ${headerBg}`}>
                <h2 className={`text-xl font-bold ${titleColor}`}>Tag Frequency</h2>
            </div>
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                    {tagStats.map(([tag, count]) => (
                        <div key={tag} className="flex items-center gap-2 text-sm">
                            <div className={`w-32 text-right truncate font-medium ${textColor}`}>{tag}</div>
                            <div className={`flex-grow ${barBg} rounded-full h-6 overflow-hidden relative`}>
                                <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.max(1, (count / (tagStats[0]?.[1] || 1)) * 100)}%` }}
                                ></div>
                                <span className={`absolute right-3 top-1 text-xs font-bold ${countColor}`}>{count}</span>
                            </div>
                        </div>
                    ))}
                    {tagStats.length === 0 && <p className="text-gray-500 italic text-center mt-4">No tags found.</p>}
                </div>
            </div>
        </div>
    );
};

// --- Relationship Distribution Panel ---
interface RelationshipDistributionPanelProps {
    relationships: Relationship[];
    isDarkMode: boolean;
}

export const RelationshipDistributionPanel: React.FC<RelationshipDistributionPanelProps> = ({ relationships, isDarkMode }) => {
    const relStats = useMemo(() => {
        const counts = new Map<string, number>();
        relationships.forEach(r => counts.set(r.label, (counts.get(r.label) || 0) + 1));
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [relationships]);

    const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const headerBg = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200';
    const titleColor = isDarkMode ? 'text-green-400' : 'text-green-600';
    const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const barBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-100';
    const countColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';

    return (
        <div className={`w-full h-full flex flex-col ${bgClass}`}>
            <div className={`p-4 border-b ${headerBg}`}>
                <h2 className={`text-xl font-bold ${titleColor}`}>Relationship Usage</h2>
            </div>
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                    {relStats.map(([label, count]) => (
                        <div key={label} className="flex items-center gap-2 text-sm">
                            <div className={`w-32 text-right truncate font-medium ${textColor}`}>{label}</div>
                            <div className={`flex-grow ${barBg} rounded-full h-6 overflow-hidden relative`}>
                                <div 
                                    className="h-full bg-green-600 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.max(1, (count / (relStats[0]?.[1] || 1)) * 100)}%` }}
                                ></div>
                                <span className={`absolute right-3 top-1 text-xs font-bold ${countColor}`}>{count}</span>
                            </div>
                        </div>
                    ))}
                    {relStats.length === 0 && <p className="text-gray-500 italic text-center mt-4">No relationships found.</p>}
                </div>
            </div>
        </div>
    );
};
