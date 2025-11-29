
import React, { useState } from 'react';
import { TestLog } from '../components/SelfTestModal';
import { PanelLayout } from '../types';

interface UseSelfTestProps {
    panelState: any;
    tools: any;
    setPanelLayouts: React.Dispatch<React.SetStateAction<Record<string, PanelLayout>>>;
}

export const useSelfTest = ({ panelState, tools, setPanelLayouts }: UseSelfTestProps) => {
    const [isSelfTestModalOpen, setIsSelfTestModalOpen] = useState(false);
    const [testLogs, setTestLogs] = useState<TestLog[]>([]);
    const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'complete'>('idle');

    const runSelfTest = async () => {
        setIsSelfTestModalOpen(true);
        setTestStatus('running');
        setTestLogs([]);
        
        // Reset state: Close everything first
        panelState.closeAllPanels();
        tools.setActiveTool(null);
        tools.setIsScamperModalOpen(false);
        tools.setIsTrizModalOpen(false);
        tools.setIsLssModalOpen(false);
        tools.setIsTocModalOpen(false);
        tools.setIsSsmModalOpen(false);
        tools.setIsSwotModalOpen(false);
        setPanelLayouts({}); 
        
        await new Promise(r => setTimeout(r, 500)); // Wait for clear

        const log = (name: string, status: 'running' | 'ok' | 'error' | 'pending', message?: string) => {
            setTestLogs(prev => {
                const existingIndex = prev.findIndex(l => l.name === name);
                if (existingIndex >= 0) {
                    const newLogs = [...prev];
                    newLogs[existingIndex] = { ...newLogs[existingIndex], status, message };
                    return newLogs;
                }
                return [...prev, { id: prev.length + 1, name, status, message }];
            });
        };

        const checkElement = (selector: string) => {
            const el = document.querySelector(selector);
            if (el) return true;
            if (selector.startsWith('text:')) {
                return document.body.textContent?.includes(selector.substring(5));
            }
            return false;
        };

        const testPanel = async (name: string, openFn: () => void, closeFn: () => void, checkId: string) => {
            log(name, 'running');
            openFn();
            await new Promise(r => setTimeout(r, 200)); 
            const success = checkElement(`[data-testid="${checkId}"]`);
            log(name, success ? 'ok' : 'error');
            closeFn();
            await new Promise(r => setTimeout(r, 50));
        };

        // Phase 1: Panels (Dockable)
        const panels = [
            { name: 'Report Panel', open: () => panelState.setIsReportPanelOpen(true), close: () => panelState.setIsReportPanelOpen(false), id: 'panel-report' },
            { name: 'Table View', open: () => panelState.setIsTablePanelOpen(true), close: () => panelState.setIsTablePanelOpen(false), id: 'panel-table' },
            { name: 'Matrix View', open: () => panelState.setIsMatrixPanelOpen(true), close: () => panelState.setIsMatrixPanelOpen(false), id: 'panel-matrix' },
            { name: 'Grid View', open: () => panelState.setIsGridPanelOpen(true), close: () => panelState.setIsGridPanelOpen(false), id: 'panel-grid' },
            { name: 'Documents', open: () => panelState.setIsDocumentPanelOpen(true), close: () => panelState.setIsDocumentPanelOpen(false), id: 'panel-documents' },
            { name: 'Kanban', open: () => panelState.setIsKanbanPanelOpen(true), close: () => panelState.setIsKanbanPanelOpen(false), id: 'panel-kanban' },
            { name: 'Story Mode', open: () => panelState.setIsPresentationPanelOpen(true), close: () => panelState.setIsPresentationPanelOpen(false), id: 'panel-presentation' },
            { name: 'History', open: () => panelState.setIsHistoryPanelOpen(true), close: () => panelState.setIsHistoryPanelOpen(false), id: 'panel-history' },
            { name: 'Markdown', open: () => panelState.setIsMarkdownPanelOpen(true), close: () => panelState.setIsMarkdownPanelOpen(false), id: 'panel-markdown' },
            { name: 'JSON', open: () => panelState.setIsJSONPanelOpen(true), close: () => panelState.setIsJSONPanelOpen(false), id: 'panel-json' },
            { name: 'Mermaid Diagrams', open: () => panelState.setIsMermaidPanelOpen(true), close: () => panelState.setIsMermaidPanelOpen(false), id: 'panel-mermaid' },
            { name: 'Treemap', open: () => panelState.setIsTreemapPanelOpen(true), close: () => panelState.setIsTreemapPanelOpen(false), id: 'panel-treemap' },
            { name: 'Sunburst', open: () => panelState.setIsSunburstPanelOpen(true), close: () => panelState.setIsSunburstPanelOpen(false), id: 'panel-sunburst' },
            { name: 'Tag Cloud', open: () => panelState.setIsConceptCloudOpen(true), close: () => panelState.setIsConceptCloudOpen(false), id: 'panel-concept-cloud' },
        ];

        for (const p of panels) {
            await testPanel(p.name, p.open, p.close, p.id);
        }

        // Phase 2: Tools & Modals
        const testTool = async (toolId: string, toolName: string, checkText: string, openModal?: () => void, closeModal?: () => void) => {
            log(`${toolName} Toolbar`, 'running');
            tools.setIsToolsPanelOpen(true);
            tools.setActiveTool(toolId);
            await new Promise(r => setTimeout(r, 400));
            const toolbarOk = document.body.innerText.includes(toolName.toUpperCase()); 
            log(`${toolName} Toolbar`, toolbarOk ? 'ok' : 'error');

            if (openModal && closeModal) {
                log(`${toolName} Modal`, 'running');
                openModal();
                await new Promise(r => setTimeout(r, 400));
                const modalOk = document.body.innerText.includes(checkText);
                log(`${toolName} Modal`, modalOk ? 'ok' : 'error', modalOk ? undefined : `Expected text '${checkText}' not found`);
                closeModal();
                await new Promise(r => setTimeout(r, 50));
            }
            tools.setActiveTool(null);
            await new Promise(r => setTimeout(r, 50));
        };

        await testTool('scamper', 'SCAMPER', 'Generating ideas for', () => tools.setIsScamperModalOpen(true), () => tools.setIsScamperModalOpen(false));
        await testTool('triz', 'TRIZ', 'Contradiction Matrix', () => { tools.setActiveTrizTool('contradiction'); tools.setIsTrizModalOpen(true); }, () => tools.setIsTrizModalOpen(false));
        await testTool('lss', 'LSS', 'Project Charter', () => { tools.setActiveLssTool('charter'); tools.setIsLssModalOpen(true); }, () => tools.setIsLssModalOpen(false));
        await testTool('toc', 'TOC', 'Current Reality Tree', () => { tools.setActiveTocTool('crt'); tools.setIsTocModalOpen(true); }, () => tools.setIsTocModalOpen(false));
        await testTool('ssm', 'SSM', 'Rich Picture', () => { tools.setActiveSsmTool('rich_picture'); tools.setIsSsmModalOpen(true); }, () => tools.setIsSsmModalOpen(false));
        await testTool('swot', 'Strategy', 'SWOT Matrix', () => { tools.setActiveSwotTool('matrix'); tools.setIsSwotModalOpen(true); }, () => tools.setIsSwotModalOpen(false));
        
        await testTool('schema', 'Schema', 'Active Schema');
        await testTool('layout', 'Layout', 'Spread');
        await testTool('analysis', 'Analysis', 'Simulation');
        await testTool('bulk', 'Bulk', 'Add Tags');
        await testTool('command', 'CMD', 'Quick Add');

        setTestStatus('complete');
    };

    return {
        runSelfTest,
        isSelfTestModalOpen,
        setIsSelfTestModalOpen,
        testLogs,
        testStatus
    };
};