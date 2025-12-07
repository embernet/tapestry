
import React, { useState } from 'react';
import { TestLog } from '../components/SelfTestModal';
import { PanelLayout } from '../types';

interface UseSelfTestProps {
    panelState: any;
    tools: any;
    setPanelLayouts: React.Dispatch<React.SetStateAction<Record<string, PanelLayout>>>;
}

interface TestStep {
    id: string;
    description: string;
    selector?: string; // CSS selector or 'text:Some Text'
    action?: () => Promise<void> | void;
    wait?: number;
    timeout?: number; // Max time to wait for selector (ms)
}

export const useSelfTest = ({ panelState, tools, setPanelLayouts }: UseSelfTestProps) => {
    const [isSelfTestModalOpen, setIsSelfTestModalOpen] = useState(false);
    const [testLogs, setTestLogs] = useState<TestLog[]>([]);
    const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'complete'>('idle');

    const checkElement = async (selector: string, timeout: number = 3000): Promise<boolean> => {
        const startTime = Date.now();
        while (true) {
            try {
                let found = false;
                if (selector.startsWith('text:')) {
                    const textToFind = selector.substring(5);
                    // Use XPath to find text node containing string
                    const xpath = `//*[contains(text(),'${textToFind}')]`;
                    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    found = !!result.singleNodeValue;
                } else {
                    found = !!document.querySelector(selector);
                }
                
                if (found) return true;
            } catch (e) {
                console.error(`Error checking selector ${selector}:`, e);
                return false; // Syntax error or other issue, fail immediately
            }

            if (Date.now() - startTime > timeout) return false;
            await new Promise(r => setTimeout(r, 200));
        }
    };

    const runSelfTest = async () => {
        setIsSelfTestModalOpen(true);
        setTestStatus('running');
        setTestLogs([]);
        
        // 0. Reset state
        panelState.closeAllPanels();
        tools.setActiveTool(null);
        tools.setIsScamperModalOpen(false);
        tools.setIsTrizModalOpen(false);
        tools.setIsLssModalOpen(false);
        tools.setIsTocModalOpen(false);
        tools.setIsSsmModalOpen(false);
        tools.setIsSwotModalOpen(false);
        setPanelLayouts({}); 
        
        await new Promise(r => setTimeout(r, 800));

        // Define Tests
        const testSteps: TestStep[] = [
            // --- 1. Core Interface Panels ---
            // 1.1 Report Panel
            { id: '1.1.1', description: 'Button(Report).Click -> Open Panel', action: () => panelState.setIsReportPanelOpen(true), wait: 500 },
            { id: '1.1.2', description: 'Panel(Report).Check(Header)', selector: 'text:Report' },
            { id: '1.1.3', description: 'Panel(Report).Check(Index)', selector: 'text:Element Index' },
            { id: '1.1.4', description: 'Panel(Report).Check(Appendix)', selector: 'text:Appendix' },
            { id: '1.1.5', description: 'Panel(Report).Close', action: () => panelState.setIsReportPanelOpen(false), wait: 300 },

            // 1.2 Table Panel
            { id: '1.2.1', description: 'Button(Table).Click -> Open Panel', action: () => panelState.setIsTablePanelOpen(true), wait: 500 },
            { id: '1.2.2', description: 'Panel(Table).Check(Header)', selector: 'text:Table View' },
            { id: '1.2.3', description: 'Panel(Table).Check(Column:Name)', selector: 'text:Name' },
            { id: '1.2.4', description: 'Panel(Table).Check(Column:Tags)', selector: 'text:Tags' },
            { id: '1.2.5', description: 'Panel(Table).Close', action: () => panelState.setIsTablePanelOpen(false), wait: 300 },

            // 1.3 Matrix Panel
            { id: '1.3.1', description: 'Button(Matrix).Click -> Open Panel', action: () => panelState.setIsMatrixPanelOpen(true), wait: 500 },
            { id: '1.3.2', description: 'Panel(Matrix).Check(Header)', selector: 'text:Adjacency Matrix' },
            { id: '1.3.3', description: 'Panel(Matrix).Close', action: () => panelState.setIsMatrixPanelOpen(false), wait: 300 },

            // 1.4 Grid Panel
            { id: '1.4.1', description: 'Button(Grid).Click -> Open Panel', action: () => panelState.setIsGridPanelOpen(true), wait: 500 },
            { id: '1.4.2', description: 'Panel(Grid).Check(Header)', selector: 'text:Attribute Grid' },
            { id: '1.4.3', description: 'Panel(Grid).Check(Control:Physics)', selector: 'button[title*="Physics"]' },
            { id: '1.4.4', description: 'Panel(Grid).Close', action: () => panelState.setIsGridPanelOpen(false), wait: 300 },

            // 1.5 Kanban Panel
            { id: '1.5.1', description: 'Button(Kanban).Click -> Open Panel', action: () => panelState.setIsKanbanPanelOpen(true), wait: 500 },
            { id: '1.5.2', description: 'Panel(Kanban).Check(Header)', selector: 'text:Kanban Board' },
            { id: '1.5.3', description: 'Panel(Kanban).Check(Column:To Do)', selector: 'text:To Do' },
            { id: '1.5.4', description: 'Panel(Kanban).Close', action: () => panelState.setIsKanbanPanelOpen(false), wait: 300 },

            // --- 2. Toolbars & Tools ---
            
            // 2.1 AI Tools
            { id: '2.1.1', description: 'Toolbar(AI).Open', action: () => { tools.setIsToolsPanelOpen(true); tools.setActiveTool('ai'); }, wait: 500 },
            { id: '2.1.2', description: 'Toolbar(AI).Check(Assistant)', selector: 'text:Assistant' },
            { id: '2.1.3', description: 'Toolbar(AI).Check(Expand)', selector: 'text:Expand' },
            { id: '2.1.4', description: 'Toolbar(AI).Check(Connect)', selector: 'text:Connect' },
            { id: '2.1.5', description: 'Toolbar(AI).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // 2.2 Schema Tools
            { id: '2.2.1', description: 'Toolbar(Schema).Open', action: () => tools.setActiveTool('schema'), wait: 500 },
            { id: '2.2.2', description: 'Toolbar(Schema).Check(Active Schema)', selector: 'text:Active Schema' },
            { id: '2.2.3', description: 'Toolbar(Schema).Check(Default Relation)', selector: 'text:Default Relation' },
            { id: '2.2.4', description: 'Toolbar(Schema).Check(Tags Input)', selector: 'input[placeholder="Add default tag..."]' },
            { id: '2.2.5', description: 'Toolbar(Schema).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // 2.3 Layout Tools
            { id: '2.3.1', description: 'Toolbar(Layout).Open', action: () => tools.setActiveTool('layout'), wait: 500 },
            { id: '2.3.2', description: 'Toolbar(Layout).Check(Spread)', selector: 'text:Spread' },
            { id: '2.3.3', description: 'Toolbar(Layout).Check(Repel)', selector: 'text:Repel' },
            { id: '2.3.4', description: 'Toolbar(Layout).Check(Simulate)', selector: 'text:SIMULATE' },
            { id: '2.3.5', description: 'Toolbar(Layout).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // 2.4 Analysis Tools (Updated)
            { id: '2.4.1', description: 'Toolbar(Analysis).Open', action: () => tools.setActiveTool('analysis'), wait: 500 },
            { id: '2.4.2', description: 'Toolbar(Analysis).Check(Dropdown)', selector: 'text:Graph Analytics' },
            { id: '2.4.3', description: 'Toolbar(Analysis).Check(Network Button)', selector: 'text:Network Analysis' },
            { id: '2.4.4', description: 'Panel(Network).Open', action: () => panelState.setIsNetworkAnalysisOpen(true), wait: 500 },
            { id: '2.4.5', description: 'Panel(Network).Check(Header)', selector: 'text:Network Analysis' },
            { id: '2.4.6', description: 'Panel(Network).Close', action: () => { panelState.setIsNetworkAnalysisOpen(false); tools.setActiveTool(null); }, wait: 300 },

            // 2.5 Visualise Tools
            { id: '2.5.1', description: 'Toolbar(Visualise).Open', action: () => tools.setActiveTool('visualise'), wait: 500 },
            { id: '2.5.2', description: 'Toolbar(Visualise).Check(Grid)', selector: 'text:Attribute Grid' },
            { id: '2.5.3', description: 'Toolbar(Visualise).Check(Circle Packing)', selector: 'text:Circle Packing' },
            { id: '2.5.4', description: 'Toolbar(Visualise).Close', action: () => tools.setActiveTool(null), wait: 300 },
            
            // 2.6 Scripts (New)
            { id: '2.6.1', description: 'Toolbar(Scripts).Open', action: () => tools.setActiveTool('scripts'), wait: 500 },
            { id: '2.6.2', description: 'Toolbar(Scripts).Check(Header)', selector: 'text:Automation & Macros' },
            { id: '2.6.3', description: 'Panel(Script).Open', action: () => panelState.setIsScriptPanelOpen(true), wait: 500 },
            { id: '2.6.4', description: 'Panel(Script).Check(Header)', selector: 'text:TScript' },
            { id: '2.6.5', description: 'Panel(Script).Close', action: () => { panelState.setIsScriptPanelOpen(false); tools.setActiveTool(null); }, wait: 300 },

            // 2.7 Tag Cloud (New)
            { id: '2.7.1', description: 'Toolbar(TagCloud).Open', action: () => tools.setActiveTool('tagcloud'), wait: 500 },
            { id: '2.7.2', description: 'Toolbar(TagCloud).Check(Header)', selector: 'text:Word Cloud Tools' },
            { id: '2.7.3', description: 'Panel(TagCloud).Open', action: () => panelState.setIsConceptCloudOpen(true), wait: 500 },
            { id: '2.7.4', description: 'Panel(TagCloud).Check(Header)', selector: 'text:Tag Cloud' },
            { id: '2.7.5', description: 'Panel(TagCloud).Close', action: () => { panelState.setIsConceptCloudOpen(false); tools.setActiveTool(null); }, wait: 300 },

            // 2.8 Explorer (New)
            { id: '2.8.1', description: 'Toolbar(Explorer).Open', action: () => tools.setActiveTool('explorer'), wait: 500 },
            { id: '2.8.2', description: 'Toolbar(Explorer).Check(Sunburst)', selector: 'text:Sunburst Explorer' },
            { id: '2.8.3', description: 'Panel(Sunburst).Open', action: () => panelState.setIsSunburstPanelOpen(true), wait: 500 },
            { id: '2.8.4', description: 'Panel(Sunburst).Check(Header)', selector: 'text:Sunburst' },
            { id: '2.8.5', description: 'Panel(Sunburst).Close', action: () => { panelState.setIsSunburstPanelOpen(false); tools.setActiveTool(null); }, wait: 300 },

            // 2.9 Bulk Edit (New)
            { id: '2.9.1', description: 'Toolbar(Bulk).Open', action: () => tools.setActiveTool('bulk'), wait: 500 },
            { id: '2.9.2', description: 'Toolbar(Bulk).Check(Add Input)', selector: 'input[placeholder="Tags to add..."]' },
            { id: '2.9.3', description: 'Toolbar(Bulk).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // 2.10 Command Bar (New)
            { id: '2.10.1', description: 'Toolbar(Command).Open', action: () => tools.setActiveTool('command'), wait: 500 },
            { id: '2.10.2', description: 'Toolbar(Command).Check(Input)', selector: 'textarea[placeholder*="Element A"]' },
            { id: '2.10.3', description: 'Toolbar(Command).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // --- 3. Methodology Modals ---

            // 3.1 SCAMPER
            { id: '3.1.1', description: 'Modal(SCAMPER).Open', action: () => tools.setIsScamperModalOpen(true), wait: 600 },
            { id: '3.1.2', description: 'Modal(SCAMPER).Check(Header)', selector: 'text:SCAMPER' },
            { id: '3.1.3', description: 'Modal(SCAMPER).Check(Save)', selector: 'text:Save Report' }, 
            { id: '3.1.4', description: 'Modal(SCAMPER).Close', action: () => tools.setIsScamperModalOpen(false), wait: 300 },

            // 3.2 TRIZ
            { id: '3.2.1', description: 'Modal(TRIZ).Open(Contradiction)', action: () => { tools.setActiveTrizTool('contradiction'); tools.setIsTrizModalOpen(true); }, wait: 600 },
            { id: '3.2.2', description: 'Modal(TRIZ).Check(Header)', selector: 'text:TRIZ' },
            { id: '3.2.3', description: 'Modal(TRIZ).Check(SubHeader)', selector: 'text:Contradiction Matrix' },
            { id: '3.2.4', description: 'Modal(TRIZ).Check(Inputs)', selector: 'text:Improving Feature' },
            { id: '3.2.5', description: 'Modal(TRIZ).Close', action: () => tools.setIsTrizModalOpen(false), wait: 300 },

            // 3.3 Lean Six Sigma
            { id: '3.3.1', description: 'Modal(LSS).Open(Charter)', action: () => { tools.setActiveLssTool('charter'); tools.setIsLssModalOpen(true); }, wait: 600 },
            { id: '3.3.2', description: 'Modal(LSS).Check(Header)', selector: 'text:Lean Six Sigma' },
            { id: '3.3.3', description: 'Modal(LSS).Check(SubHeader)', selector: 'text:Project Charter' },
            { id: '3.3.4', description: 'Modal(LSS).Close', action: () => tools.setIsLssModalOpen(false), wait: 300 },

            // 3.4 TOC
            { id: '3.4.1', description: 'Modal(TOC).Open(CRT)', action: () => { tools.setActiveTocTool('crt'); tools.setIsTocModalOpen(true); }, wait: 600 },
            { id: '3.4.2', description: 'Modal(TOC).Check(Header)', selector: 'text:TOC' },
            { id: '3.4.3', description: 'Modal(TOC).Check(SubHeader)', selector: 'text:Current Reality Tree' },
            { id: '3.4.4', description: 'Modal(TOC).Close', action: () => tools.setIsTocModalOpen(false), wait: 300 },

            // 3.5 SSM
            { id: '3.5.1', description: 'Modal(SSM).Open(Rich Picture)', action: () => { tools.setActiveSsmTool('rich_picture'); tools.setIsSsmModalOpen(true); }, wait: 600 },
            { id: '3.5.2', description: 'Modal(SSM).Check(Header)', selector: 'text:SSM' },
            { id: '3.5.3', description: 'Modal(SSM).Check(SubHeader)', selector: 'text:Rich Picture' },
            { id: '3.5.4', description: 'Modal(SSM).Close', action: () => tools.setIsSsmModalOpen(false), wait: 300 },

            // 3.6 Strategy
            { id: '3.6.1', description: 'Modal(Strategy).Open(SWOT)', action: () => { tools.setActiveSwotTool('matrix'); tools.setIsSwotModalOpen(true); }, wait: 600 },
            { id: '3.6.2', description: 'Modal(Strategy).Check(Title)', selector: 'text:SWOT Matrix' },
            { id: '3.6.3', description: 'Modal(Strategy).Check(Grid)', selector: 'text:Strengths' },
            { id: '3.6.4', description: 'Modal(Strategy).Close', action: () => tools.setIsSwotModalOpen(false), wait: 300 },

            // --- 4. Additional Explorer Panels ---
             { id: '4.1.1', description: 'Panel(Treemap).Open', action: () => panelState.setIsTreemapPanelOpen(true), wait: 600 },
             { id: '4.1.2', description: 'Panel(Treemap).Check(Header)', selector: 'text:Treemap' },
             { id: '4.1.3', description: 'Panel(Treemap).Close', action: () => panelState.setIsTreemapPanelOpen(false), wait: 300 },
             
             { id: '4.2.1', description: 'Panel(CirclePacking).Open', action: () => panelState.setIsCirclePackingPanelOpen(true), wait: 600 },
             { id: '4.2.2', description: 'Panel(CirclePacking).Check(Header)', selector: 'text:Circle Packing' },
             { id: '4.2.3', description: 'Panel(CirclePacking).Close', action: () => panelState.setIsCirclePackingPanelOpen(false), wait: 300 },
        ];

        // Initialize log state with pending status
        setTestLogs(testSteps.map(step => ({
            id: step.id,
            name: step.description,
            status: 'pending'
        })));

        // Execute Tests
        for (const step of testSteps) {
            // Mark running
            setTestLogs(prev => prev.map(l => l.id === step.id ? { ...l, status: 'running' } : l));
            
            if (step.action) {
                try {
                    await step.action();
                } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Action failed';
                    setTestLogs(prev => prev.map(l => l.id === step.id ? { ...l, status: 'error', message: msg } : l));
                    continue; // Continue to next test even if action failed
                }
            }

            if (step.wait) {
                await new Promise(r => setTimeout(r, step.wait));
            }

            if (step.selector) {
                const exists = await checkElement(step.selector, step.timeout || 2000);
                if (exists) {
                    setTestLogs(prev => prev.map(l => l.id === step.id ? { ...l, status: 'ok' } : l));
                } else {
                    setTestLogs(prev => prev.map(l => l.id === step.id ? { ...l, status: 'error', message: `Element '${step.selector}' not found` } : l));
                }
            } else {
                // Action-only steps pass if no error thrown
                setTestLogs(prev => prev.map(l => l.id === step.id ? { ...l, status: 'ok' } : l));
            }
            
            // Short pause for visual feedback
            await new Promise(r => setTimeout(r, 50));
        }

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
