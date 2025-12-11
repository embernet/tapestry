
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TestLog } from '../components/SelfTestModal';
import { PanelLayout, ModelActions, Element } from '../types';
import { generateUUID } from '../utils';

interface UseSelfTestProps {
    panelState: any;
    tools: any;
    setPanelLayouts: React.Dispatch<React.SetStateAction<Record<string, PanelLayout>>>;
    persistence: any;
    modelActions: ModelActions;
    setAnalysisHighlights: React.Dispatch<React.SetStateAction<Map<string, string>>>;
    setFocusMode: React.Dispatch<React.SetStateAction<'narrow' | 'wide' | 'zoom'>>;
    setIsPhysicsModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveSchemeId: React.Dispatch<React.SetStateAction<string | null>>;
    setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>;
    setMultiSelection: React.Dispatch<React.SetStateAction<Set<string>>>;
    onAutoLayout: () => void;
    elements: Element[];
    graphCanvasRef: React.RefObject<any>;
    
    // New Props for full coverage
    setIsCsvModalOpen: (open: boolean) => void;
    setIsAboutModalOpen: (open: boolean) => void;
    setIsPatternGalleryModalOpen: (open: boolean) => void;
    setIsUserGuideModalOpen: (open: boolean) => void;
    setIsRandomWalkOpen: (open: boolean) => void;
}

interface TestStep {
    id: string;
    description: string;
    selector?: string; // CSS selector or 'text:Some Text'
    prerequisite?: string; // CSS selector that MUST exist before running action
    action?: () => Promise<void> | void;
    wait?: number;
    timeout?: number; // Max time to wait for selector (ms)
}

