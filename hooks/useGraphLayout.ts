
import React, { useState, useCallback } from 'react';
import * as d3Import from 'd3';
import { Element, Relationship } from '../types';

const d3: any = d3Import;

interface UseGraphLayoutProps {
    elementsRef: React.MutableRefObject<Element[]>;
    relationshipsRef: React.MutableRefObject<Relationship[]>;
    setElements: React.Dispatch<React.SetStateAction<Element[]>>;
    graphCanvasRef: React.RefObject<any>;
}

export const useGraphLayout = ({ elementsRef, relationshipsRef, setElements, graphCanvasRef }: UseGraphLayoutProps) => {
    const [layoutParams, setLayoutParams] = useState({ linkDistance: 250, repulsion: -500 });
    const [isPhysicsModeActive, setIsPhysicsModeActive] = useState(false);
    const [originalElements, setOriginalElements] = useState<Element[] | null>(null);
    const [jiggleTrigger, setJiggleTrigger] = useState(0);

    const handleStaticLayout = useCallback(() => {
        const currentElements = elementsRef.current;
        const currentRelationships = relationshipsRef.current;

        if (currentElements.length === 0) return;
        
        // Clear fixed positions (fx, fy) so the simulation can move nodes
        const nodes = currentElements.map(e => ({ 
            ...e,
            fx: null,
            fy: null
        }));
        
        // Clone links to avoid mutating state directly in D3
        const links = currentRelationships.map(r => ({ ...r }));

        const simulation = d3.forceSimulation(nodes as any)
            .force("charge", d3.forceManyBody().strength(layoutParams.repulsion))
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(layoutParams.linkDistance))
            .force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
            .force("collide", d3.forceCollide().radius((d: any) => {
                const w = d.width || Math.max(160, d.name.length * 8);
                return (w / 2) + 30; 
            }).iterations(3))
            .stop();

        // Run simulation synchronously for 300 ticks
        simulation.tick(300);

        setElements(prev => {
            const newEls = prev.map(el => {
                const node = nodes.find(n => n.id === el.id);
                if (node) {
                    return { 
                        ...el, 
                        x: node.x, 
                        y: node.y,
                        // Pin them at the new calculated position
                        fx: node.x,
                        fy: node.y,
                        updatedAt: new Date().toISOString()
                    };
                }
                return el;
            });
            return newEls;
        });
        
    }, [layoutParams, elementsRef, relationshipsRef, setElements]);

    const handleStartPhysicsLayout = useCallback(() => {
        const elements = elementsRef.current;
        setOriginalElements(elements);
        setElements(prev => prev.map(f => ({ ...f, fx: null, fy: null })));
        setIsPhysicsModeActive(true);
    }, [setElements, elementsRef]);

    const handleAcceptLayout = useCallback(() => {
        const finalPositions = graphCanvasRef.current?.getFinalNodePositions();
        if (finalPositions) {
            const positionsMap = new Map(finalPositions.map((p: any) => [p.id, p]));
            setElements(prev => prev.map(element => {
                const pos = positionsMap.get(element.id);
                const posEntry = pos as { x: number; y: number } | undefined;
                return posEntry ? { ...element, x: posEntry.x, y: posEntry.y, fx: posEntry.x, fy: posEntry.y } : element;
            }));
        }
        setIsPhysicsModeActive(false);
        setOriginalElements(null);
    }, [setElements, graphCanvasRef]);

    const handleRejectLayout = useCallback(() => {
        if (originalElements) {
            setElements(originalElements);
        }
        setIsPhysicsModeActive(false);
        setOriginalElements(null);
    }, [originalElements, setElements]);

    const handleScaleLayout = useCallback((factor: number) => {
        if (isPhysicsModeActive) return;
        setElements(prev => {
            if (prev.length === 0) return prev;
            const xs = prev.map(e => e.x || 0);
            const ys = prev.map(e => e.y || 0);
            const avgX = xs.reduce((a,b) => a+b, 0) / prev.length;
            const avgY = ys.reduce((a,b) => a+b, 0) / prev.length;
            
            return prev.map(e => {
                const x = e.x || 0;
                const y = e.y || 0;
                const dx = x - avgX;
                const dy = y - avgY;
                const newX = avgX + dx * factor;
                const newY = avgY + dy * factor;
                return { ...e, x: newX, y: newY, fx: newX, fy: newY, updatedAt: new Date().toISOString() };
            });
        });
    }, [isPhysicsModeActive, setElements]);

    return {
        layoutParams,
        setLayoutParams,
        isPhysicsModeActive,
        setIsPhysicsModeActive,
        originalElements,
        setOriginalElements,
        jiggleTrigger,
        setJiggleTrigger,
        handleStaticLayout,
        handleStartPhysicsLayout,
        handleAcceptLayout,
        handleRejectLayout,
        handleScaleLayout
    };
};
