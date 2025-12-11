
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Element, Relationship, CsvColumnConfig, CsvColumnMappingType, RelationshipDirection } from '../types';
import { parseCSV, generateCSV, guessColumnMapping } from '../utils/csvParser';
import { generateUUID, normalizeTag } from '../utils';

interface CsvToolModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (elements: Element[], relationships: Relationship[], mode: 'merge' | 'replace', selectAfterImport?: boolean) => void;
    elements: Element[];
    relationships: Relationship[];
    isDarkMode: boolean;
    modelName?: string;
}

type Tab = 'import' | 'export';

interface DetectedFile {
    id: string;
    file: File;
    type: 'nodes' | 'edges' | 'unknown';
    headers: string[];
    rows: string[][];
    selected: boolean;
    pairId?: string; // ID of the linked file (e.g., nodes -> edges)
    columnConfigs?: CsvColumnConfig[]; // Store config per file
}

export const CsvToolModal: React.FC<CsvToolModalProps> = ({ 
    isOpen, onClose, onImport, elements, relationships, isDarkMode, modelName 
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('import');
    
    // File State
    const [detectedFiles, setDetectedFiles] = useState<DetectedFile[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);

    // View State
    const [mergeMode, setMergeMode] = useState<'merge' | 'replace'>('merge');
    const [selectAfterImport, setSelectAfterImport] = useState(true);
    const [inspectContent, setInspectContent] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const readFileContent = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (evt) => resolve(evt.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const identifyFileType = (file: File, headers: string[]): 'nodes' | 'edges' | 'unknown' => {
        const lowerHeaders = headers.map(h => h.toLowerCase());
        const fname = file.name.toLowerCase();

        // 1. Filename Overrides (Strongest Signal)
        if (fname.includes('edge') || fname.includes('relationship') || fname.includes('link')) return 'edges';
        if (fname.includes('node') || fname.includes('element') || fname.includes('verti')) return 'nodes';

        // 2. Header Heuristics
        const hasSource = lowerHeaders.some(h => h.includes('source') || h.includes('from'));
        const hasTarget = lowerHeaders.some(h => h.includes('target') || h.includes('to'));
        
        if (hasSource && hasTarget) return 'edges';
        
        const hasName = lowerHeaders.some(h => h.includes('name') || h.includes('label') || h.includes('title') || h === 'id');
        if (hasName) return 'nodes';

        return 'unknown';
    };

    const generateDefaultConfig = (headers: string[], mode: 'nodes' | 'edges'): CsvColumnConfig[] => {
        const mapping = guessColumnMapping(headers, mode);
        return headers.map((h, idx) => ({
            index: idx,
            header: h,
            mappingType: mapping[idx] as CsvColumnMappingType || 'attribute',
            attributeKey: h.replace(/[^a-zA-Z0-9_]/g, ''),
            separator: ','
        }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const filesList = e.target.files;
        if (!filesList || filesList.length === 0) return;
        
        const selectedFiles: File[] = Array.from(filesList);
        const processedNewFiles: DetectedFile[] = [];
        
        for (const file of selectedFiles) {
            try {
                const text = await readFileContent(file);
                const rows = parseCSV(text);
                if (rows.length > 0) {
                    const fileHeaders = rows[0];
                    const type = identifyFileType(file, fileHeaders);
                    const defaultConfig = generateDefaultConfig(fileHeaders, type === 'edges' ? 'edges' : 'nodes');
                    
                    processedNewFiles.push({
                        id: generateUUID(),
                        file,
                        type,
                        headers: fileHeaders,
                        rows: rows.slice(1),
                        selected: true,
                        columnConfigs: defaultConfig
                    });
                }
            } catch (err) {
                console.error("Error reading file", file.name, err);
            }
        }

        setDetectedFiles(prevFiles => {
            // 1. Merge new files with existing ones (filtering duplicates by name and size)
            const combined = [...prevFiles];
            processedNewFiles.forEach(newF => {
                const existingIndex = combined.findIndex(
                    pf => pf.file.name === newF.file.name && pf.file.size === newF.file.size
                );
                
                if (existingIndex >= 0) {
                    // Update existing if re-uploaded
                    combined[existingIndex] = newF;
                } else {
                    combined.push(newF);
                }
            });

            // 2. Re-run Pairing Logic on the full combined list
            // Reset existing pairs first to ensure clean matching
            combined.forEach(f => f.pairId = undefined);
            
            const map = new Map<string, DetectedFile>();
            combined.forEach(f => map.set(f.file.name.toLowerCase(), f));

            combined.forEach(f => {
                if (f.pairId) return; // Already paired

                const name = f.file.name;
                // Look for pattern: X_nodes.csv / X_edges.csv
                // Or simply "Nodes.csv" "Edges.csv" pairs
                const matchNode = name.match(/^(.*)[_.\s-]nodes?\.csv$/i);
                if (matchNode) {
                     const base = matchNode[1]; // e.g. "Model"
                     // Try to find "Model_edges.csv"
                     const candidates = [
                         `${base}_edges.csv`, `${base}_relationships.csv`, `${base}_links.csv`,
                         `${base}.edges.csv`, `${base} edges.csv`
                     ];
                     
                     for (const c of candidates) {
                         const partner = map.get(c.toLowerCase());
                         if (partner && partner.id !== f.id) {
                             f.pairId = partner.id;
                             partner.pairId = f.id;
                             
                             // If one is selected, auto-select the partner for convenience
                             if (f.selected) partner.selected = true;
                             
                             break;
                         }
                     }
                }
            });
            
            // Fallback: If we have exactly one node file and one edge file and no pairs yet, link them
            const nodesOnly = combined.filter(f => f.type === 'nodes' && !f.pairId);
            const edgesOnly = combined.filter(f => f.type === 'edges' && !f.pairId);
            
            if (nodesOnly.length === 1 && edgesOnly.length === 1) {
                nodesOnly[0].pairId = edgesOnly[0].id;
                edgesOnly[0].pairId = nodesOnly[0].id;
            }

            return combined;
        });

        // Switch view to the first of the newly added files
        if (processedNewFiles.length > 0) {
            const nodeFile = processedNewFiles.find(f => f.type === 'nodes');
            setActiveFileId(nodeFile?.id || processedNewFiles[0].id);
        }

        e.target.value = ''; // Reset input to allow re-selection
    };

    // Config update handler for the ACTIVE file
    const handleConfigChange = (index: number, field: keyof CsvColumnConfig, value: any) => {
        setDetectedFiles(prev => prev.map(f => {
            if (f.id === activeFileId && f.columnConfigs) {
                const newConfigs = f.columnConfigs.map(c => c.index === index ? { ...c, [field]: value } : c);
                return { ...f, columnConfigs: newConfigs };
            }
            return f;
        }));
    };
    
    const updateFileMode = (mode: 'nodes' | 'edges') => {
        setDetectedFiles(prev => prev.map(f => {
            if (f.id === activeFileId) {
                 const newConfigs = generateDefaultConfig(f.headers, mode);
                 return { ...f, type: mode, columnConfigs: newConfigs };
            }
            return f;
        }));
    };

    const toggleFileSelection = (id: string) => {
        setDetectedFiles(prev => {
            const target = prev.find(f => f.id === id);
            if (!target) return prev;
            const newSelected = !target.selected;
            
            return prev.map(f => {
                if (f.id === id) return { ...f, selected: newSelected };
                // Auto-select/deselect pair if it exists
                if (target.pairId && f.id === target.pairId) return { ...f, selected: newSelected };
                return f;
            });
        });
    };

    const processFileImport = (
        rows: string[][], 
        mode: 'nodes' | 'edges', 
        configs: CsvColumnConfig[],
        existingNodeMap: Map<string, string>
    ): { nodes: Element[], rels: Relationship[] } => {
        const newElements: Element[] = [];
        const newRelationships: Relationship[] = [];
        const now = new Date().toISOString();

        if (mode === 'nodes') {
            const nameConfig = configs.find(c => c.mappingType === 'name');
            
            rows.forEach((row, rIdx) => {
                if (row.length === 0) return;
                const nameVal = nameConfig ? row[nameConfig.index]?.trim() : `Node ${rIdx}`;
                if (!nameVal) return;

                const element: Element = {
                    id: generateUUID(), 
                    name: nameVal,
                    notes: '',
                    tags: [],
                    attributes: {},
                    customLists: {},
                    createdAt: now,
                    updatedAt: now
                };

                configs.forEach(conf => {
                    const val = row[conf.index]?.trim();
                    if (!val) return;

                    switch (conf.mappingType) {
                        case 'notes': element.notes = val; break;
                        case 'tags': element.tags = [...element.tags, ...val.split(conf.separator || ',').map(t => normalizeTag(t)).filter(Boolean)]; break;
                        case 'x': const x = parseFloat(val); if (!isNaN(x)) element.x = x; break;
                        case 'y': const y = parseFloat(val); if (!isNaN(y)) element.y = y; break;
                        case 'created': element.createdAt = val; break;
                        case 'updated': element.updatedAt = val; break;
                        case 'attribute': if (conf.attributeKey) element.attributes![conf.attributeKey] = val; break;
                        case 'list': if (conf.attributeKey) element.customLists![conf.attributeKey] = val.split(conf.separator || ',').map(t => t.trim()).filter(Boolean); break;
                    }
                });
                newElements.push(element);
            });
        } else {
            // Edges
            const sourceConf = configs.find(c => c.mappingType === 'source');
            const targetConf = configs.find(c => c.mappingType === 'target');
            const labelConf = configs.find(c => c.mappingType === 'label');

            rows.forEach((row) => {
                const sourceVal = sourceConf ? row[sourceConf.index]?.trim() : null;
                const targetVal = targetConf ? row[targetConf.index]?.trim() : null;
                
                if (!sourceVal || !targetVal) return;

                const getOrStubId = (name: string) => {
                    const n = name.toLowerCase();
                    if (existingNodeMap.has(n)) return existingNodeMap.get(n)!;
                    // In strict mode we might skip, but here we just fail to link if not found
                    return null; 
                };

                const sId = getOrStubId(sourceVal);
                const tId = getOrStubId(targetVal);

                if (sId && tId) {
                    const rel: Relationship = {
                        id: generateUUID(),
                        source: sId,
                        target: tId,
                        label: labelConf ? row[labelConf.index]?.trim() || '' : '',
                        direction: RelationshipDirection.To, 
                        tags: [],
                        attributes: {}
                    };

                    configs.forEach(conf => {
                        const val = row[conf.index]?.trim();
                        if (val && conf.mappingType === 'attribute' && conf.attributeKey) {
                            rel.attributes![conf.attributeKey] = val;
                        }
                        if (val && conf.mappingType === 'label' && !rel.label) {
                            rel.label = val;
                        }
                    });
                    newRelationships.push(rel);
                }
            });
        }
        return { nodes: newElements, rels: newRelationships };
    };

    const executeImport = () => {
        let finalNodes: Element[] = [];
        let finalRels: Relationship[] = [];
        const nodeNameMap = new Map<string, string>();

        // If merging, pre-populate map with existing nodes to allow edges to connect to them
        if (mergeMode === 'merge') {
            elements.forEach(e => nodeNameMap.set(e.name.toLowerCase(), e.id));
        }

        const filesToProcess = detectedFiles.filter(f => f.selected);
        
        // CRITICAL: Sort Nodes FIRST, then Edges.
        // This ensures that when we process edges, the nodes (from the node file) are already in the map.
        filesToProcess.sort((a, b) => {
            if (a.type === 'nodes' && b.type !== 'nodes') return -1;
            if (a.type !== 'nodes' && b.type === 'nodes') return 1;
            return 0;
        });

        let successCount = 0;

        for (const fileData of filesToProcess) {
            if (!fileData.columnConfigs) continue;
            
            const currentMode = fileData.type === 'edges' ? 'edges' : 'nodes';

            // Basic Validation
            if (currentMode === 'nodes' && !fileData.columnConfigs.some(c => c.mappingType === 'name')) {
                alert(`Skipping ${fileData.file.name}: Missing 'Name' column.`);
                continue;
            }
            if (currentMode === 'edges' && (!fileData.columnConfigs.some(c => c.mappingType === 'source') || !fileData.columnConfigs.some(c => c.mappingType === 'target'))) {
                alert(`Skipping ${fileData.file.name}: Missing Source/Target columns.`);
                continue;
            }

            const { nodes, rels } = processFileImport(fileData.rows, currentMode, fileData.columnConfigs, nodeNameMap);
            
            // Register new nodes in map for subsequent files (like edges)
            nodes.forEach(n => {
                if (nodeNameMap.has(n.name.toLowerCase())) {
                    // If replacing, we might overwrite properties, but ID remains if we want to keep connections
                    // Actually, logic here is: if name exists, we map that name to EXISTING id
                    // But since we are generating new objects in `nodes` array:
                    if (mergeMode === 'merge') {
                        n.id = nodeNameMap.get(n.name.toLowerCase())!; // Reuse ID
                    } else {
                        // Replace mode: essentially we treat as new, but usually replace clears everything first.
                        // In `onImport` parent, replace clears ALL existing. So here we build fresh.
                        nodeNameMap.set(n.name.toLowerCase(), n.id);
                    }
                } else {
                    nodeNameMap.set(n.name.toLowerCase(), n.id);
                }
                finalNodes.push(n);
            });
            
            finalRels.push(...rels);
            successCount++;
        }

        if (successCount > 0) {
            onImport(finalNodes, finalRels, mergeMode, selectAfterImport);
            onClose();
        } else {
            alert("No valid data found to import from selected files.");
        }
    };

    const handleExport = (type: 'nodes' | 'edges') => {
        let csv = '';
        let filename = '';
        const safeName = modelName ? modelName.replace(/\.json$/i, '').replace(/ /g, '_') : 'tapestry';

        if (type === 'nodes') {
            const allAttrKeys = new Set<string>();
            const allListKeys = new Set<string>();
            elements.forEach(e => {
                if (e.attributes) Object.keys(e.attributes).forEach(k => allAttrKeys.add(k));
                if (e.customLists) Object.keys(e.customLists).forEach(k => allListKeys.add(k));
            });
            const attrCols = Array.from(allAttrKeys).sort();
            const listCols = Array.from(allListKeys).sort();
            const headers = ['Name', 'Tags', 'Notes', 'X', 'Y', 'Created', 'Updated', ...attrCols, ...listCols];
            
            const data = elements.map(e => [
                e.name, e.tags.join(','), e.notes, 
                e.x ? Math.round(e.x).toString() : '', e.y ? Math.round(e.y).toString() : '', 
                e.createdAt, e.updatedAt,
                ...attrCols.map(k => e.attributes?.[k] || ''),
                ...listCols.map(k => (e.customLists?.[k] || []).join(';'))
            ]);
            csv = generateCSV(headers, data);
            filename = `${safeName}_nodes.csv`;
        } else {
            const allAttrKeys = new Set<string>();
            relationships.forEach(r => { if (r.attributes) Object.keys(r.attributes).forEach(k => allAttrKeys.add(k)); });
            const attrCols = Array.from(allAttrKeys).sort();
            const headers = ['Source', 'Target', 'Label', 'Direction', ...attrCols];
            const data = relationships.map(r => {
                const sName = elements.find(e => e.id === r.source)?.name || 'Unknown';
                const tName = elements.find(e => e.id === r.target)?.name || 'Unknown';
                return [sName, tName, r.label, r.direction, ...attrCols.map(k => r.attributes?.[k] || '')];
            });
            csv = generateCSV(headers, data);
            filename = `${safeName}_edges.csv`;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    if (!isOpen) return null;

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300';
    const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const inputClass = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const headerBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
    const activeFile = detectedFiles.find(f => f.id === activeFileId);
    const currentConfigs = activeFile?.columnConfigs || [];
    const previewRows = activeFile?.rows.slice(0, 5) || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[1300] p-4">
            <div className={`${bgClass} rounded-lg w-full max-w-5xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden`}>
                
                {/* Header */}
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                    <h2 className={`text-xl font-bold ${textClass}`}>Data Tools</h2>
                    <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                    <button onClick={() => setActiveTab('import')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'import' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Import CSV</button>
                    <button onClick={() => setActiveTab('export')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'export' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Export CSV</button>
                </div>

                {/* Content */}
                <div className={`flex-grow overflow-y-auto p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    
                    {activeTab === 'import' && (
                        <div className="space-y-6">
                            {/* Upload Area */}
                            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${detectedFiles.length > 0 ? 'border-green-500 bg-green-900/10' : 'border-gray-500'} transition-colors`}>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    multiple
                                    className="hidden"
                                />
                                <div className="space-y-2">
                                    {detectedFiles.length === 0 ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mx-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className={textClass}>Drag and drop CSV files here, or <button onClick={() => fileInputRef.current?.click()} className="text-blue-500 hover:underline">browse</button></p>
                                            <p className="text-xs text-gray-500">Tip: Select both <strong>_nodes.csv</strong> and <strong>_edges.csv</strong> to import a full model.</p>
                                        </>
                                    ) : (
                                        <div className="text-left space-y-2">
                                            <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-2">
                                                <h3 className={`font-bold ${textClass}`}>Detected Files:</h3>
                                                <button onClick={() => { setDetectedFiles([]); setActiveFileId(null); }} className="text-red-500 text-xs hover:underline">Clear All</button>
                                            </div>
                                            {detectedFiles.map((f) => (
                                                <div 
                                                    key={f.id} 
                                                    className={`flex items-center justify-between text-sm p-2 rounded transition-colors cursor-pointer ${activeFileId === f.id ? 'bg-blue-900/30 border border-blue-500/50' : 'bg-black/20 border border-transparent hover:bg-black/30'}`}
                                                    onClick={() => setActiveFileId(f.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`${textClass} font-medium`}>{f.file.name}</span>
                                                        {f.pairId && (
                                                            <span className="text-xs text-green-400 flex items-center gap-1 bg-green-900/20 px-1.5 py-0.5 rounded border border-green-800">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                                Paired
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${f.type === 'nodes' ? 'bg-blue-900 text-blue-300' : f.type === 'edges' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                                            {f.type}
                                                        </span>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={f.selected} 
                                                            onChange={(e) => { e.stopPropagation(); toggleFileSelection(f.id); }} 
                                                            className="rounded border-gray-500 text-blue-500 focus:ring-blue-500 w-5 h-5 cursor-pointer"
                                                            title="Include in Import"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-2 text-center">
                                                <button onClick={() => fileInputRef.current?.click()} className="text-blue-500 text-xs hover:underline flex items-center justify-center gap-1 mx-auto">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                    Add more files
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {activeFile && (
                                <>
                                    <div className="flex gap-6 items-start">
                                        <div className="flex-grow space-y-4">
                                            <div className="flex items-center gap-4 flex-wrap bg-black/10 p-2 rounded">
                                                <span className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Map As:</span>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => updateFileMode('nodes')}
                                                        className={`px-3 py-1 rounded text-xs font-bold border ${activeFile.type === 'nodes' ? 'bg-blue-600 border-blue-600 text-white' : `${inputClass} hover:border-blue-500`}`}
                                                    >
                                                        Nodes
                                                    </button>
                                                    <button 
                                                        onClick={() => updateFileMode('edges')}
                                                        className={`px-3 py-1 rounded text-xs font-bold border ${activeFile.type === 'edges' ? 'bg-green-600 border-green-600 text-white' : `${inputClass} hover:border-green-500`}`}
                                                    >
                                                        Edges
                                                    </button>
                                                </div>
                                                
                                                <div className="w-px h-6 bg-gray-600 mx-2"></div>

                                                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Action:</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setMergeMode('merge')} className={`px-3 py-1 rounded text-xs font-bold border ${mergeMode === 'merge' ? 'bg-purple-600 border-purple-600 text-white' : `${inputClass} hover:border-purple-500`}`}>Merge</button>
                                                    <button onClick={() => setMergeMode('replace')} className={`px-3 py-1 rounded text-xs font-bold border ${mergeMode === 'replace' ? 'bg-red-600 border-red-600 text-white' : `${inputClass} hover:border-red-500`}`}>Replace</button>
                                                </div>
                                            </div>

                                            {/* Mapping Table */}
                                            <div className="overflow-x-auto border rounded-lg">
                                                <div className={`p-2 text-xs text-center font-bold border-b border-gray-600 ${isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                                    Column Configuration for: <span className="text-blue-400">{activeFile.file.name}</span>
                                                </div>
                                                <table className={`w-full text-sm text-left ${textClass}`}>
                                                    <thead className={`${headerBg} text-xs uppercase font-bold`}>
                                                        <tr>
                                                            {currentConfigs.map(conf => (
                                                                <th key={conf.index} className="p-3 min-w-[150px] border-r last:border-r-0 border-gray-600">
                                                                    <div className="mb-2 opacity-70">{conf.header}</div>
                                                                    <select 
                                                                        value={conf.mappingType}
                                                                        onChange={(e) => handleConfigChange(conf.index, 'mappingType', e.target.value)}
                                                                        className={`w-full text-xs p-1 rounded border ${inputClass}`}
                                                                    >
                                                                        <option value="ignore">Ignore</option>
                                                                        {activeFile.type === 'nodes' ? (
                                                                            <>
                                                                                <option value="name">Name (Required)</option>
                                                                                <option value="notes">Notes</option>
                                                                                <option value="tags">Tags</option>
                                                                                <option value="x">Position X</option>
                                                                                <option value="y">Position Y</option>
                                                                                <option value="created">Created Date</option>
                                                                                <option value="updated">Updated Date</option>
                                                                                <option value="attribute">Attribute</option>
                                                                                <option value="list">Custom List</option>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <option value="source">Source Node</option>
                                                                                <option value="target">Target Node</option>
                                                                                <option value="label">Label</option>
                                                                                <option value="attribute">Attribute</option>
                                                                            </>
                                                                        )}
                                                                    </select>
                                                                    {(['attribute', 'list', 'relationship'].includes(conf.mappingType)) && (
                                                                        <input type="text" placeholder={conf.mappingType === 'relationship' ? "Relation Label" : "Key Name"} value={conf.attributeKey || ''} onChange={(e) => handleConfigChange(conf.index, 'attributeKey', e.target.value)} className={`w-full mt-1 text-xs p-1 rounded border ${inputClass}`} />
                                                                    )}
                                                                    {(['tags', 'list', 'relationship'].includes(conf.mappingType)) && (
                                                                         <input type="text" placeholder="Separator (e.g. ;)" value={conf.separator || ''} onChange={(e) => handleConfigChange(conf.index, 'separator', e.target.value)} className={`w-full mt-1 text-xs p-1 rounded border ${inputClass}`} />
                                                                    )}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {previewRows.map((row, idx) => (
                                                            <tr key={idx} className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                                {row.map((cell, cIdx) => (
                                                                    <td key={cIdx} className={`p-2 border-r last:border-r-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} truncate max-w-[150px] opacity-80 cursor-pointer hover:bg-blue-500/20 hover:opacity-100 transition-colors`} onClick={() => setInspectContent(cell)} title="Click to view full content">
                                                                        {cell}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-600">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                checked={selectAfterImport} 
                                                onChange={(e) => setSelectAfterImport(e.target.checked)}
                                                className="rounded border-gray-500 text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                            />
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-black'}`}>
                                                Select nodes after import (move together)
                                            </span>
                                        </label>

                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-500">
                                                Importing {detectedFiles.filter(f => f.selected).length} files
                                            </span>
                                            <button onClick={executeImport} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold shadow-lg flex items-center gap-2 transition-colors">
                                                Import Selected Files
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div className="space-y-8 flex flex-col items-center justify-center h-full">
                            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
                                <button onClick={() => handleExport('nodes')} className={`p-8 rounded-xl border-2 flex flex-col items-center gap-4 transition-all group ${isDarkMode ? 'border-gray-600 hover:border-blue-500 bg-gray-800' : 'border-gray-300 hover:border-blue-500 bg-white'}`}>
                                    <div className={`p-4 rounded-full bg-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform`}><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></div>
                                    <div className="text-center"><h3 className={`text-lg font-bold ${textClass}`}>Export Nodes</h3><p className="text-sm text-gray-500 mt-1">Download CSV of elements.</p></div>
                                </button>
                                <button onClick={() => handleExport('edges')} className={`p-8 rounded-xl border-2 flex flex-col items-center gap-4 transition-all group ${isDarkMode ? 'border-gray-600 hover:border-green-500 bg-gray-800' : 'border-gray-300 hover:border-green-500 bg-white'}`}>
                                    <div className={`p-4 rounded-full bg-green-500/20 text-green-500 group-hover:scale-110 transition-transform`}><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
                                    <div className="text-center"><h3 className={`text-lg font-bold ${textClass}`}>Export Edges</h3><p className="text-sm text-gray-500 mt-1">Download CSV of connections.</p></div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                {inspectContent !== null && (
                    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setInspectContent(null)}>
                        <div className={`w-full max-w-2xl flex flex-col rounded-lg shadow-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-300'}`} onClick={e => e.stopPropagation()}>
                            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}><h3 className={`font-bold ${textClass}`}>Cell Content</h3><button onClick={() => setInspectContent(null)} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>Close</button></div>
                            <div className={`p-6 overflow-y-auto max-h-[60vh]`}><pre className={`whitespace-pre-wrap font-mono text-sm ${textClass}`}>{inspectContent}</pre></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
