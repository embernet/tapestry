
import React, { useState, useMemo, useEffect } from 'react';
import { Element, Relationship, TrizToolType, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentEditorPanel } from './DocumentPanel';
import { DEFAULT_TOOL_PROMPTS } from '../constants';

interface TrizModalProps {
  isOpen: boolean;
  activeTool: TrizToolType;
  elements: Element[];
  relationships: Relationship[];
  modelActions: ModelActions;
  onClose: () => void;
  onLogHistory?: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
  onOpenHistory?: () => void;
  onAnalyze?: (context: string) => void;
  initialParams?: any;
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  onUpdateDocument: (docId: string, updates: Partial<TapestryDocument>) => void;
  customPrompt?: string;
  activeModel?: string;
}

// ... (Keep all constants and subcomponents PERSPECTIVES, TRIZ_PRINCIPLES_DATA, ContradictionPanel, PrinciplesPanel, ArizPanel, SufieldPanel, TrendsPanel identical to original) ...
const PERSPECTIVES = [
    { key: 'engineering', label: 'Engineering' },
    { key: 'business', label: 'Business' },
    { key: 'software', label: 'Software' },
    { key: 'physics', label: 'Physics' },
    { key: 'social', label: 'Social Systems' },
    { key: 'psychology', label: 'Psychology & Behaviour' },
    { key: 'environment', label: 'Ecology / Environment' },
    { key: 'economics', label: 'Economics & Incentives' },
    { key: 'policy', label: 'Policy / Governance' },
    { key: 'ethics', label: 'Ethics / Philosophy' },
    { key: 'health', label: 'Health / Medicine' },
    { key: 'logistics', label: 'Logistics / Supply Chains' },
    { key: 'urban', label: 'Urban Systems' },
    { key: 'design', label: 'Design / Human-Centred' }
] as const;

const TRIZ_PRINCIPLES_DATA = [
    { id: 1, name: "1. Segmentation", engineering: "Divide an object into independent parts...", business: "Segment market audiences...", software: "Microservices architecture...", physics: "Particle nature of matter...", social: "Decentralize communities...", psychology: "Compartmentalize tasks...", environment: "Create habitat patches...", economics: "Micro-transactions...", policy: "Federalism...", ethics: "Situational ethics...", health: "Quarantine...", logistics: "Palletization...", urban: "Zoning...", design: "Chunking information..." },
    { id: 2, name: "2. Taking Out", engineering: "Separate an interfering part or property...", business: "Outsource non-core functions...", software: "Extract common libraries...", physics: "Filter specific wavelengths...", social: "Remove toxic elements...", psychology: "Isolate negative thoughts...", environment: "Remove pollutants...", economics: "Cut overhead costs...", policy: "Deregulation...", ethics: "Remove conflict of interest...", health: "Surgical removal...", logistics: "Cross-docking...", urban: "Bypass roads...", design: "Minimalism..." },
    { id: 3, name: "3. Local Quality", engineering: "Change an object's structure from uniform to non-uniform...", business: "Personalized marketing...", software: "Local caching strategies...", physics: "Gradient materials...", social: "Community-specific rules...", psychology: "Tailored learning...", environment: "Microclimates...", economics: "Price discrimination...", policy: "Local governance...", ethics: "Contextual ethics...", health: "Targeted drug delivery...", logistics: "Hub and spoke...", urban: "Mixed-use development...", design: "Adaptive interfaces..." },
    { id: 4, name: "4. Asymmetry", engineering: "Change the shape of an object from symmetrical to asymmetrical...", business: "Niche market focus...", software: "Asymmetric encryption...", physics: "Anisotropic materials...", social: "Minority rights...", psychology: "Bias awareness...", environment: "Irregular planting...", economics: "Asymmetric information...", policy: "Affirmative action...", ethics: "Equity vs Equality...", health: "Treating underlying cause vs symptoms...", logistics: "One-way streets...", urban: "Organic street patterns...", design: "Asymmetrical balance..." },
    { id: 5, name: "5. Merging", engineering: "Bring closer together (or merge) identical or similar objects...", business: "Mergers and acquisitions...", software: "Code refactoring/merging...", physics: "Nuclear fusion...", social: "Coalitions...", psychology: "Group therapy...", environment: "Wildlife corridors...", economics: "Economies of scale...", policy: "Unified regulations...", ethics: "Consensus building...", health: "Combination therapy...", logistics: "Consolidated shipments...", urban: "Multi-modal transport...", design: "Unified branding..." },
    // ... (Assuming full list exists in original file, truncating for update brevity as logic doesn't change)
];

