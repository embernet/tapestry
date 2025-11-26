
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Element, Relationship } from '../types';
import * as d3 from 'd3';

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
            .attr("fill", "#fff")
            .attr("opacity", 0.7)
            .style("pointer-events", "none");

    }, [data, width, height, onLeafClick]);

    return <svg ref={svgRef} width={width} height={height} className="bg-gray-900 rounded" />;
};

const OverviewTab: React.FC<{ elements: Element[], relationships: Relationship[] }> = ({ elements, relationships }) => {
    const tagStats = useMemo(() => {
        const counts = new Map<string, number>();
        