
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ModelMetadata, ColorScheme, SystemPromptConfig, Element, Relationship, TapestryDocument, TapestryFolder, HistoryEntry, StorySlide, MermaidDiagram, DateFilterState, PanelLayout, Script, GraphView, KanbanBoard } from '../types';
import { DEFAULT_COLOR_SCHEMES, DEFAULT_SYSTEM_PROMPT_CONFIG, DEFAULT_TOOL_PROMPTS, CORE_TOOL_IDS } from '../constants';
import { generateUUID, computeContentHash, isInIframe, createDefaultView } from '../utils';

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
    setScripts: React.Dispatch<React.SetStateAction<Script[]>>;
    setKanbanBoards: React.Dispatch<React.SetStateAction<KanbanBoard[]>>;
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

    // View State Setters
    setViews: React.Dispatch<React.SetStateAction<GraphView[]>>;
    setActiveViewId: React.Dispatch<React.SetStateAction<string>>;

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
    scripts: Script[];
    kanbanBoards: KanbanBoard[];
    views: GraphView[];
    activeViewId: string;

    // GitHub Integration
    githubToken?: string;

    // State Values (Required for change detection)
    elements: Element[];
    relationships: Relationship[];
    documents: TapestryDocument[];
    folders: TapestryFolder[];
}

