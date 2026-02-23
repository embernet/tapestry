
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Element, Relationship } from '../types';
import * as d3Import from 'd3';

const d3: any = d3Import;

interface MiningModalProps {
  isOpen: boolean;
  elements: Element[];
  relationships: Relationship[];
  onClose: () => void;
  onNodeSelect: (elementId: string) => void;
  onLogHistory: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
  onOpenHistory: () => void;
  onAnalyze: (context: string) => void;
}

// --- D3 Treemap Component ---
const D3Treemap: React.FC<{ 
    data: any, 
    width: number, 
    height: number, 
    onLeafClick: (node: any) => void 
}> = ({ data, width, height, onLeafClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

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

    }, [data, width, height, onLeafClick]);

    return <svg ref={svgRef} width={width} height={height} className="bg-gray-900 rounded" />;
};

const OverviewTab: React.FC<{ elements: Element[], relationships: Relationship[] }> = ({ elements, relationships }) => {
    const tagStats = useMemo(() => {
        const counts = new Map<string, number>();
        elements.forEach(e => e.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [elements]);

    const relStats = useMemo(() => {
        const counts = new Map<string, number>();
        relationships.forEach(r => counts.set(r.label, (counts.get(r.label) || 0) + 1));
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [relationships]);

    return (
        <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto p-1">
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <h3 className="text-lg font-bold text-blue-400 mb-4">Tag Distribution</h3>
                <div className="space-y-2">
                    {tagStats.map(([tag, count]) => (
                        <div key={tag} className="flex items-center gap-2 text-xs">
                            <div className="w-24 text-right truncate text-gray-300">{tag}</div>
                            <div className="flex-grow bg-gray-900 rounded-full h-4 overflow-hidden relative">
                                <div 
                                    className="h-full bg-blue-600 rounded-full" 
                                    style={{ width: `${Math.max(5, (count / tagStats[0][1]) * 100)}%` }}
                                ></div>
                                <span className="absolute right-2 top-0 text-[9px] text-gray-400 leading-4">{count}</span>
                            </div>
                        </div>
                    ))}
                    {tagStats.length === 0 && <p className="text-gray-500 italic">No tags found.</p>}
                </div>
            </div>
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <h3 className="text-lg font-bold text-green-400 mb-4">Relationship Types</h3>
                <div className="space-y-2">
                    {relStats.map(([label, count]) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                            <div className="w-24 text-right truncate text-gray-300">{label}</div>
                            <div className="flex-grow bg-gray-900 rounded-full h-4 overflow-hidden relative">
                                <div 
                                    className="h-full bg-green-600 rounded-full" 
                                    style={{ width: `${Math.max(5, (count / relStats[0][1]) * 100)}%` }}
                                ></div>
                                <span className="absolute right-2 top-0 text-[9px] text-gray-400 leading-4">{count}</span>
                            </div>
                        </div>
                    ))}
                    {relStats.length === 0 && <p className="text-gray-500 italic">No relationships found.</p>}
                </div>
            </div>
        </div>
    );
};

const TreemapTab: React.FC<{ elements: Element[], relationships: Relationship[], onNodeSelect: (id: string) => void }> = ({ elements, relationships, onNodeSelect }) => {
    const [view, setView] = useState<'tags' | 'relationships'>('tags');
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

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
                    name: tag,
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
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-center gap-2">
                <button 
                    onClick={() => setView('tags')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${view === 'tags' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                >
                    Group by Tags
                </button>
                <button 
                    onClick={() => setView('relationships')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${view === 'relationships' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                >
                    Group by Relations
                </button>
            </div>
            <div className="flex-grow bg-gray-900 rounded border border-gray-700 overflow-hidden p-2" ref={containerRef}>
                <D3Treemap 
                    data={treemapData} 
                    width={dimensions.width} 
                    height={dimensions.height} 
                    onLeafClick={(d) => onNodeSelect(d.id)}
                />
            </div>
        </div>
    );
};

const MiningModal: React.FC<MiningModalProps> = ({ isOpen, elements, relationships, onClose, onNodeSelect, onLogHistory, onOpenHistory, onAnalyze }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'treemap'>('overview');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg w-full max-w-5xl h-[80vh] shadow-2xl border border-yellow-500 text-white flex flex-col">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800 rounded-t-lg">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-yellow-400">
                        Data Mining / <span className="text-white">Dashboard</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={onOpenHistory} className="text-gray-400 hover:text-white mr-2" title="View History">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-gray-800/50">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('treemap')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'treemap' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        Treemap Explorer
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow p-6 overflow-hidden bg-gray-900">
                    {activeTab === 'overview' && <OverviewTab elements={elements} relationships={relationships} />}
                    {activeTab === 'treemap' && <TreemapTab elements={elements} relationships={relationships} onNodeSelect={onNodeSelect} />}
                </div>
            </div>
        </div>
    );
};

export default MiningModal;
