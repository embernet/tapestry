
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ModelMetadata, ColorScheme, SystemPromptConfig, Element, Relationship, TapestryDocument, TapestryFolder, HistoryEntry, StorySlide, MermaidDiagram, DateFilterState, PanelLayout } from '../types';
import { DEFAULT_COLOR_SCHEMES, DEFAULT_SYSTEM_PROMPT_CONFIG } from '../constants';
import { generateUUID, computeContentHash, isInIframe } from '../utils';

// Keys
const MODELS_INDEX_KEY = 'tapestry_models_index';
const LAST_OPENED_MODEL_ID_KEY = 'tapestry_last_opened_model_id';
const MODEL_DATA_PREFIX = 'tapestry_model_data_';

interface UsePersistenceProps {
    setElements: React.Dispatch<React.SetStateAction<Element[]>>;
    setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
    setDocuments: React.Dispatch<React.SetStateAction<TapestryDocument[]>>;
    setFolders: React.Dispatch<React.SetStateAction<TapestryFolder[]>>;
    setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
    setSlides: React.Dispatch<React.SetStateAction<StorySlide[]>>;
    setMermaidDiagrams: React.Dispatch<React.SetStateAction<MermaidDiagram[]>>;
    setColorSchemes: React.Dispatch<React.SetStateAction<ColorScheme[]>>;
    setActiveSchemeId: React.Dispatch<React.SetStateAction<string | null>>;
    setSystemPromptConfig: React.Dispatch<React.SetStateAction<SystemPromptConfig>>;
    setOpenDocIds: React.Dispatch<React.SetStateAction<string[]>>;
    setDetachedHistoryIds: React.Dispatch<React.SetStateAction<string[]>>;
    setPanelLayouts: React.Dispatch<React.SetStateAction<Record<string, PanelLayout>>>;
    setAnalysisHighlights: React.Dispatch<React.SetStateAction<Map<string, string>>>;
    setAnalysisFilterState: React.Dispatch<React.SetStateAction<{ mode: 'hide' | 'hide_others' | 'none', ids: Set<string> }>>;
    setMultiSelection: React.Dispatch<React.SetStateAction<Set<string>>>;
    setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>;
    setTagFilter: React.Dispatch<React.SetStateAction<{ included: Set<string>, excluded: Set<string> }>>;
    setDateFilter: React.Dispatch<React.SetStateAction<DateFilterState>>;
    currentFileHandleRef: React.MutableRefObject<any>;
    
    // Read-only refs/state for saving
    elementsRef: React.MutableRefObject<Element[]>;
    relationshipsRef: React.MutableRefObject<Relationship[]>;
    documentsRef: React.MutableRefObject<TapestryDocument[]>;
    foldersRef: React.MutableRefObject<TapestryFolder[]>;
    colorSchemes: ColorScheme[];
    activeSchemeId: string | null;
    systemPromptConfig: SystemPromptConfig;
    history: HistoryEntry[];
    slides: StorySlide[];
    mermaidDiagrams: MermaidDiagram[];
}