export const useSelfTest = ({ 
    panelState, 
    tools, 
    setPanelLayouts, 
    persistence, 
    modelActions,
    setAnalysisHighlights,
    setFocusMode,
    setIsPhysicsModeActive,
    setActiveSchemeId,
    setSelectedElementId,
    setMultiSelection,
    onAutoLayout,
    elements,
    graphCanvasRef,
    setIsCsvModalOpen,
    setIsAboutModalOpen,
    setIsPatternGalleryModalOpen,
    setIsUserGuideModalOpen,
    setIsRandomWalkOpen
}: UseSelfTestProps) => {
    const [isSelfTestModalOpen, setIsSelfTestModalOpen] = useState(false);
    const [testLogs, setTestLogs] = useState<TestLog[]>([]);
    const [testStatus, setTestStatus] = useState<'idle' | 'preparing' | 'ready' | 'running' | 'paused' | 'complete' | 'stopped'>('idle');
    const [executionIndex, setExecutionIndex] = useState(0);
    const stopRef = useRef(false);

    // Refs for logging to document
    const testDocTitleRef = useRef<string | null>(null);
    const lastLogContextRef = useRef<{ component: string, feature: string }>({ component: '', feature: '' });

    // We store the executable closures in a ref so they persist and are accessible by index
    const executableStepsRef = useRef<TestStep[]>([]);

    const checkElement = async (selector: string, timeout: number = 3000): Promise<boolean> => {
        const startTime = Date.now();
        while (true) {
            try {
                let found = false;
                if (selector.startsWith('text:')) {
                    const textToFind = selector.substring(5);
                    const xpath = `//*[contains(text(),'${textToFind}')]`;
                    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    found = !!result.singleNodeValue;
                } else {
                    found = !!document.querySelector(selector);
                }
                
                if (found) return true;
            } catch (e) {
                console.error(`Error checking selector ${selector}:`, e);
                return false;
            }

            if (Date.now() - startTime > timeout) return false;
            await new Promise(r => setTimeout(r, 200));
        }
    };

    const getFeatureInfo = (id: string) => {
        // 0.x - Visuals & Data
        if (id.startsWith('0.1')) return { feature: 'Circle Packing', component: 'Explorer', x: 300, y: 300 };
        if (id.startsWith('0.2')) return { feature: 'CSV Import', component: 'Data Tools', x: 300, y: 400 };

        // 1.x - Interface Panels
        if (id.startsWith('1.1')) return { feature: 'Report Panel', component: 'Interface', x: -400, y: -300 };
        if (id.startsWith('1.2')) return { feature: 'Table Panel', component: 'Interface', x: -300, y: -300 };
        if (id.startsWith('1.3')) return { feature: 'Matrix Panel', component: 'Interface', x: -200, y: -300 };
        if (id.startsWith('1.4')) return { feature: 'Grid Panel', component: 'Interface', x: -100, y: -300 };
        if (id.startsWith('1.5')) return { feature: 'Kanban Panel', component: 'Interface', x: 0, y: -300 };
        
        // 1.6 - Views
        if (id.startsWith('1.6.1')) return { feature: 'New View', component: 'Views', x: 200, y: -300 };
        if (id.startsWith('1.6.2')) return { feature: 'Clone View', component: 'Views', x: 200, y: -300 };
        if (id.startsWith('1.6.3')) return { feature: 'Room Decor', component: 'Views', x: 200, y: -300 };
        if (id.startsWith('1.6.4')) return { feature: 'Edit View', component: 'Views', x: 200, y: -300 };
        if (id.startsWith('1.6.5')) return { feature: 'Delete View', component: 'Views', x: 200, y: -300 };
        
        // 2.x - Tools
        if (id.startsWith('2.1')) return { feature: 'Assistant', component: 'AI Tools', x: 400, y: -200 };
        if (id.startsWith('2.2')) return { feature: 'Schema Editor', component: 'Schema', x: 400, y: -100 };
        if (id.startsWith('2.3')) return { feature: 'Physics & Shape', component: 'Layout', x: 400, y: 0 };
        
        // 2.4 Analysis Sub-features
        if (id.startsWith('2.4.1') || id.startsWith('2.4.2') || id.startsWith('2.4.3')) return { feature: 'Menu', component: 'Analysis', x: 400, y: 100 };
        if (id.startsWith('2.4.4') || id.startsWith('2.4.5') || id.startsWith('2.4.6')) return { feature: 'Network', component: 'Analysis', x: 400, y: 120 };
        if (id.startsWith('2.4.7') || id.startsWith('2.4.8') || id.startsWith('2.4.9')) return { feature: 'Tag Dist', component: 'Analysis', x: 400, y: 140 };
        if (id.startsWith('2.4.10')) return { feature: 'Rel Dist', component: 'Analysis', x: 400, y: 160 };
        
        if (id.startsWith('2.5')) return { feature: 'Visualise Menu', component: 'Visualise', x: 400, y: 200 };
        if (id.startsWith('2.6')) return { feature: 'Script Editor', component: 'Automation', x: 500, y: -200 };
        
        // 2.7 Tag Cloud Sub-features
        if (id.startsWith('2.7.1') || id.startsWith('2.7.2')) return { feature: 'Menu', component: 'Word Cloud', x: 500, y: -100 };
        if (id.startsWith('2.7.3')) return { feature: 'Tag Cloud', component: 'Word Cloud', x: 500, y: -80 };
        if (id.startsWith('2.7.6')) return { feature: 'Rel Cloud', component: 'Word Cloud', x: 500, y: -60 };
        if (id.startsWith('2.7.9')) return { feature: 'Name Cloud', component: 'Word Cloud', x: 500, y: -40 };
        if (id.startsWith('2.7.12')) return { feature: 'Full Text', component: 'Word Cloud', x: 500, y: -20 };

        // 2.8 Explorer Sub-features
        if (id.startsWith('2.8.1')) return { feature: 'Menu', component: 'Explorer', x: 500, y: 0 };
        if (id.startsWith('2.8.3')) return { feature: 'Sunburst', component: 'Explorer', x: 500, y: 20 };
        if (id.startsWith('2.8.6')) return { feature: 'Random Walk', component: 'Explorer', x: 500, y: 40 };

        if (id.startsWith('2.9')) return { feature: 'Bulk Edit', component: 'Tools', x: 500, y: 100 };
        if (id.startsWith('2.10')) return { feature: 'Command Bar', component: 'Tools', x: 500, y: 200 };

        // 3.x - Methods
        if (id.startsWith('3.1')) return { feature: 'SCAMPER', component: 'Methods', x: -400, y: 200 };
        if (id.startsWith('3.2')) return { feature: 'TRIZ', component: 'Methods', x: -300, y: 200 };
        if (id.startsWith('3.3')) return { feature: 'LSS', component: 'Methods', x: -200, y: 200 };
        if (id.startsWith('3.4')) return { feature: 'TOC', component: 'Methods', x: -100, y: 200 };
        if (id.startsWith('3.5')) return { feature: 'SSM', component: 'Methods', x: 0, y: 200 };
        if (id.startsWith('3.6')) return { feature: 'Strategy', component: 'Methods', x: 100, y: 200 };

        // 4.x - Additional
        if (id.startsWith('4.1')) return { feature: 'Treemap', component: 'Explorer', x: 300, y: 350 };

        // 5.x - System/Help
        if (id.startsWith('5.')) return { feature: 'Help', component: 'System', x: 0, y: 400 };

        return { feature: 'General', component: 'System', x: 0, y: 0 };
    };

    const runSelfTest = async () => {
        setIsSelfTestModalOpen(true);
        setTestStatus('preparing');
        setTestLogs([]);
        setExecutionIndex(0);
        stopRef.current = false;
        
        // 0. RESET STATE & CREATE NEW MODEL MANUALLY
        panelState.closeAllPanels();
        tools.setActiveTool(null);
        tools.setIsScamperModalOpen(false);
        tools.setIsTrizModalOpen(false);
        tools.setIsLssModalOpen(false);
        tools.setIsTocModalOpen(false);
        tools.setIsSsmModalOpen(false);
        tools.setIsSwotModalOpen(false);
        setIsCsvModalOpen(false);
        setIsAboutModalOpen(false);
        setIsPatternGalleryModalOpen(false);
        setIsUserGuideModalOpen(false);
        setIsRandomWalkOpen(false);
        
        setPanelLayouts({});
        setAnalysisHighlights(new Map());

        // Generate Timestamped Name: Self_Test_YYMMDD_HHMMSS
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const modelName = `Self_Test_${yy}${mm}${dd}_${hh}${min}${ss}`;

        // Initialize logging refs
        testDocTitleRef.current = modelName;
        lastLogContextRef.current = { component: '', feature: '' };

        // Create New Model via Persistence Layer
        persistence.handleCreateModel(modelName, "Automated Self-Test Model");

        await new Promise(r => setTimeout(r, 800)); // Wait for reset to settle

        // Set visual modes for the test
        setFocusMode('zoom');
        // Disable physics for stability, we will use static layout
        setIsPhysicsModeActive(false);
        setActiveSchemeId('scheme-testing'); // Set Schema to Testing & QA for correct colors

        // Define Tests
        const testSteps: TestStep[] = [
             // --- 0.1 Visuals (Circle Packing) ---
             { 
                 id: '0.1.1', 
                 description: 'Panel(CirclePacking).Open', 
                 action: () => {
                     panelState.setIsCirclePackingPanelOpen(true);
                     setPanelLayouts((prev: Record<string, PanelLayout>) => ({
                         ...prev,
                         'circle_packing': {
                             x: Math.max(50, window.innerWidth - 450),
                             y: 100,
                             w: 400,
                             h: 530, // 400 (canvas) + ~130 (UI chrome) = 530px height to ensure square canvas
                             zIndex: 200,
                             isFloating: true
                         }
                     }));
                 }, 
                 wait: 600 
             },
             { id: '0.1.2', description: 'Panel(CirclePacking).Check(Header)', selector: 'text:Circle Packing' },
             
             // --- 0.2 Data Tools (CSV) ---
             { id: '0.2.1', description: 'Modal(CSV).Open', action: () => setIsCsvModalOpen(true), wait: 600 },
             { id: '0.2.2', description: 'Modal(CSV).Check(Header)', selector: 'text:Data Tools', prerequisite: 'text:Data Tools' },
             { id: '0.2.3', description: 'Modal(CSV).Close', action: () => setIsCsvModalOpen(false), wait: 300 },

             // --- 1. Core Interface Panels ---
            // 1.1 Report Panel
            { id: '1.1.1', description: 'Button(Report).Click -> Open Panel', action: () => panelState.setIsReportPanelOpen(true), wait: 500 },
            { id: '1.1.2', description: 'Panel(Report).Check(Header)', selector: 'text:Report', prerequisite: 'text:Report' },
            { id: '1.1.3', description: 'Panel(Report).Check(Index)', selector: 'text:Element Index', prerequisite: 'text:Report' },
            { id: '1.1.4', description: 'Panel(Report).Check(Appendix)', selector: 'text:Appendix', prerequisite: 'text:Report' },
            { id: '1.1.5', description: 'Panel(Report).Close', action: () => panelState.setIsReportPanelOpen(false), wait: 300 },

            // 1.2 Table Panel
            { id: '1.2.1', description: 'Button(Table).Click -> Open Panel', action: () => panelState.setIsTablePanelOpen(true), wait: 500 },
            { id: '1.2.2', description: 'Panel(Table).Check(Header)', selector: 'text:Table View', prerequisite: 'text:Table View' },
            { id: '1.2.3', description: 'Panel(Table).Check(Column:Name)', selector: 'text:Name', prerequisite: 'text:Table View' },
            { id: '1.2.4', description: 'Panel(Table).Check(Column:Tags)', selector: 'text:Tags', prerequisite: 'text:Table View' },
            { id: '1.2.5', description: 'Panel(Table).Close', action: () => panelState.setIsTablePanelOpen(false), wait: 300 },

            // 1.3 Matrix Panel
            { id: '1.3.1', description: 'Button(Matrix).Click -> Open Panel', action: () => panelState.setIsMatrixPanelOpen(true), wait: 500 },
            { id: '1.3.2', description: 'Panel(Matrix).Check(Header)', selector: 'text:Adjacency Matrix', prerequisite: 'text:Adjacency Matrix' },
            { id: '1.3.3', description: 'Panel(Matrix).Close', action: () => panelState.setIsMatrixPanelOpen(false), wait: 300 },

            // 1.4 Grid Panel
            { id: '1.4.1', description: 'Button(Grid).Click -> Open Panel', action: () => panelState.setIsGridPanelOpen(true), wait: 500 },
            { id: '1.4.2', description: 'Panel(Grid).Check(Header)', selector: 'text:Attribute Grid', prerequisite: 'text:Attribute Grid' },
            { id: '1.4.3', description: 'Panel(Grid).Check(Control:Physics)', selector: 'button[title*="Physics"]', prerequisite: 'text:Attribute Grid' },
            { id: '1.4.4', description: 'Panel(Grid).Close', action: () => panelState.setIsGridPanelOpen(false), wait: 300 },

            // 1.5 Kanban Panel
            { id: '1.5.1', description: 'Button(Kanban).Click -> Open Panel', action: () => panelState.setIsKanbanPanelOpen(true), wait: 500 },
            { id: '1.5.2', description: 'Panel(Kanban).Check(Header)', selector: 'text:Kanban Board', prerequisite: 'text:Kanban Board' },
            { id: '1.5.3', description: 'Panel(Kanban).Check(Column:To Do)', selector: 'text:To Do', prerequisite: 'text:Kanban Board' },
            { id: '1.5.4', description: 'Panel(Kanban).Close', action: () => panelState.setIsKanbanPanelOpen(false), wait: 300 },
            
            // 1.6 View Management
            // 1.6.1 New View
            { 
                id: '1.6.1', 
                description: 'View.New', 
                action: async () => {
                    const toggle = document.querySelector('button[title="Switch View"]') as HTMLElement;
                    toggle?.click();
                    await new Promise(r => setTimeout(r, 200));
                    // Find "New" button in dropdown
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const newBtn = buttons.find(b => b.textContent?.includes('New'));
                    newBtn?.click();
                },
                wait: 500
            },
            
            // 1.6.2 Clone View
            {
                id: '1.6.2',
                description: 'View.Clone',
                action: async () => {
                    const toggle = document.querySelector('button[title="Switch View"]') as HTMLElement;
                    toggle?.click();
                    await new Promise(r => setTimeout(r, 200));
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const cloneBtn = buttons.find(b => b.textContent?.includes('Clone'));
                    cloneBtn?.click();
                },
                wait: 500
            },

            // 1.6.4 Edit View (Opens Details)
            {
                id: '1.6.4',
                description: 'View.Edit (Open Details)',
                action: async () => {
                     const toggle = document.querySelector('button[title="Switch View"]') as HTMLElement;
                     toggle?.click();
                     await new Promise(r => setTimeout(r, 200));
                     
                     // Find the edit button of the first item
                     const editBtn = document.querySelector('button[title="Edit Settings"]') as HTMLElement;
                     editBtn?.click();
                },
                wait: 500
            },
            { id: '1.6.4b', description: 'Panel(ViewDetails).Check(Header)', selector: 'text:View Details', prerequisite: 'text:View Details' },

            // 1.6.3 Room Decor (Inside Edit Panel)
            { id: '1.6.3', description: 'View.Decor.Check', selector: 'text:Room Decor', prerequisite: 'text:View Details' },
            
            // Close Details Panel
            { 
                id: '1.6.4c', 
                description: 'Panel(ViewDetails).Close', 
                action: () => panelState.setIsViewDetailsPanelOpen(false), 
                wait: 300 
            },

            // 1.6.5 Delete View
            {
                id: '1.6.5',
                description: 'View.Delete',
                action: async () => {
                    const toggle = document.querySelector('button[title="Switch View"]') as HTMLElement;
                    toggle?.click();
                    await new Promise(r => setTimeout(r, 200));
                    
                    // Find delete button
                    const delBtn = document.querySelector('button[title="Delete"]') as HTMLElement;
                    delBtn?.click();
                    
                    await new Promise(r => setTimeout(r, 200));
                    
                    // Confirm delete in modal
                    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Delete View'));
                    confirmBtn?.click();
                },
                wait: 500
            },

            // --- 2. Toolbars & Tools ---
            
            // 2.1 AI Tools
            { id: '2.1.1', description: 'Toolbar(AI).Open', action: () => { tools.setIsToolsPanelOpen(true); tools.setActiveTool('ai'); }, wait: 500 },
            { id: '2.1.2', description: 'Toolbar(AI).Check(Assistant)', selector: 'text:Assistant', prerequisite: 'text:Assistant' },
            { id: '2.1.3', description: 'Toolbar(AI).Check(Expand)', selector: 'text:Expand', prerequisite: 'text:Assistant' },
            { id: '2.1.4', description: 'Toolbar(AI).Check(Connect)', selector: 'text:Connect', prerequisite: 'text:Assistant' },
            { id: '2.1.5', description: 'Toolbar(AI).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // 2.2 Schema Tools
            { id: '2.2.1', description: 'Toolbar(Schema).Open', action: () => tools.setActiveTool('schema'), wait: 500 },
            { id: '2.2.2', description: 'Toolbar(Schema).Check(Active Schema)', selector: 'text:Active Schema', prerequisite: 'text:Active Schema' },
            { id: '2.2.3', description: 'Toolbar(Schema).Check(Default Relation)', selector: 'text:Default Relation', prerequisite: 'text:Active Schema' },
            { id: '2.2.4', description: 'Toolbar(Schema).Check(Tags Input)', selector: 'input[placeholder="Add default tag..."]', prerequisite: 'text:Active Schema' },
            { id: '2.2.5', description: 'Toolbar(Schema).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // 2.3 Layout Tools
            { id: '2.3.1', description: 'Toolbar(Layout).Open', action: () => tools.setActiveTool('layout'), wait: 500 },
            { id: '2.3.2', description: 'Toolbar(Layout).Check(Spread)', selector: 'text:Spread', prerequisite: 'text:Spread' },
            { id: '2.3.3', description: 'Toolbar(Layout).Check(Repel)', selector: 'text:Repel', prerequisite: 'text:Spread' },
            { id: '2.3.4', description: 'Toolbar(Layout).Check(Simulate)', selector: 'text:SIMULATE', prerequisite: 'text:Spread' },
            { id: '2.3.5', description: 'Toolbar(Layout).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // 2.4 Analysis Tools
            { id: '2.4.1', description: 'Toolbar(Analysis).Open', action: () => tools.setActiveTool('analysis'), wait: 500 },
            { id: '2.4.2', description: 'Toolbar(Analysis).Check(Dropdown)', selector: 'text:Graph Analytics', prerequisite: 'text:Graph Analytics' },
            { id: '2.4.3', description: 'Toolbar(Analysis).Check(Network Button)', selector: 'text:Network Analysis', prerequisite: 'text:Graph Analytics' },
            
            // 2.4a Network Panel
            { id: '2.4.4', description: 'Panel(Network).Open', action: () => panelState.setIsNetworkAnalysisOpen(true), wait: 500 },
            { id: '2.4.5', description: 'Panel(Network).Check(Header)', selector: 'text:Network Analysis', prerequisite: 'text:Network Analysis' },
            { id: '2.4.6', description: 'Panel(Network).Close', action: () => panelState.setIsNetworkAnalysisOpen(false), wait: 300 },
            
            // 2.4b Tag Distribution
            { id: '2.4.7', description: 'Panel(TagDist).Open', action: () => panelState.setIsTagDistPanelOpen(true), wait: 500 },
            { id: '2.4.8', description: 'Panel(TagDist).Check(Header)', selector: 'text:Tag Frequency', prerequisite: 'text:Tag Frequency' },
            { id: '2.4.9', description: 'Panel(TagDist).Close', action: () => panelState.setIsTagDistPanelOpen(false), wait: 300 },

            // 2.4c Relationship Distribution
            { id: '2.4.10', description: 'Panel(RelDist).Open', action: () => panelState.setIsRelDistPanelOpen(true), wait: 500 },
            { id: '2.4.11', description: 'Panel(RelDist).Check(Header)', selector: 'text:Relationship Usage', prerequisite: 'text:Relationship Usage' },
            { id: '2.4.12', description: 'Panel(RelDist).Close', action: () => { panelState.setIsRelDistPanelOpen(false); tools.setActiveTool(null); }, wait: 300 },

            // 2.5 Visualise Tools
            { id: '2.5.1', description: 'Toolbar(Visualise).Open', action: () => tools.setActiveTool('visualise'), wait: 500 },
            { id: '2.5.2', description: 'Toolbar(Visualise).Check(Grid)', selector: 'text:Attribute Grid', prerequisite: 'text:Attribute Grid' },
            { id: '2.5.3', description: 'Toolbar(Visualise).Check(Circle Packing)', selector: 'text:Circle Packing', prerequisite: 'text:Attribute Grid' },
            { id: '2.5.4', description: 'Toolbar(Visualise).Close', action: () => tools.setActiveTool(null), wait: 300 },
            
            // 2.6 Scripts
            { id: '2.6.1', description: 'Toolbar(Scripts).Open', action: () => tools.setActiveTool('scripts'), wait: 500 },
            { id: '2.6.2', description: 'Toolbar(Scripts).Check(Header)', selector: 'text:Automation & Macros', prerequisite: 'text:Automation & Macros' },
            { id: '2.6.3', description: 'Panel(Script).Open', action: () => panelState.setIsScriptPanelOpen(true), wait: 500 },
            { id: '2.6.4', description: 'Panel(Script).Check(Header)', selector: 'text:TScript', prerequisite: 'text:TScript' },
            { id: '2.6.5', description: 'Panel(Script).Close', action: () => { panelState.setIsScriptPanelOpen(false); tools.setActiveTool(null); }, wait: 300 },

            // 2.7 Tag Cloud Tools
            { id: '2.7.1', description: 'Toolbar(TagCloud).Open', action: () => tools.setActiveTool('tagcloud'), wait: 500 },
            { id: '2.7.2', description: 'Toolbar(TagCloud).Check(Header)', selector: 'text:Word Cloud Tools', prerequisite: 'text:Word Cloud Tools' },
            
            // 2.7a Tag Cloud
            { id: '2.7.3', description: 'Panel(TagCloud).Open', action: () => panelState.setIsConceptCloudOpen(true), wait: 500 },
            { id: '2.7.4', description: 'Panel(TagCloud).Check(Header)', selector: 'text:Tag Cloud', prerequisite: 'text:Tag Cloud' },
            { id: '2.7.5', description: 'Panel(TagCloud).Close', action: () => panelState.setIsConceptCloudOpen(false), wait: 300 },
            
            // 2.7b Influence Cloud (Nodes)
            { id: '2.7.6', description: 'Panel(RelCloud).Open', action: () => panelState.setIsInfluenceCloudOpen(true), wait: 500 },
            { id: '2.7.7', description: 'Panel(RelCloud).Check(Header)', selector: 'text:Relationship Cloud', prerequisite: 'text:Relationship Cloud' },
            { id: '2.7.8', description: 'Panel(RelCloud).Close', action: () => panelState.setIsInfluenceCloudOpen(false), wait: 300 },

            // 2.7c Text Analysis (Node Names)
            { id: '2.7.9', description: 'Panel(NameCloud).Open', action: () => panelState.setIsTextAnalysisOpen(true), wait: 500 },
            { id: '2.7.10', description: 'Panel(NameCloud).Check(Header)', selector: 'text:Node Name Analysis', prerequisite: 'text:Node Name Analysis' },
            { id: '2.7.11', description: 'Panel(NameCloud).Close', action: () => panelState.setIsTextAnalysisOpen(false), wait: 300 },
            
            // 2.7d Full Text Analysis
            { id: '2.7.12', description: 'Panel(FullText).Open', action: () => panelState.setIsFullTextAnalysisOpen(true), wait: 500 },
            { id: '2.7.13', description: 'Panel(FullText).Check(Header)', selector: 'text:Full Text Analysis', prerequisite: 'text:Full Text Analysis' },
            { id: '2.7.14', description: 'Panel(FullText).Close', action: () => { panelState.setIsFullTextAnalysisOpen(false); tools.setActiveTool(null); }, wait: 300 },

            // 2.8 Explorer
            { id: '2.8.1', description: 'Toolbar(Explorer).Open', action: () => tools.setActiveTool('explorer'), wait: 500 },
            { id: '2.8.2', description: 'Toolbar(Explorer).Check(Sunburst)', selector: 'text:Sunburst Explorer', prerequisite: 'text:Sunburst Explorer' },
            // 2.8a Sunburst
            { id: '2.8.3', description: 'Panel(Sunburst).Open', action: () => panelState.setIsSunburstPanelOpen(true), wait: 500 },
            { id: '2.8.4', description: 'Panel(Sunburst).Check(Header)', selector: 'text:Sunburst', prerequisite: 'text:Sunburst' },
            { id: '2.8.5', description: 'Panel(Sunburst).Close', action: () => panelState.setIsSunburstPanelOpen(false), wait: 300 },
            // 2.8b Random Walk
            { id: '2.8.6', description: 'Panel(RandomWalk).Open', action: () => setIsRandomWalkOpen(true), wait: 500 },
            { id: '2.8.7', description: 'Panel(RandomWalk).Check(Header)', selector: 'text:Random Walk', prerequisite: 'text:Random Walk' },
            { id: '2.8.8', description: 'Panel(RandomWalk).Close', action: () => { setIsRandomWalkOpen(false); tools.setActiveTool(null); }, wait: 300 },

            // 2.9 Bulk Edit
            { id: '2.9.1', description: 'Toolbar(Bulk).Open', action: () => tools.setActiveTool('bulk'), wait: 500 },
            { id: '2.9.2', description: 'Toolbar(Bulk).Check(Add Input)', selector: 'input[placeholder="Tags to add..."]', prerequisite: 'input[placeholder="Tags to add..."]' },
            { id: '2.9.3', description: 'Toolbar(Bulk).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // 2.10 Command Bar
            { id: '2.10.1', description: 'Toolbar(Command).Open', action: () => tools.setActiveTool('command'), wait: 500 },
            { id: '2.10.2', description: 'Toolbar(Command).Check(Input)', selector: 'textarea[placeholder*="Element A"]', prerequisite: 'textarea[placeholder*="Element A"]' },
            { id: '2.10.3', description: 'Toolbar(Command).Close', action: () => tools.setActiveTool(null), wait: 300 },

            // --- 3. Methodology Modals ---

            // 3.1 SCAMPER
            { id: '3.1.1', description: 'Modal(SCAMPER).Open', action: () => tools.setIsScamperModalOpen(true), wait: 600 },
            { id: '3.1.2', description: 'Modal(SCAMPER).Check(Header)', selector: 'text:SCAMPER', prerequisite: 'text:SCAMPER' },
            { id: '3.1.3', description: 'Modal(SCAMPER).Check(Save)', selector: 'text:Save Report', prerequisite: 'text:SCAMPER' }, 
            { id: '3.1.4', description: 'Modal(SCAMPER).Close', action: () => tools.setIsScamperModalOpen(false), wait: 300 },

            // 3.2 TRIZ
            { id: '3.2.1', description: 'Modal(TRIZ).Open(Contradiction)', action: () => { tools.setActiveTrizTool('contradiction'); tools.setIsTrizModalOpen(true); }, wait: 600 },
            { id: '3.2.2', description: 'Modal(TRIZ).Check(Header)', selector: 'text:TRIZ', prerequisite: 'text:TRIZ' },
            { id: '3.2.3', description: 'Modal(TRIZ).Check(SubHeader)', selector: 'text:Contradiction Matrix', prerequisite: 'text:TRIZ' },
            { id: '3.2.4', description: 'Modal(TRIZ).Check(Inputs)', selector: 'text:Improving Feature', prerequisite: 'text:TRIZ' },
            { id: '3.2.5', description: 'Modal(TRIZ).Close', action: () => tools.setIsTrizModalOpen(false), wait: 300 },

            // 3.3 Lean Six Sigma
            { id: '3.3.1', description: 'Modal(LSS).Open(Charter)', action: () => { tools.setActiveLssTool('charter'); tools.setIsLssModalOpen(true); }, wait: 600 },
            { id: '3.3.2', description: 'Modal(LSS).Check(Header)', selector: 'text:Lean Six Sigma', prerequisite: 'text:Lean Six Sigma' },
            { id: '3.3.3', description: 'Modal(LSS).Check(SubHeader)', selector: 'text:Project Charter', prerequisite: 'text:Lean Six Sigma' },
            { id: '3.3.4', description: 'Modal(LSS).Close', action: () => tools.setIsLssModalOpen(false), wait: 300 },

            // 3.4 TOC
            { id: '3.4.1', description: 'Modal(TOC).Open(CRT)', action: () => { tools.setActiveTocTool('crt'); tools.setIsTocModalOpen(true); }, wait: 600 },
            { id: '3.4.2', description: 'Modal(TOC).Check(Header)', selector: 'text:TOC', prerequisite: 'text:TOC' },
            { id: '3.4.3', description: 'Modal(TOC).Check(SubHeader)', selector: 'text:Current Reality Tree', prerequisite: 'text:TOC' },
            { id: '3.4.4', description: 'Modal(TOC).Close', action: () => tools.setIsTocModalOpen(false), wait: 300 },

            // 3.5 SSM
            { id: '3.5.1', description: 'Modal(SSM).Open(Rich Picture)', action: () => { tools.setActiveSsmTool('rich_picture'); tools.setIsSsmModalOpen(true); }, wait: 600 },
            { id: '3.5.2', description: 'Modal(SSM).Check(Header)', selector: 'text:SSM', prerequisite: 'text:SSM' },
            { id: '3.5.3', description: 'Modal(SSM).Check(SubHeader)', selector: 'text:Rich Picture', prerequisite: 'text:SSM' },
            { id: '3.5.4', description: 'Modal(SSM).Close', action: () => tools.setIsSsmModalOpen(false), wait: 300 },

            // 3.6 Strategy
            { id: '3.6.1', description: 'Modal(Strategy).Open(SWOT)', action: () => { tools.setActiveSwotTool('matrix'); tools.setIsSwotModalOpen(true); }, wait: 600 },
            { id: '3.6.2', description: 'Modal(Strategy).Check(Title)', selector: 'text:SWOT Matrix', prerequisite: 'text:SWOT Matrix' },
            { id: '3.6.3', description: 'Modal(Strategy).Check(Grid)', selector: 'text:Strengths', prerequisite: 'text:SWOT Matrix' },
            { id: '3.6.4', description: 'Modal(Strategy).Close', action: () => tools.setIsSwotModalOpen(false), wait: 300 },

            // --- 4. Additional Explorer Panels ---
             { id: '4.1.1', description: 'Panel(Treemap).Open', action: () => panelState.setIsTreemapPanelOpen(true), wait: 600 },
             { id: '4.1.2', description: 'Panel(Treemap).Check(Header)', selector: 'text:Treemap', prerequisite: 'text:Treemap' },
             { id: '4.1.3', description: 'Panel(Treemap).Close', action: () => panelState.setIsTreemapPanelOpen(false), wait: 300 },

            // --- 5. Help & Menu ---
            // 5.1 About
            { id: '5.1.1', description: 'Modal(About).Open', action: () => setIsAboutModalOpen(true), wait: 600 },
            { id: '5.1.2', description: 'Modal(About).Check(Title)', selector: 'text:Tapestry Studio', prerequisite: 'text:Tapestry Studio' },
            { id: '5.1.3', description: 'Modal(About).Close', action: () => setIsAboutModalOpen(false), wait: 300 },

            // 5.2 Pattern Gallery
            { id: '5.2.1', description: 'Modal(Patterns).Open', action: () => setIsPatternGalleryModalOpen(true), wait: 600 },
            { id: '5.2.2', description: 'Modal(Patterns).Check(Title)', selector: 'text:Pattern Gallery', prerequisite: 'text:Pattern Gallery' },
            { id: '5.2.3', description: 'Modal(Patterns).Close', action: () => setIsPatternGalleryModalOpen(false), wait: 300 },
            
            // 5.3 User Guide
            { id: '5.3.1', description: 'Modal(UserGuide).Open', action: () => setIsUserGuideModalOpen(true), wait: 600 },
            { id: '5.3.2', description: 'Modal(UserGuide).Check(Title)', selector: 'text:User Guide', prerequisite: 'text:User Guide' },
            { id: '5.3.3', description: 'Modal(UserGuide).Close', action: () => setIsUserGuideModalOpen(false), wait: 300 },
        ];
        
        executableStepsRef.current = testSteps;

        // --- GRAPH GENERATION PHASE ---
        
        // 1. Setup Data Structures
        const createdNodes = new Set<string>();
        const createdComponents = new Set<string>();
        const createdFeatures = new Set<string>();
        const stepNodeMap = new Map<string, string>(); 

        // 2. Create Root
        modelActions.addElement({
            name: "Tapestry Studio",
            tags: ["System"],
            x: 0, y: 0
        });
        createdNodes.add("Tapestry Studio");

        // 3. Build Graph from Test Definitions
        for (const step of testSteps) {
            const featureInfo = getFeatureInfo(step.id);
            const featureName = featureInfo.feature;
            const componentName = featureInfo.component;
            
            // Create Component (if new)
            if (!createdComponents.has(componentName)) {
                modelActions.addElement({ 
                    name: componentName, 
                    tags: ["Component"], 
                    x: featureInfo.x, 
                    y: featureInfo.y 
                });
                modelActions.addRelationship("Tapestry Studio", componentName, "contains", "TO");
                createdComponents.add(componentName);
                createdNodes.add(componentName);
            }
            
            // Create Feature (if new)
            if (!createdFeatures.has(featureName)) {
                modelActions.addElement({ 
                    name: featureName, 
                    tags: ["Feature"], 
                    x: featureInfo.x + (Math.random() * 50 - 25), 
                    y: featureInfo.y + (Math.random() * 50 + 25)
                });
                modelActions.addRelationship(componentName, featureName, "contains", "TO");
                createdFeatures.add(featureName);
                createdNodes.add(featureName);
            }
            
            // Create Test Node
            const testNodeName = `${step.id} ${step.description}`;
            const offsetX = (Math.random() * 150) - 75;
            const offsetY = (Math.random() * 150) + 75;
            
            const nodeId = modelActions.addElement({
                name: testNodeName,
                tags: ['Test'], // Initially just Test
                notes: step.description,
                x: featureInfo.x + offsetX,
                y: featureInfo.y + offsetY
            });
            
            modelActions.addRelationship(featureName, testNodeName, "verified by", "TO");
            
            stepNodeMap.set(step.id, nodeId);
        }

        // Create Documentation - NOTE: persistence.handleCreateModel clears documents!
        // We must create document AFTER createModel has likely finished.
        // Waiting 800ms below is sufficient.
        modelActions.createDocument(modelName, `# ${modelName}\n**Date:** ${new Date().toLocaleString()}\n\n## Test Log\n`);

        // 4. Run Auto Layout
        await new Promise(r => setTimeout(r, 1000));
        onAutoLayout();
        await new Promise(r => setTimeout(r, 1000));

        // Initialize log state with pending status
        setTestLogs(testSteps.map((step, idx) => ({
            id: step.id,
            name: step.description,
            status: 'pending',
            nodeId: stepNodeMap.get(step.id) // Attach node ID for highlighting later
        } as any)));

        setTestStatus('ready');
    };

    const runStep = async (index: number) => {
        const stepDef = executableStepsRef.current[index];
        const logItem = testLogs[index];
        if (!stepDef) return false;

        // Focus Logic
        const nodeId = (logItem as any).nodeId;
        const testNodeName = `${stepDef.id} ${stepDef.description}`;
        
        if (nodeId) {
            setAnalysisHighlights(new Map([[nodeId, '#facc15']]));
            setSelectedElementId(nodeId);
            setMultiSelection(new Set([nodeId]));
        }

        // Update status to running
        setTestLogs(prev => prev.map((l, i) => i === index ? { ...l, status: 'running' } : l));

        let stepStatus: 'ok' | 'error' | 'blocked' = 'ok';
        let stepMsg = '';

        // 1. Check Prerequisite
        if (stepDef.prerequisite) {
            const preExists = await checkElement(stepDef.prerequisite, 500); // Short timeout for prerequisite
            if (!preExists) {
                 stepStatus = 'blocked';
                 stepMsg = `Prerequisite '${stepDef.prerequisite}' not found`;
            }
        }

        // 2. Run Action/Check (Only if not blocked)
        if (stepStatus === 'ok') {
            try {
                if (stepDef.action) {
                    await stepDef.action();
                }

                if (stepDef.wait) {
                    await new Promise(r => setTimeout(r, stepDef.wait));
                }

                if (stepDef.selector) {
                    const exists = await checkElement(stepDef.selector, stepDef.timeout || 2000);
                    if (!exists) {
                        stepStatus = 'error';
                        stepMsg = `Element '${stepDef.selector}' not found`;
                    }
                }
            } catch (e) {
                stepStatus = 'error';
                stepMsg = e instanceof Error ? e.message : 'Execution Error';
            }
        }

        // Update Log
        setTestLogs(prev => prev.map((l, i) => i === index ? { 
            ...l, 
            status: stepStatus, 
            message: stepMsg 
        } : l));

        // Update Graph Node
        if (nodeId) {
            // Apply Outcome Tag. Note: We REPLACE existing tags to remove 'Test'.
            const outcomeTag = stepStatus === 'ok' ? 'Pass' : (stepStatus === 'blocked' ? 'Blocked' : 'Fail');
            const finalTags = [outcomeTag]; // Removes 'Test' implicitly by overwriting
            
            modelActions.updateElement(testNodeName, { 
                tags: finalTags,
                notes: `${stepDef.description}\nResult: ${stepStatus.toUpperCase()} ${stepMsg}`
            });
        }
        
        // Update Document Log
        if (testDocTitleRef.current) {
             const info = getFeatureInfo(stepDef.id);
             let contentToAdd = "";
             
             // Check Component Grouping
             if (info.component !== lastLogContextRef.current.component) {
                 contentToAdd += `### Component: ${info.component}\n`;
                 lastLogContextRef.current.component = info.component;
                 lastLogContextRef.current.feature = ""; // Reset feature
             }
             
             // Check Feature Grouping
             if (info.feature !== lastLogContextRef.current.feature) {
                 contentToAdd += `#### Feature: ${info.feature}\n`;
                 lastLogContextRef.current.feature = info.feature;
             }

             const icon = stepStatus === 'ok' ? '✅' : (stepStatus === 'blocked' ? '🚫' : '❌');
             const logLine = `- ${icon} **${stepDef.id}** ${stepDef.description}${stepMsg ? ` — _${stepMsg}_` : ''}`;
             
             contentToAdd += logLine;
             
             modelActions.updateDocument(testDocTitleRef.current, contentToAdd, 'append');
        }
        
        await new Promise(r => setTimeout(r, 200)); // Visual pause
        return stepStatus === 'ok';
    };

    const runSequence = async (startIndex: number) => {
        setTestStatus('running');
        stopRef.current = false;
        
        for (let i = startIndex; i < testLogs.length; i++) {
            if (stopRef.current) {
                setTestStatus('stopped');
                setExecutionIndex(i);
                return;
            }
            setExecutionIndex(i);
            await runStep(i);
        }
        
        setTestStatus('complete');
        // Cleanup
        setAnalysisHighlights(new Map());
    };

    const handlePlay = () => {
        runSequence(executionIndex);
    };

    const handleStop = () => {
        stopRef.current = true;
    };

    const handleRunSingle = async (index: number) => {
        stopRef.current = true; // Stop any sequence
        setTestStatus('paused');
        await runStep(index);
        setExecutionIndex(index + 1); // Advance cursor
    };

    const handleSelectStep = (index: number) => {
        setExecutionIndex(index);
        
        const log = testLogs[index];
        const nodeId = (log as any).nodeId;
        
        if (nodeId) {
            setAnalysisHighlights(new Map([[nodeId, '#facc15']]));
            setSelectedElementId(nodeId);
            setMultiSelection(new Set([nodeId]));
            
            if (graphCanvasRef.current) {
                const el = elements.find(e => e.id === nodeId);
                if (el && el.x !== undefined && el.y !== undefined) {
                     const cx = window.innerWidth / 2;
                     const cy = window.innerHeight / 2;
                     graphCanvasRef.current.setCamera(-(el.x) + cx, -(el.y) + cy, 1.5);
                }
            }
        }
    };

    return {
        runSelfTest,
        isSelfTestModalOpen,
        setIsSelfTestModalOpen,
        testLogs,
        testStatus,
        
        // Expose new controls
        handlePlay,
        handleStop,
        handleRunSingle,
        handleSelectStep,
        executionIndex
    };
};
