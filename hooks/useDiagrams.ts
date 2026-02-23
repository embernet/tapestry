
import { useState, useCallback } from 'react';
import { MermaidDiagram, Element, Relationship } from '../types';
import { generateMarkdownFromGraph, callAI, AIConfig } from '../utils';
import { promptStore } from '../services/PromptStore';

interface UseDiagramsProps {
    elements: Element[];
    relationships: Relationship[];
    aiConfig: AIConfig;
}

export const useDiagrams = ({ elements, relationships, aiConfig }: UseDiagramsProps) => {
    const [mermaidDiagrams, setMermaidDiagrams] = useState<MermaidDiagram[]>([]);
    const [isMermaidGenerating, setIsMermaidGenerating] = useState(false);

    const handleSaveMermaidDiagram = useCallback((diagram: MermaidDiagram) => {
        setMermaidDiagrams(prev => {
            const existingIndex = prev.findIndex(d => d.id === diagram.id);
            if (existingIndex >= 0) {
                const newDiagrams = [...prev];
                newDiagrams[existingIndex] = diagram;
                return newDiagrams;
            } else {
                return [...prev, diagram];
            }
        });
    }, []);

    const handleDeleteMermaidDiagram = useCallback((id: string) => {
        if (confirm("Delete this diagram?")) {
            setMermaidDiagrams(prev => prev.filter(d => d.id !== id));
        }
    }, []);

    const handleGenerateMermaid = useCallback(async (prompt: string, contextMarkdown?: string) => {
        setIsMermaidGenerating(true);
        try {
            const graphMarkdown = contextMarkdown || generateMarkdownFromGraph(elements, relationships);
            const fullPrompt = promptStore.get('mermaid:generate', { prompt, context: graphMarkdown });
            const response = await callAI(aiConfig, fullPrompt);
            return response.text || "";
        } catch (e) {
            console.error("Mermaid Gen Error", e);
            alert("Failed to generate diagram.");
            return "";
        } finally {
            setIsMermaidGenerating(false);
        }
    }, [elements, relationships, aiConfig]);

    return {
        mermaidDiagrams,
        setMermaidDiagrams,
        isMermaidGenerating,
        handleSaveMermaidDiagram,
        handleDeleteMermaidDiagram,
        handleGenerateMermaid
    };
};