export const usePersistence = ({
    setElements, setRelationships, setDocuments, setFolders, setHistory, setSlides, setMermaidDiagrams,
    setColorSchemes, setActiveSchemeId, setSystemPromptConfig, setOpenDocIds, setDetachedHistoryIds,
    setPanelLayouts, setAnalysisHighlights, setAnalysisFilterState, setMultiSelection, setSelectedElementId,
    setTagFilter, setDateFilter, currentFileHandleRef,
    elementsRef, relationshipsRef, documentsRef, foldersRef,
    colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams
}: UsePersistenceProps) => {
    
    const [modelsIndex, setModelsIndex] = useState<ModelMetadata[]>([]);
    const [currentModelId, setCurrentModelId] = useState<string | null>(null);
    const [isCreateModelModalOpen, setIsCreateModelModalOpen] = useState(false);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [isOpenModelModalOpen, setIsOpenModelModalOpen] = useState(false);
    
    const [pendingImport, setPendingImport] = useState<{ localMetadata: ModelMetadata, diskMetadata: ModelMetadata, localData: any, diskData: any } | null>(null);
    
    const [schemaUpdateChanges, setSchemaUpdateChanges] = useState<string[]>([]);
    const [isSchemaUpdateModalOpen, setIsSchemaUpdateModalOpen] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const migrateLegacySchemes = useCallback((loadedSchemes: ColorScheme[]): { schemes: ColorScheme[], changes: string[] } => {
        const changes: string[] = [];
        const migratedSchemes = loadedSchemes.map(s => {
            const defaultScheme = DEFAULT_COLOR_SCHEMES.find(d => d.id === s.id);
            
            if (s.relationshipLabels && !s.relationshipDefinitions) {
                if (defaultScheme && defaultScheme.relationshipDefinitions) {
                    const defaultLabels = new Set(defaultScheme.relationshipDefinitions.map(d => d.label));
                    const extraLabels = s.relationshipLabels.filter(l => !defaultLabels.has(l));
                    s.relationshipDefinitions = [
                        ...defaultScheme.relationshipDefinitions,
                        ...extraLabels.map(l => ({ label: l, description: '' }))
                    ];
                } else {
                    s.relationshipDefinitions = s.relationshipLabels.map(l => ({ label: l, description: '' }));
                }
                delete s.relationshipLabels;
                changes.push(`Migrated legacy relationship labels for schema '${s.name}'.`);
            }

            if (defaultScheme) {
                const currentTagKeys = Object.keys(s.tagColors);
                const defaultTagKeys = Object.keys(defaultScheme.tagColors);
                const missingTags = defaultTagKeys.filter(key => !currentTagKeys.includes(key));

                if (missingTags.length > 0) {
                    s.tagColors = { ...defaultScheme.tagColors, ...s.tagColors };
                    const currentDescs = s.tagDescriptions || {};
                    const defaultDescs = defaultScheme.tagDescriptions || {};
                    s.tagDescriptions = { ...defaultDescs, ...currentDescs };
                    changes.push(`Updated schema '${s.name}': Added missing tags (${missingTags.join(', ')}).`);
                }

                if (s.relationshipDefinitions && defaultScheme.relationshipDefinitions) {
                    const currentLabels = s.relationshipDefinitions.map(d => d.label);
                    const defaultDefs = defaultScheme.relationshipDefinitions;
                    const missingDefs = defaultDefs.filter(d => !currentLabels.includes(d.label));

                    if (missingDefs.length > 0) {
                        s.relationshipDefinitions = [...s.relationshipDefinitions, ...missingDefs];
                        changes.push(`Updated schema '${s.name}': Added missing relationship types (${missingDefs.map(d => d.label).join(', ')}).`);
                    }
                }
            }
            return s;
        });

        return { schemes: migratedSchemes, changes };
    }, []);

    const loadModelData = useCallback((data: any, modelId: string, modelMetadata?: ModelMetadata) => {
        setElements(data.elements || []);
        setRelationships(data.relationships || []);
        setDocuments(data.documents || []);
        setFolders(data.folders || []);
        setHistory(data.history || []);
        setSlides(data.slides || []);
        setMermaidDiagrams(data.mermaidDiagrams || []);
        setOpenDocIds([]); 
        setDetachedHistoryIds([]);
        setPanelLayouts({});
        setAnalysisHighlights(new Map()); 
        setAnalysisFilterState({ mode: 'none', ids: new Set() }); 
        setMultiSelection(new Set()); 
        setSelectedElementId(null);
        
        let loadedSchemes = data.colorSchemes || DEFAULT_COLOR_SCHEMES;
        const { schemes: migratedSchemes, changes } = migrateLegacySchemes(loadedSchemes);
        
        const existingSchemeIds = new Set(migratedSchemes.map((s: ColorScheme) => s.id));
        const missingDefaults = DEFAULT_COLOR_SCHEMES.filter(ds => !existingSchemeIds.has(ds.id));
        
        let finalSchemes = migratedSchemes;
        if (missingDefaults.length > 0) {
            finalSchemes = [...migratedSchemes, ...missingDefaults];
            changes.push(`Added ${missingDefaults.length} new standard schemas.`);
        }

        setColorSchemes(finalSchemes);
        setActiveSchemeId(data.activeSchemeId || DEFAULT_COLOR_SCHEMES[0]?.id || null);
        
        if (changes.length > 0) {
            setSchemaUpdateChanges(changes);
            setIsSchemaUpdateModalOpen(true);
        }

        if (data.systemPromptConfig) {
            setSystemPromptConfig({ ...DEFAULT_SYSTEM_PROMPT_CONFIG, ...data.systemPromptConfig });
        } else {
            setSystemPromptConfig(DEFAULT_SYSTEM_PROMPT_CONFIG);
        }
        
        setCurrentModelId(modelId);
        localStorage.setItem(LAST_OPENED_MODEL_ID_KEY, modelId);
        setIsOpenModelModalOpen(false);
        setTagFilter({ included: new Set(), excluded: new Set() });
        setDateFilter({ createdAfter: '', createdBefore: '', updatedAfter: '', updatedBefore: '' });
        
        if (modelMetadata && !modelMetadata.filename) {
            currentFileHandleRef.current = null;
        }
        if (modelMetadata) {
            setModelsIndex(prevIndex => {
                const exists = prevIndex.find(m => m.id === modelId);
                if (exists) {
                    return prevIndex.map(m => m.id === modelId ? { ...m, ...modelMetadata } : m);
                } else {
                    return [...prevIndex, modelMetadata];
                }
            });
        }
    }, [migrateLegacySchemes, currentFileHandleRef]);

    const handleLoadModel = useCallback((modelId: string) => { 
        const modelDataString = localStorage.getItem(`${MODEL_DATA_PREFIX}${modelId}`); 
        if (modelDataString) { 
            const data = JSON.parse(modelDataString); 
            currentFileHandleRef.current = null; 
            loadModelData(data, modelId); 
        } 
    }, [loadModelData, currentFileHandleRef]);

    // Initial Load Effect
    useEffect(() => { 
        if (!isInitialLoad) return; 
        try { 
            const indexStr = localStorage.getItem(MODELS_INDEX_KEY); 
            const index = indexStr ? JSON.parse(indexStr) : []; 
            setModelsIndex(index); 
        } catch (error) { 
            console.error("Failed to load models index:", error); 
            setModelsIndex([]); 
        } 
        setIsInitialLoad(false); 
    }, [isInitialLoad]);

    // Auto-save index
    useEffect(() => { 
        if (!isInitialLoad) { 
            localStorage.setItem(MODELS_INDEX_KEY, JSON.stringify(modelsIndex)); 
        } 
    }, [modelsIndex, isInitialLoad]);

    // Auto-save current model content
    useEffect(() => { 
        if (currentModelId && !isInitialLoad) { 
            const modelData = { 
                elements: elementsRef.current, 
                relationships: relationshipsRef.current, 
                documents: documentsRef.current, 
                folders: foldersRef.current, 
                colorSchemes, 
                activeSchemeId, 
                systemPromptConfig, 
                history, 
                slides, 
                mermaidDiagrams 
            }; 
            const currentContentHash = computeContentHash(modelData); 
            const currentMeta = modelsIndex.find(m => m.id === currentModelId); 
            
            if (!currentMeta || currentMeta.contentHash !== currentContentHash) { 
                localStorage.setItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData)); 
                setModelsIndex(prevIndex => { 
                    const now = new Date().toISOString(); 
                    return prevIndex.map(m => m.id === currentModelId ? { ...m, updatedAt: now, contentHash: currentContentHash } : m); 
                }); 
            } 
        } 
    }, [elementsRef.current, relationshipsRef.current, documentsRef.current, foldersRef.current, colorSchemes, activeSchemeId, currentModelId, isInitialLoad, modelsIndex, systemPromptConfig, history, slides, mermaidDiagrams]);

    const handleCreateModel = useCallback((name: string, description: string) => { 
        const now = new Date().toISOString(); 
        const newModelData = { elements: [], relationships: [], documents: [], folders: [], colorSchemes: DEFAULT_COLOR_SCHEMES, activeSchemeId: DEFAULT_COLOR_SCHEMES[0]?.id || null, systemPromptConfig: DEFAULT_SYSTEM_PROMPT_CONFIG, history: [], slides: [], mermaidDiagrams: [] }; 
        const initialHash = computeContentHash(newModelData); 
        const newModel: ModelMetadata = { id: generateUUID(), name, description, createdAt: now, updatedAt: now, filename: `${name.replace(/ /g, '_')}.json`, contentHash: initialHash, }; 
        setModelsIndex(prevIndex => [...prevIndex, newModel]); 
        localStorage.setItem(`${MODEL_DATA_PREFIX}${newModel.id}`, JSON.stringify(newModelData)); 
        currentFileHandleRef.current = null; 
        handleLoadModel(newModel.id); 
        setIsCreateModelModalOpen(false); 
    }, [handleLoadModel, currentFileHandleRef]);

    const handleDiskSave = useCallback(async () => {
        if (!currentModelId) { alert("No active model to save."); return; }
        const modelMetadata = modelsIndex.find(m => m.id === currentModelId);
        if (!modelMetadata) { alert("Could not find model metadata to save."); return; }
        const now = new Date().toISOString();
        const modelData = { 
            elements: elementsRef.current, 
            relationships: relationshipsRef.current, 
            documents: documentsRef.current, 
            folders: foldersRef.current, 
            colorSchemes, 
            activeSchemeId, 
            systemPromptConfig, 
            history, 
            slides, 
            mermaidDiagrams 
        };
        const currentHash = computeContentHash(modelData);
        const updatedMetadata = { ...modelMetadata, updatedAt: now, filename: modelMetadata.filename || `${modelMetadata.name.replace(/ /g, '_')}.json`, contentHash: currentHash, lastDiskHash: currentHash };
        const exportData = { metadata: updatedMetadata, data: modelData, };
        const jsonString = JSON.stringify(exportData, null, 2);
        try {
            if (!isInIframe() && currentFileHandleRef.current && 'createWritable' in currentFileHandleRef.current) { 
                const writable = await currentFileHandleRef.current.createWritable(); 
                await writable.write(jsonString); 
                await writable.close(); 
            } else if (!isInIframe() && 'showSaveFilePicker' in window) { 
                const options = { suggestedName: updatedMetadata.filename, types: [{ description: 'JSON Files', accept: {'application/json': ['.json']}, }], }; 
                const fileHandle = await (window as any).showSaveFilePicker(options); 
                currentFileHandleRef.current = fileHandle; 
                const writable = await fileHandle.createWritable(); 
                await writable.write(jsonString); 
                await writable.close(); 
            } else { 
                const blob = new Blob([jsonString], { type: 'application/json' }); 
                const url = URL.createObjectURL(blob); 
                const a = document.createElement('a'); 
                a.href = url; 
                a.download = updatedMetadata.filename!; 
                document.body.appendChild(a); 
                a.click(); 
                document.body.removeChild(a); 
                URL.revokeObjectURL(url); 
            }
            setModelsIndex(prev => prev.map(m => m.id === currentModelId ? updatedMetadata : m));
            localStorage.setItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData));
        } catch (err: any) { 
            if (err.name !== 'AbortError') { 
                console.error("Save failed:", err); 
                alert("Failed to save file."); 
            } 
        }
    }, [currentModelId, modelsIndex, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, currentFileHandleRef]);

    const handleSaveAs = useCallback((name: string, description: string) => {
        if (!currentModelId) return;
        const now = new Date().toISOString();
        const newId = generateUUID();
        const modelData = { 
            elements: elementsRef.current, 
            relationships: relationshipsRef.current, 
            documents: documentsRef.current, 
            folders: foldersRef.current, 
            colorSchemes, 
            activeSchemeId, 
            systemPromptConfig, 
            history, 
            slides, 
            mermaidDiagrams 
        };
        const currentHash = computeContentHash(modelData);
        const newMetadata: ModelMetadata = { id: newId, name, description, createdAt: now, updatedAt: now, filename: `${name.replace(/ /g, '_')}.json`, contentHash: currentHash };
        try {
            localStorage.setItem(`${MODEL_DATA_PREFIX}${newId}`, JSON.stringify(modelData));
            setModelsIndex(prev => [...prev, newMetadata]);
            setCurrentModelId(newId);
            setIsSaveAsModalOpen(false);
            currentFileHandleRef.current = null;
        } catch (e) {
            console.error("Save As failed", e);
            alert("Failed to save copy. Local storage might be full.");
        }
    }, [currentModelId, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, currentFileHandleRef]);

    const processImportedData = useCallback((text: string, filename?: string) => {
        try {
            const imported = JSON.parse(text);
            let dataToImport: any = null;
            let nameToUse = 'Imported Model';
            let descToUse = '';
            let existingId: string | null = null;
            let importedHash: string = '';
            
            // Check for standard Tapestry export format (metadata + data envelope)
            if (imported.metadata && imported.data) { 
                dataToImport = imported.data; 
                nameToUse = imported.metadata.name || nameToUse; 
                descToUse = imported.metadata.description || ''; 
                existingId = imported.metadata.id; 
                
                // Ensure critical arrays exist (fix for "Invalid file format" on empty models)
                if (!Array.isArray(dataToImport.elements)) dataToImport.elements = [];
                if (!Array.isArray(dataToImport.relationships)) dataToImport.relationships = [];

                importedHash = computeContentHash(dataToImport); 
            } 
            // Check for raw data dump format (root object is the model data)
            else if (Array.isArray(imported.elements) || Array.isArray(imported.relationships)) { 
                dataToImport = imported; 
                if (!Array.isArray(dataToImport.elements)) dataToImport.elements = [];
                importedHash = computeContentHash(dataToImport); 
            }
            
            if (!dataToImport) { throw new Error('Invalid file format. JSON structure not recognized.'); }
            if (!dataToImport.relationships) dataToImport.relationships = [];
            
            if (existingId) { 
                const localDataStr = localStorage.getItem(`${MODEL_DATA_PREFIX}${existingId}`); 
                if (localDataStr) { 
                    const localIndex = modelsIndex.find(m => m.id === existingId); 
                    if (localIndex) { 
                        const localHash = localIndex.contentHash || computeContentHash(JSON.parse(localDataStr)); 
                        if (localHash !== importedHash) { 
                            setPendingImport({ 
                                localMetadata: localIndex, 
                                diskMetadata: { ...imported.metadata, filename: filename || imported.metadata.filename, contentHash: importedHash, lastDiskHash: importedHash }, 
                                localData: JSON.parse(localDataStr), 
                                diskData: dataToImport 
                            }); 
                            return; 
                        } 
                    } 
                } 
            }
            
            const now = new Date().toISOString();
            const newModelId = existingId || generateUUID();
            if (!existingId) { 
                let finalModelName = nameToUse; 
                let i = 1; 
                while(modelsIndex.some(m => m.name === finalModelName)) { i++; finalModelName = `${nameToUse} ${i}`; } 
                nameToUse = finalModelName; 
            }
            
            const newMetadata: ModelMetadata = { 
                id: newModelId, 
                name: nameToUse, 
                description: descToUse, 
                createdAt: imported.metadata?.createdAt || now, 
                updatedAt: imported.metadata?.updatedAt || now, 
                filename: filename, 
                contentHash: importedHash, 
                lastDiskHash: importedHash 
            };
            
            const newModelData = { 
                elements: dataToImport.elements || [], 
                relationships: dataToImport.relationships || [], 
                documents: dataToImport.documents || [], 
                folders: dataToImport.folders || [], 
                history: dataToImport.history || [], 
                slides: dataToImport.slides || [], 
                mermaidDiagrams: dataToImport.mermaidDiagrams || [], 
                colorSchemes: dataToImport.colorSchemes || DEFAULT_COLOR_SCHEMES, 
                activeSchemeId: dataToImport.activeSchemeId || DEFAULT_COLOR_SCHEMES[0]?.id || null, 
                systemPromptConfig: dataToImport.systemPromptConfig || DEFAULT_SYSTEM_PROMPT_CONFIG, 
            };
            
            loadModelData(newModelData, newModelId, newMetadata);
        } catch (error) { 
            const message = error instanceof Error ? error.message : 'An unknown error occurred.'; 
            alert(`Failed to import file: ${message}`); 
            console.error("Import failed:", error); 
        }
    }, [modelsIndex, loadModelData]);

    const handleImportClick = useCallback(async (fileInputRef: any) => { 
        if (!isInIframe() && 'showOpenFilePicker' in window) { 
            try { 
                const pickerOptions = { types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }], }; 
                const [fileHandle] = await (window as any).showOpenFilePicker(pickerOptions); 
                currentFileHandleRef.current = fileHandle; 
                const file = await fileHandle.getFile(); 
                const text = await file.text(); 
                processImportedData(text, file.name); 
                return; 
            } catch (err: any) { 
                if (err.name !== 'AbortError') { 
                    console.warn("File System Access API failed, falling back to input.", err); 
                } else { 
                    return; 
                } 
            } 
        } 
        if (fileInputRef.current) { 
            fileInputRef.current.value = ''; 
            fileInputRef.current.click(); 
        } 
    }, [processImportedData, currentFileHandleRef]);

    const handleImportInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => { 
        const file = event.target.files?.[0]; 
        if (!file) return; 
        currentFileHandleRef.current = null; 
        const reader = new FileReader(); 
        reader.onload = (e) => { 
            const text = e.target?.result as string; 
            processImportedData(text, file.name); 
        }; 
        reader.readAsText(file); 
    }, [processImportedData, currentFileHandleRef]);

    const handleNewModelClick = useCallback(async () => { 
        if (currentModelId) { 
            const currentMeta = modelsIndex.find(m => m.id === currentModelId); 
            const modelData = { 
                elements: elementsRef.current, 
                relationships: relationshipsRef.current, 
                documents: documentsRef.current, 
                folders: foldersRef.current, 
                colorSchemes, 
                activeSchemeId, 
                systemPromptConfig, 
                history, 
                slides, 
                mermaidDiagrams 
            }; 
            const currentHash = computeContentHash(modelData); 
            const isDirty = currentMeta?.lastDiskHash !== currentHash; 
            const isEmpty = elementsRef.current.length === 0; 
            if (isDirty && !isEmpty) { 
                if (confirm("You have unsaved changes. Do you want to save your current model before creating a new one?")) { 
                    await handleDiskSave(); 
                } 
            } 
        } 
        setIsCreateModelModalOpen(true); 
    }, [currentModelId, modelsIndex, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, handleDiskSave]);

    const hasUnsavedChanges = useMemo(() => {
        const currentMeta = modelsIndex.find(m => m.id === currentModelId);
        if (!currentMeta) return false;
        return currentMeta.contentHash !== currentMeta.lastDiskHash;
    }, [modelsIndex, currentModelId]);

    return {
        modelsIndex,
        currentModelId,
        setCurrentModelId,
        isCreateModelModalOpen,
        setIsCreateModelModalOpen,
        isSaveAsModalOpen,
        setIsSaveAsModalOpen,
        isOpenModelModalOpen,
        setIsOpenModelModalOpen,
        pendingImport,
        setPendingImport,
        isSchemaUpdateModalOpen,
        setIsSchemaUpdateModalOpen,
        schemaUpdateChanges,
        isInitialLoad,
        currentModelName: modelsIndex.find(m => m.id === currentModelId)?.name || 'Loading...',
        hasUnsavedChanges,
        
        // Actions
        handleLoadModel,
        handleCreateModel,
        handleDiskSave,
        handleSaveAs,
        handleImportClick,
        handleImportInputChange,
        handleNewModelClick,
        loadModelData,
        migrateLegacySchemes
    };
};