export const usePersistence = ({
    setElements, setRelationships, setDocuments, setFolders, setHistory, setSlides, setMermaidDiagrams, setScripts, setKanbanBoards,
    setColorSchemes, setActiveSchemeId, setSystemPromptConfig, setOpenDocIds, setDetachedHistoryIds,
    setPanelLayouts, setAnalysisHighlights, setAnalysisFilterState, setMultiSelection, setSelectedElementId,
    setTagFilter, setDateFilter, currentFileHandleRef, setViews, setActiveViewId,
    elementsRef, relationshipsRef, documentsRef, foldersRef,
    colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, scripts, kanbanBoards, views, activeViewId,
    githubToken,
    elements, relationships, documents, folders
}: UsePersistenceProps) => {

    const [modelsIndex, setModelsIndex] = useState<ModelMetadata[]>([]);
    const [currentModelId, setCurrentModelId] = useState<string | null>(null);
    const [isCreateModelModalOpen, setIsCreateModelModalOpen] = useState(false);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [isOpenModelModalOpen, setIsOpenModelModalOpen] = useState(false);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);

    const [pendingImport, setPendingImport] = useState<{ localMetadata: ModelMetadata, diskMetadata: ModelMetadata, localData: any, diskData: any } | null>(null);
    const [pendingUnsavedAction, setPendingUnsavedAction] = useState<'exit' | 'createNew' | null>(null);

    const [schemaUpdateChanges, setSchemaUpdateChanges] = useState<string[]>([]);
    const [isSchemaUpdateModalOpen, setIsSchemaUpdateModalOpen] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

    const safeSetItem = useCallback((key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
            setIsQuotaExceeded(false); // Clear error if successful
        } catch (e: any) {
            if (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882) {
                console.warn("LocalStorage Quota Exceeded. Attempting to purge old models...");

                // Identify candidates for purging (oldest first, excluding current)
                const candidates = modelsIndex
                    .filter(m => m.id !== currentModelId)
                    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

                let saved = false;
                const deletedIds: string[] = [];

                for (const candidate of candidates) {
                    try {
                        // Delete model data
                        localStorage.removeItem(`${MODEL_DATA_PREFIX}${candidate.id}`);
                        deletedIds.push(candidate.id);

                        // Try saving again
                        localStorage.setItem(key, value);
                        saved = true;
                        console.log(`Purged model ${candidate.id} (${candidate.name}) to free space.`);
                        break;
                    } catch (retryError) {
                        // Still full, continue to next candidate
                        continue;
                    }
                }

                if (deletedIds.length > 0) {
                    // Update index state to reflect deletions
                    setModelsIndex(prev => prev.filter(m => !deletedIds.includes(m.id)));
                }

                if (saved) {
                    setIsQuotaExceeded(false);
                } else {
                    console.error("LocalStorage Quota Exceeded: Auto-purge failed to free enough space.");
                    setIsQuotaExceeded(true);
                }
            } else {
                throw e;
            }
        }
    }, [modelsIndex, currentModelId]);

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

            // Fix Project tag color in General schema (Migration for v0.7.0 update)
            if (s.id === 'scheme-general' && s.tagColors['Project'] === '#7c3aed') {
                s.tagColors['Project'] = '#7dd3fc'; // sky-300
                changes.push("Updated 'Project' tag color to Sky Blue.");
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
        setMermaidDiagrams(data.mermaidDiagrams || []);
        setScripts(data.scripts || []);

        // Kanban Boards & Migration
        if (data.kanbanBoards && Array.isArray(data.kanbanBoards) && data.kanbanBoards.length > 0) {
            setKanbanBoards(data.kanbanBoards);
        } else {
            // Migration: Create default board for legacy data
            const now = new Date().toISOString();
            const defaultBoard: KanbanBoard = {
                id: generateUUID(),
                name: "Default Board",
                columns: ['To Do', 'Doing', 'Blocked', 'Done', 'Not Doing'],
                attributeKey: "Status", // Legacy attribute
                createdAt: now,
                updatedAt: now
            };
            setKanbanBoards([defaultBoard]);
        }

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
            // Deep merge tool prompts to ensure new defaults appear even if old config exists
            const mergedPrompts = { ...DEFAULT_TOOL_PROMPTS, ...(data.systemPromptConfig.toolPrompts || {}) };
            const loadedEnabledTools = data.systemPromptConfig.enabledTools || [];
            const mergedEnabledTools = Array.from(new Set([...loadedEnabledTools, ...CORE_TOOL_IDS]));

            setSystemPromptConfig({
                ...DEFAULT_SYSTEM_PROMPT_CONFIG,
                ...data.systemPromptConfig,
                enabledTools: mergedEnabledTools,
                toolPrompts: mergedPrompts
            });
        } else {
            setSystemPromptConfig(DEFAULT_SYSTEM_PROMPT_CONFIG);
        }

        // Initialize Views
        if (data.views && Array.isArray(data.views) && data.views.length > 0) {
            setViews(data.views);
            setActiveViewId(data.activeViewId || data.views[0].id);
        } else {
            // Create Default View
            const defaultView = createDefaultView();
            setViews([defaultView]);
            setActiveViewId(defaultView.id);
        }

        setCurrentModelId(modelId);
        setCurrentModelId(modelId);
        safeSetItem(LAST_OPENED_MODEL_ID_KEY, modelId);
        setIsOpenModelModalOpen(false);
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
            safeSetItem(MODELS_INDEX_KEY, JSON.stringify(modelsIndex));
        }
    }, [modelsIndex, isInitialLoad, safeSetItem]);

    // Auto-save current model content
    useEffect(() => {

        if (currentModelId && !isInitialLoad) {
            const modelData = {
                elements,
                relationships,
                documents,
                folders,
                colorSchemes,
                activeSchemeId,
                systemPromptConfig,
                history,
                slides,
                mermaidDiagrams,
                scripts,
                kanbanBoards,
                views,
                activeViewId
            };
            const currentContentHash = computeContentHash(modelData);
            const currentMeta = modelsIndex.find(m => m.id === currentModelId);

            if (!currentMeta || currentMeta.contentHash !== currentContentHash) {
                safeSetItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData));
                setModelsIndex(prevIndex => {
                    const now = new Date().toISOString();
                    return prevIndex.map(m => m.id === currentModelId ? { ...m, updatedAt: now, contentHash: currentContentHash } : m);
                });
            }
        }
    }, [elements, relationships, documents, folders, colorSchemes, activeSchemeId, currentModelId, isInitialLoad, modelsIndex, systemPromptConfig, history, slides, mermaidDiagrams, scripts, kanbanBoards, views, activeViewId, safeSetItem]);

    const handleCreateModel = useCallback((name: string, description: string) => {
        const now = new Date().toISOString();
        const defaultView = createDefaultView();
        const newModelData = {
            elements: [], relationships: [], documents: [], folders: [],
            colorSchemes: DEFAULT_COLOR_SCHEMES, activeSchemeId: DEFAULT_COLOR_SCHEMES[0]?.id || null,
            systemPromptConfig: DEFAULT_SYSTEM_PROMPT_CONFIG, history: [], slides: [],
            mermaidDiagrams: [], scripts: [], kanbanBoards: [],
            views: [defaultView], activeViewId: defaultView.id
        };
        const initialHash = computeContentHash(newModelData);
        const newModel: ModelMetadata = { id: generateUUID(), name, description, createdAt: now, updatedAt: now, filename: `${name.replace(/ /g, '_')}.json`, contentHash: initialHash, };
        setModelsIndex(prevIndex => [...prevIndex, newModel]);
        safeSetItem(`${MODEL_DATA_PREFIX}${newModel.id}`, JSON.stringify(newModelData));
        currentFileHandleRef.current = null;
        handleLoadModel(newModel.id);
        setIsCreateModelModalOpen(false);
    }, [handleLoadModel, currentFileHandleRef, safeSetItem]);

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
            mermaidDiagrams,
            scripts,
            kanbanBoards,
            views,
            activeViewId
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
                const options = { suggestedName: updatedMetadata.filename, types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] }, }], };
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
            safeSetItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData));
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Save failed:", err);
                alert("Failed to save file.");
            }
        }
    }, [currentModelId, modelsIndex, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, scripts, kanbanBoards, views, activeViewId, currentFileHandleRef, safeSetItem]);

    const handleSaveToGist = useCallback(async () => {
        if (!githubToken) {
            alert("Please configure your GitHub Token in Settings > General first.");
            return;
        }
        if (!currentModelId) {
            alert("No active model to save.");
            return;
        }

        const modelMetadata = modelsIndex.find(m => m.id === currentModelId);
        if (!modelMetadata) return;

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
            mermaidDiagrams,
            scripts,
            kanbanBoards,
            views,
            activeViewId
        };

        // Update metadata for export
        const currentHash = computeContentHash(modelData);
        const updatedMetadata = {
            ...modelMetadata,
            updatedAt: now,
            filename: modelMetadata.filename || `${modelMetadata.name.replace(/ /g, '_')}.json`,
            contentHash: currentHash
        };

        const exportData = { metadata: updatedMetadata, data: modelData };
        const jsonString = JSON.stringify(exportData, null, 2);
        const filename = updatedMetadata.filename || "tapestry_model.json";

        const payload = {
            description: `Tapestry Studio Model: ${modelMetadata.name}`,
            public: false,
            files: {
                [filename]: {
                    content: jsonString
                }
            }
        };

        try {
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'GitHub API error');
            }

            const data = await response.json();
            const gistUrl = data.html_url;

            // Open the new gist
            window.open(gistUrl, '_blank');
            alert("Successfully saved to GitHub Gist!");

            // Sync local index
            setModelsIndex(prev => prev.map(m => m.id === currentModelId ? updatedMetadata : m));
            safeSetItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData));

        } catch (e: any) {
            console.error("Gist Save Error", e);
            alert(`Failed to save to GitHub: ${e.message}`);
        }
    }, [githubToken, currentModelId, modelsIndex, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, scripts, kanbanBoards, views, activeViewId, safeSetItem]);


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
            mermaidDiagrams,
            scripts,
            kanbanBoards,
            views,
            activeViewId
        };
        const currentHash = computeContentHash(modelData);
        const newMetadata: ModelMetadata = { id: newId, name, description, createdAt: now, updatedAt: now, filename: `${name.replace(/ /g, '_')}.json`, contentHash: currentHash };
        try {
            safeSetItem(`${MODEL_DATA_PREFIX}${newId}`, JSON.stringify(modelData));
            setModelsIndex(prev => [...prev, newMetadata]);
            setCurrentModelId(newId);
            setIsSaveAsModalOpen(false);
            currentFileHandleRef.current = null;
        } catch (e) {
            console.error("Save As failed", e);
            alert("Failed to save copy. Local storage might be full.");
        }
    }, [currentModelId, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, scripts, kanbanBoards, views, activeViewId, currentFileHandleRef, safeSetItem]);

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
                while (modelsIndex.some(m => m.name === finalModelName)) { i++; finalModelName = `${nameToUse} ${i}`; }
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
                scripts: dataToImport.scripts || [],
                kanbanBoards: dataToImport.kanbanBoards || [],
                colorSchemes: dataToImport.colorSchemes || DEFAULT_COLOR_SCHEMES,
                activeSchemeId: dataToImport.activeSchemeId || DEFAULT_COLOR_SCHEMES[0]?.id || null,
                systemPromptConfig: dataToImport.systemPromptConfig || DEFAULT_SYSTEM_PROMPT_CONFIG,
                views: dataToImport.views || [],
                activeViewId: dataToImport.activeViewId || (dataToImport.views && dataToImport.views.length > 0 ? dataToImport.views[0].id : null)
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
                mermaidDiagrams,
                scripts,
                kanbanBoards,
                views,
                activeViewId
            };
            const currentHash = computeContentHash(modelData);
            const isDirty = currentMeta?.lastDiskHash !== currentHash;
            const isEmpty = elementsRef.current.length === 0;

            if (isDirty && !isEmpty) {
                // Instead of window.confirm, we use the modal
                setPendingUnsavedAction('createNew');
                setIsExitModalOpen(true);
                return;
            }
        }
        // If clean or empty, proceed directly
        setIsCreateModelModalOpen(true);
    }, [currentModelId, modelsIndex, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, scripts, kanbanBoards, views, activeViewId]);

    const handleDeleteModel = useCallback((modelId: string) => {
        // Remove data
        localStorage.removeItem(`${MODEL_DATA_PREFIX}${modelId}`);

        // Update Index
        const newIndex = modelsIndex.filter(m => m.id !== modelId);
        setModelsIndex(newIndex);
        safeSetItem(MODELS_INDEX_KEY, JSON.stringify(newIndex));

        // If current model was deleted, clear current ID (optional, simple safety)
        if (currentModelId === modelId) {
            setCurrentModelId(null);
            // We might want to clear the canvas or load a default state, but strictly 
            // speaking if they are in the menu, they haven't "loaded" it yet? 
            // Or they might be deleting the one they are looking at.
            // Let's just clear the ID for now.
        }
    }, [modelsIndex, currentModelId]);

    const handleDeleteAllModels = useCallback(() => {
        // Remove all data
        modelsIndex.forEach(model => {
            localStorage.removeItem(`${MODEL_DATA_PREFIX}${model.id}`);
        });

        // Clear Index
        setModelsIndex([]);
        localStorage.removeItem(MODELS_INDEX_KEY);

        // Clear current ID if it was one of them (which it likely is if it's recovered)
        // If the user is currently "in" a model that was just recovered, deleting all "recovered" versions from disk
        // doesn't typically unload the current in-memory state, but for "Recovered Models" list, we usually
        // aren't considering the *active* unsaved work as "in the list" unless we are reloading page.
        // But to be safe, we just clear the list.
        // We don't force unload the current canvas.
    }, [modelsIndex]);

    const hasUnsavedChanges = useMemo(() => {
        const currentMeta = modelsIndex.find(m => m.id === currentModelId);
        if (!currentMeta) return false;
        return currentMeta.contentHash !== currentMeta.lastDiskHash;
    }, [modelsIndex, currentModelId]);

    // Warn on window close if unsaved
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = ''; // Required for Chrome
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleExitRequest = useCallback(() => {
        if (hasUnsavedChanges) {
            setPendingUnsavedAction('exit');
            setIsExitModalOpen(true);
        } else {
            setCurrentModelId(null);
        }
    }, [hasUnsavedChanges]);

    const handleExitSave = useCallback(async () => {
        await handleDiskSave();
        setIsExitModalOpen(false);

        if (pendingUnsavedAction === 'createNew') {
            setIsCreateModelModalOpen(true);
        } else {
            // Default to exit/close behavior
            setCurrentModelId(null);
        }
        setPendingUnsavedAction(null);
    }, [handleDiskSave, pendingUnsavedAction]);

    const handleExitDiscard = useCallback(() => {
        setIsExitModalOpen(false);

        if (pendingUnsavedAction === 'createNew') {
            setIsCreateModelModalOpen(true);
        } else {
            // Default to exit/close behavior
            setCurrentModelId(null);
        }
        setPendingUnsavedAction(null);
    }, [pendingUnsavedAction]);

    const handleExitCancel = useCallback(() => {
        setIsExitModalOpen(false);
        setPendingUnsavedAction(null);
    }, []);

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
        isExitModalOpen,
        setIsExitModalOpen,
        pendingImport,
        setPendingImport,
        isSchemaUpdateModalOpen,
        setIsSchemaUpdateModalOpen,
        schemaUpdateChanges,
        isInitialLoad,
        currentModelName: modelsIndex.find(m => m.id === currentModelId)?.name || 'Loading...',
        hasUnsavedChanges,
        isQuotaExceeded,
        setIsQuotaExceeded,
        pendingUnsavedAction,

        // Actions
        handleLoadModel,
        handleCreateModel,
        handleDiskSave,
        handleSaveToGist,
        handleSaveAs,
        handleImportClick,
        handleImportInputChange,
        handleNewModelClick,
        handleDeleteModel,
        handleDeleteAllModels,
        handleExitRequest,
        handleExitSave,
        handleExitDiscard,
        handleExitCancel,
        loadModelData,
        handleOverwriteLocal: useCallback((diskData: any, diskMetadata: ModelMetadata) => {
            safeSetItem(`${MODEL_DATA_PREFIX}${diskMetadata.id}`, JSON.stringify(diskData));
            loadModelData(diskData, diskMetadata.id, diskMetadata);
        }, [safeSetItem, loadModelData]),
        migrateLegacySchemes,
        kanbanBoards,
        setKanbanBoards
    };
};
