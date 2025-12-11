
import React, { useState } from 'react';
import { Element, Relationship } from '../types';
import { generateSelectionReport, generateUUID } from '../utils';

export const useClipboard = (
    elements: Element[],
    setElements: React.Dispatch<React.SetStateAction<Element[]>>,
    relationships: Relationship[],
    setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>,
    selectedElementId: string | null,
    setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>,
    multiSelection: Set<string>,
    setMultiSelection: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
    const [internalClipboard, setInternalClipboard] = useState<{ elements: Element[], relationships: Relationship[] } | null>(null);

    const handleCopy = async () => {
        const idsToCopy = multiSelection.size > 0 ? Array.from(multiSelection) : (selectedElementId ? [selectedElementId] : []);
        if (idsToCopy.length === 0) return;
        
        const selectedEls = elements.filter(e => idsToCopy.includes(e.id));
        // Only copy internal relationships
        const selectedRels = relationships.filter(r => idsToCopy.includes(r.source as string) && idsToCopy.includes(r.target as string));
        
        const textReport = generateSelectionReport(selectedEls, selectedRels);
        setInternalClipboard({ elements: selectedEls, relationships: selectedRels });
        
        try { 
            await navigator.clipboard.writeText(textReport); 
            alert(`Copied ${selectedEls.length} items to clipboard (Text Report). App-data ready for paste.`); 
        } catch (err) { 
            console.warn("Copy failed", err); 
            alert("Failed to copy text to system clipboard."); 
        }
    };
  
    const handlePaste = () => {
        if (!internalClipboard) { alert("Internal clipboard is empty."); return; }
        const { elements: pastedElements, relationships: pastedRelationships } = internalClipboard;
        if (pastedElements.length === 0) return;
        
        const idMap = new Map<string, string>();
        const now = new Date().toISOString();
        
        pastedElements.forEach((el: Element) => { idMap.set(el.id, generateUUID()); });
        
        const newElements = pastedElements.map((el: Element) => ({ 
            ...el, 
            id: idMap.get(el.id)!, 
            x: (el.x || 0) + 50, 
            y: (el.y || 0) + 50, 
            fx: (el.fx ? el.fx + 50 : null), 
            fy: (el.fy ? el.fy + 50 : null), 
            createdAt: now, 
            updatedAt: now 
        }));
        
        const newRelationships = pastedRelationships.map((rel: Relationship) => ({ 
            ...rel, 
            id: generateUUID(), 
            source: idMap.get(rel.source as string) || rel.source, 
            target: idMap.get(rel.target as string) || rel.target 
        }));
        
        setElements(prev => [...prev, ...newElements]);
        setRelationships(prev => [...prev, ...newRelationships]);
        
        const newSelection = new Set(newElements.map((e: Element) => e.id));
        setMultiSelection(newSelection);
        if (newElements.length > 0) setSelectedElementId(newElements[0].id);
    };

    return {
        internalClipboard,
        handleCopy,
        handlePaste
    };
};