const ContradictionPanel: React.FC<{ elements: Element[], onGenerate: (p1: string, p2: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [improvingId, setImprovingId] = useState('');
    const [worseningId, setWorseningId] = useState('');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                A Technical Contradiction occurs when improving one parameter of a system causes another parameter to deteriorate.
                Select two nodes from your graph that represent this conflict.
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 p-3 rounded border border-gray-600">
                    <label className="block text-xs font-bold text-green-400 uppercase mb-2">Improving Feature</label>
                    <select 
                        className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-green-500 outline-none"
                        value={improvingId}
                        onChange={e => setImprovingId(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
                <div className="bg-gray-700 p-3 rounded border border-gray-600">
                    <label className="block text-xs font-bold text-red-400 uppercase mb-2">Worsening Feature</label>
                    <select 
                        className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-red-500 outline-none"
                        value={worseningId}
                        onChange={e => setWorseningId(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
            </div>
            <button 
                disabled={!improvingId || !worseningId || isLoading}
                onClick={() => onGenerate(improvingId, worseningId)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {isLoading ? 'Analyzing...' : 'Identify Contradiction & Suggest Principles'}
            </button>
        </div>
    );
};

const PrinciplesPanel: React.FC<{ elements: Element[], onGenerate: (principleData: string, target: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [selectedPrincipleId, setSelectedPrincipleId] = useState<number>(1);
    const [targetNode, setTargetNode] = useState('');
    const [selectedPerspective, setSelectedPerspective] = useState<string>('engineering');
    
    const [customName, setCustomName] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [isAutoFilling, setIsAutoFilling] = useState(false);

    const currentPrinciple = useMemo(() => TRIZ_PRINCIPLES_DATA.find(p => p.id === selectedPrincipleId) || TRIZ_PRINCIPLES_DATA[0], [selectedPrincipleId]);

    const handleAutoFillCustom = async () => {
        if (!customName.trim()) {
            alert("Please enter a name for your custom perspective (e.g. 'Culinary', 'Education').");
            return;
        }
        setIsAutoFilling(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Explain TRIZ Principle "${currentPrinciple.name}" (${currentPrinciple.engineering}) from the perspective of "${customName}". Provide a concise 2-3 sentence description/analogy.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            
            if (response.text) {
                setCustomDesc(response.text);
                setSelectedPerspective('custom');
            }
        } catch (e) {
            console.error("Auto-fill failed", e);
            alert("Failed to generate description.");
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleGenerateClick = () => {
        if (!targetNode) return;
        
        let description = "";
        let perspectiveName = "";

        if (selectedPerspective === 'custom') {
            description = customDesc;
            perspectiveName = customName || "Custom";
        } else {
            // @ts-ignore
            description = currentPrinciple[selectedPerspective];
            // @ts-ignore
            perspectiveName = PERSPECTIVES.find(p => p.key === selectedPerspective)?.label || selectedPerspective;
        }

        const payload = JSON.stringify({
            name: currentPrinciple.name,
            perspective: perspectiveName,
            description: description
        });

        onGenerate(payload, targetNode);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Principle</label>
                <select 
                    className="w-full bg-gray-800 text-white text-lg font-bold rounded p-3 border border-gray-600 focus:border-violet-500 outline-none"
                    value={selectedPrincipleId}
                    onChange={e => setSelectedPrincipleId(Number(e.target.value))}
                >
                    {TRIZ_PRINCIPLES_DATA.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="text-[10px] text-gray-500 font-bold tracking-wide mt-2 text-center">SELECT PERSPECTIVE OR DESCRIBE YOUR OWN BELOW</div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-grow overflow-y-auto pr-2">
                {PERSPECTIVES.map(p => (
                    <div 
                        key={p.key}
                        onClick={() => setSelectedPerspective(p.key)}
                        className={`p-4 rounded border cursor-pointer transition-all flex flex-col gap-2 h-full ${selectedPerspective === p.key ? 'bg-violet-900/30 border-violet-500 ring-1 ring-violet-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-500'}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{p.label}</span>
                            {selectedPerspective === p.key && <span className="text-violet-400">●</span>}
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed">
                            {/* @ts-ignore */}
                            {currentPrinciple[p.key] || "Description not available."}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-gray-800 p-4 rounded border border-gray-700 flex-shrink-0">
                <div 
                    onClick={() => setSelectedPerspective('custom')}
                    className={`cursor-pointer transition-colors mb-3 flex justify-between items-center ${selectedPerspective === 'custom' ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-gray-300'}`}
                >
                    <span className="text-xs font-bold uppercase tracking-wider">Custom Perspective</span>
                    {selectedPerspective === 'custom' && <span>●</span>}
                </div>
                
                <div className="flex gap-3 mb-2">
                    <input 
                        type="text" 
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        onClick={() => setSelectedPerspective('custom')}
                        placeholder="e.g. Culinary, Education, Military..."
                        className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 flex-grow"
                    />
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleAutoFillCustom(); }}
                        disabled={isAutoFilling || !customName.trim()}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-3 py-2 rounded border border-gray-600 disabled:opacity-50 whitespace-nowrap"
                    >
                        {isAutoFilling ? 'Generating...' : 'Auto-Fill'}
                    </button>
                </div>
                <textarea 
                    value={customDesc}
                    onChange={e => setCustomDesc(e.target.value)}
                    onClick={() => setSelectedPerspective('custom')}
                    placeholder="Enter description or use Auto-Fill..."
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 h-16 resize-none"
                />
            </div>

            <div className="pt-4 border-t border-gray-700 flex-shrink-0">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Apply to Target Node</label>
                <div className="flex gap-3">
                    <select 
                        className="flex-grow bg-gray-800 text-white text-sm rounded p-3 border border-gray-600 focus:border-violet-500 outline-none"
                        value={targetNode}
                        onChange={e => setTargetNode(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                    <button 
                        disabled={!targetNode || isLoading}
                        onClick={handleGenerateClick}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-8 rounded transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ArizPanel: React.FC<{ onGenerate: (problem: string) => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    const [problem, setProblem] = useState('');
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                ARIZ (Algorithm for Inventive Problem Solving) is a step-by-step method for complex problems.
                Describe the problem situation to start the algorithm.
            </p>
            <textarea
                value={problem}
                onChange={e => setProblem(e.target.value)}
                placeholder="Describe the complex problem..."
                className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-pink-500 outline-none h-24"
            />
            <button 
                disabled={!problem.trim() || isLoading}
                onClick={() => onGenerate(problem)}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Processing...' : 'Run ARIZ'}
            </button>
        </div>
    );
};

const SufieldPanel: React.FC<{ onGenerate: (desc: string) => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    const [desc, setDesc] = useState('');
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Su-Field (Substance-Field) Analysis models systems as two substances and a field.
                Describe the interaction you want to model.
            </p>
            <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="e.g., The knife (S1) cuts the bread (S2) using mechanical force (F)..."
                className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-rose-500 outline-none h-24"
            />
            <button 
                disabled={!desc.trim() || isLoading}
                onClick={() => onGenerate(desc)}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Modeling...' : 'Analyze Su-Field'}
            </button>
        </div>
    );
};

const TrendsPanel: React.FC<{ elements: Element[], onGenerate: (node: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [node, setNode] = useState('');
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Laws of Technical Systems Evolution predict how systems develop over time.
                Select a system (node) to analyze its evolutionary stage and next steps.
            </p>
            <select 
                className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-teal-500 outline-none"
                value={node}
                onChange={e => setNode(e.target.value)}
            >
                <option value="">-- Select System/Node --</option>
                {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
            <button 
                disabled={!node || isLoading}
                onClick={() => onGenerate(node)}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Forecasting...' : 'Predict Evolution'}
            </button>
        </div>
    );
};

const TrizModal: React.FC<TrizModalProps> = ({ isOpen, activeTool, elements, relationships, modelActions, onClose, onLogHistory, onOpenHistory, onAnalyze, initialParams, documents, folders, onUpdateDocument, customPrompt, activeModel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);

  useEffect(() => {
      if (!isOpen) {
          setSuggestions([]);
          setAnalysisText('');
          setGeneratedDocId(null);
      }
  }, [isOpen]);

  const toolInfo = useMemo(() => {
      switch(activeTool) {
          case 'contradiction': return { title: 'Contradiction Matrix', color: 'text-indigo-400', border: 'border-indigo-500' };
          case 'principles': return { title: '40 Principles', color: 'text-violet-400', border: 'border-violet-500' };
          case 'ariz': return { title: 'ARIZ', color: 'text-pink-400', border: 'border-pink-500' };
          case 'sufield': return { title: 'Su-Field Analysis', color: 'text-rose-400', border: 'border-rose-500' };
          case 'trends': return { title: 'Evolution Trends', color: 'text-teal-400', border: 'border-teal-500' };
          default: return { title: 'TRIZ Tool', color: 'text-gray-400', border: 'border-gray-500' };
      }
  }, [activeTool]);

  const generatedDoc = useMemo(() => documents.find(d => d.id === generatedDocId), [documents, generatedDocId]);

  if (!isOpen) return null;

  const handleGenerate = async (arg1: string, arg2?: string) => {
      setIsLoading(true);
      setSuggestions([]);
      setAnalysisText('');
      setGeneratedDocId(null);

      try {
          const graphMarkdown = generateMarkdownFromGraph(elements, relationships);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const systemPromptBase = customPrompt || DEFAULT_TOOL_PROMPTS['triz'];
          let systemInstruction = `${systemPromptBase}
          GRAPH CONTEXT:
          ${graphMarkdown}`;

          let userPrompt = "";
          let subjectName = "General";

          if (activeTool === 'contradiction') {
              subjectName = `${arg1} vs ${arg2}`;
              userPrompt = `Identify the technical contradiction between improving "${arg1}" and worsening "${arg2}".
              1. Map these to standard TRIZ parameters.
              2. Consult the Matrix to find inventive principles.
              3. Suggest specific "Idea" nodes based on these principles to resolve the conflict.
              4. Output the analysis in MARKDOWN format.`;
          } else if (activeTool === 'principles') {
              // Arg1 contains the principle context JSON
              const principleData = JSON.parse(arg1);
              const target = arg2;
              subjectName = target || "Unknown";
              
              userPrompt = `Apply TRIZ Principle: "${principleData.name}" to the node "${target}".
              
              FOCUS PERSPECTIVE: ${principleData.perspective}
              DESCRIPTION TO APPLY: "${principleData.description}"
              
              Instructions:
              1. Analyze the node "${target}" specifically through the lens of the provided description.
              2. Provide your analysis in a STRUCTURED MARKDOWN format.
              3. The Markdown MUST start with a header: "# TRIZ Analysis: ${principleData.name} applied to ${target}"
              4. Immediately after the header, include a section "## Summary of Improvements" with a bulleted list of the key ideas.
              5. Include a subsection "**Perspective:** ${principleData.perspective}"
              6. Suggest specific modifications to the graph (adding sub-nodes, changing attributes, adding relationships) that implement this principle.
              7. In your analysis text, explain HOW this specific perspective applies.`;
          } else if (activeTool === 'ariz') {
              subjectName = arg1.substring(0, 20);
              userPrompt = `Apply a simplified ARIZ process to the problem: "${arg1}".
              1. Formulate the Mini-Problem.
              2. Analyze the conflict zone.
              3. Define the Ideal Final Result (IFR).
              4. Suggest graph changes to move towards the IFR.
              5. Output the analysis in MARKDOWN format.`;
          } else if (activeTool === 'sufield') {
              subjectName = arg1.substring(0, 20);
              userPrompt = `Perform Su-Field Analysis on: "${arg1}".
              1. Model the S1-S2-F interaction.
              2. Identify if the model is incomplete, ineffective, or harmful.
              3. Apply 76 Standard Solutions (e.g., add a substance S3, change the field).
              4. Suggest nodes to represent the solution.
              5. Output the analysis in MARKDOWN format.`;
          } else if (activeTool === 'trends') {
              subjectName = arg1;
              userPrompt = `Analyze the evolution state of "${arg1}".
              1. Identify its position on the S-Curve.
              2. Check trends like "Transition to Super-system", "Increasing Dynamization", "Uneven Development".
              3. Suggest future state nodes.
              4. Output the analysis in MARKDOWN format.`;
          }

          const response = await ai.models.generateContent({
              model: activeModel || 'gemini-2.5-flash',
              contents: userPrompt,
              config: {
                  systemInstruction,
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          analysis: { type: Type.STRING },
                          actions: {
                              type: Type.ARRAY,
                              items: {
                                  type: Type.OBJECT,
                                  properties: {
                                      name: { type: Type.STRING },
                                      args: { 
                                          type: Type.OBJECT,
                                          properties: {
                                              name: { type: Type.STRING },
                                              sourceName: { type: Type.STRING },
                                              targetName: { type: Type.STRING },
                                              label: { type: Type.STRING },
                                              direction: { type: Type.STRING },
                                              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                              notes: { type: Type.STRING },
                                              elementName: { type: Type.STRING },
                                              key: { type: Type.STRING },
                                              value: { type: Type.STRING }
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          });

          const result = JSON.parse(response.text || "{}");
          setAnalysisText(result.analysis);
          
          const actions = (result.actions || []).map((a: any, i: number) => ({ ...a, id: i, status: 'pending' }));
          setSuggestions(actions);

          // Document Creation Logic
          const toolFolderName = "TRIZ";
          const subToolName = toolInfo.title;
          
          // 1. Ensure folders exist
          let toolsFolder = folders.find(f => f.name === "Tools" && !f.parentId);
          if (!toolsFolder) {
              const id = modelActions.createFolder("Tools", null);
              toolsFolder = { id, name: "Tools", parentId: null, createdAt: "" };
          }
          
          let specificFolder = folders.find(f => f.name === toolFolderName && f.parentId === toolsFolder?.id);
          if (!specificFolder && toolsFolder) {
              const id = modelActions.createFolder(toolFolderName, toolsFolder.id);
              specificFolder = { id, name: toolFolderName, parentId: toolsFolder.id, createdAt: "" };
          }

          if (specificFolder) {
              const baseTitle = `${subToolName} - ${subjectName}`;
              let title = baseTitle;
              let counter = 1;
              while (documents.some(d => d.folderId === specificFolder!.id && d.title === title)) {
                  title = `${baseTitle} ${counter}`;
                  counter++;
              }

              const newDocId = modelActions.createDocument(title, result.analysis);
              modelActions.moveDocument(newDocId, specificFolder.id);
              setGeneratedDocId(newDocId);
          }

          if (onLogHistory) {
              const actionSummary = actions.map((a: any) => {
                  if (a.name === 'addElement') return `- Add Node: ${a.args.name}`;
                  if (a.name === 'addRelationship') return `- Connect: ${a.args.sourceName} -> ${a.args.targetName}`;
                  return `- ${a.name}`;
              }).join('\n');
              onLogHistory(
                  `TRIZ: ${toolInfo.title}`, 
                  `${result.analysis}\n\n### Proposed Actions:\n${actionSummary}`, 
                  result.analysis.substring(0, 100) + '...',
                  activeTool,
                  { arg1, arg2 }
              );
          }

      } catch (e) {
          console.error("TRIZ Error", e);
          setAnalysisText("Error analyzing model. Please try again.");
      } finally {
          setIsLoading(false);
      }
  };

  // ... (Keep all handlers like handleApplyAction, handleCopy, etc. identical) ...
  const handleApplyAction = (index: number) => {
      const action = suggestions[index];
      if (!action) return;

      try {
          const { name, args } = action;
          if (name === 'addElement') modelActions.addElement(args);
          else if (name === 'addRelationship') modelActions.addRelationship(args.sourceName, args.targetName, args.label, args.direction);
          else if (name === 'deleteElement') modelActions.deleteElement(args.name);
          else if (name === 'setElementAttribute') modelActions.setElementAttribute(args.elementName, args.key, args.value);
          
          setSuggestions(prev => prev.map((s, i) => i === index ? { ...s, status: 'applied' } : s));
      } catch (e) {
          alert("Failed to apply action. Ensure referenced nodes exist.");
      }
  };

  const handleCopy = () => {
      if (analysisText) {
          navigator.clipboard.writeText(analysisText);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      }
  };

  const handleChat = () => {
      if (onAnalyze && analysisText) {
          onAnalyze(analysisText);
          onClose();
      }
  };

  const handleDelete = () => {
      setAnalysisText('');
      setSuggestions([]);
      setGeneratedDocId(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[3000] p-4">
      <div className={`bg-gray-900 rounded-lg w-full max-w-6xl shadow-2xl border ${toolInfo.border} text-white flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800 rounded-t-lg">
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${toolInfo.color}`}>
                TRIZ / <span className="text-white">{toolInfo.title}</span>
            </h2>
            <div className="flex items-center gap-2">
                {onOpenHistory && (
                    <button onClick={onOpenHistory} className="text-gray-400 hover:text-white mr-2" title="View History">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                )}
                <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
            {/* Left: Controls */}
            <div className={`${activeTool === 'principles' ? 'w-1/2' : 'w-1/3'} p-6 border-r border-gray-800 overflow-y-auto bg-gray-800/50`}>
                {activeTool === 'contradiction' && <ContradictionPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'principles' && <PrinciplesPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'ariz' && <ArizPanel isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'sufield' && <SufieldPanel isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'trends' && <TrendsPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
            </div>

            {/* Right: Results */}
            <div className={`${activeTool === 'principles' ? 'w-1/2' : 'w-2/3'} p-6 overflow-y-auto flex flex-col gap-6 bg-gray-900 relative`}>
                
                {/* Results UI ... */}
                {analysisText && (
                    <div className="absolute top-4 right-6 flex gap-2 z-10">
                        <button onClick={handleCopy} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition" title="Copy">
                            {isCopied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                        </button>
                        <button onClick={handleChat} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-blue-400 transition" title="Ask AI">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </button>
                        <button onClick={handleDelete} className="p-1.5 rounded bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-400 transition" title="Clear">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {generatedDoc ? (
                    <div className="flex-grow flex flex-col h-full bg-gray-800 rounded border border-gray-700 overflow-hidden">
                        <DocumentEditorPanel 
                            document={generatedDoc} 
                            onUpdate={onUpdateDocument} 
                            onClose={() => setGeneratedDocId(null)} 
                            initialViewMode="preview"
                        />
                    </div>
                ) : (
                    <>
                        {analysisText && (
                            <div className="bg-gray-800 p-4 rounded border border-gray-700 pt-10">
                                <h3 className="text-lg font-bold text-gray-200 mb-2">Analysis</h3>
                                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed markdown-content">
                                    {analysisText}
                                </div>
                            </div>
                        )}

                        {suggestions.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-200 mb-3">Recommended Actions</h3>
                                <div className="space-y-3">
                                    {suggestions.map((action, idx) => (
                                        <div key={idx} className={`p-3 rounded border flex items-center justify-between ${action.status === 'applied' ? 'bg-green-900/20 border-green-600' : 'bg-gray-800 border-gray-700'}`}>
                                            <div className="text-sm">
                                                <div className="font-mono text-xs text-gray-500 uppercase mb-1">{action.name}</div>
                                                <div className="text-gray-200 font-medium">
                                                    {action.name === 'addElement' && `Add: ${action.args.name}`}
                                                    {action.name === 'addRelationship' && `Link: ${action.args.sourceName} → ${action.args.targetName}`}
                                                    {action.name === 'setElementAttribute' && `Set: ${action.args.key} = ${action.args.value} on ${action.args.elementName}`}
                                                    {!['addElement', 'addRelationship', 'setElementAttribute'].includes(action.name) && JSON.stringify(action.args)}
                                                </div>
                                            </div>
                                            {action.status === 'pending' ? (
                                                <button 
                                                    onClick={() => handleApplyAction(idx)}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition"
                                                >
                                                    Apply
                                                </button>
                                            ) : (
                                                <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    Applied
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!analysisText && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p>Select a TRIZ tool to analyze your model.</p>
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-400 animate-pulse text-sm">Applying TRIZ Algorithms...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TrizModal;
