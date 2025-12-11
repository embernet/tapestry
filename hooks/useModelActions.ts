
import React, { useMemo } from 'react';
import { Element, Relationship, RelationshipDirection, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateUUID, normalizeTag } from '../utils';

interface UseModelActionsProps {
    elementsRef: React.MutableRefObject<Element[]>;
    setElements: React.Dispatch<React.SetStateAction<Element[]>>;
    relationshipsRef: React.MutableRefObject<Relationship[]>;
    setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
    documentsRef: React.MutableRefObject<TapestryDocument[]>;
    setDocuments: React.Dispatch<React.SetStateAction<TapestryDocument[]>>;
    foldersRef: React.MutableRefObject<TapestryFolder[]>;
    setFolders: React.Dispatch<React.SetStateAction<TapestryFolder[]>>;
    openDocIds: string[];
    setOpenDocIds: React.Dispatch<React.SetStateAction<string[]>>;
    onDeleteElement: (id: string) => void;
}

export const useModelActions = ({
    elementsRef,
    setElements,
    relationshipsRef,
    setRelationships,
    documentsRef,
    setDocuments,
    foldersRef,
    setFolders,
    openDocIds,
    setOpenDocIds,
    onDeleteElement
}: UseModelActionsProps): ModelActions => {
    
    return useMemo(() => {
        const findElementByName = (name: string): Element | undefined => {
            return elementsRef.current.find(e => e.name.toLowerCase() === name.toLowerCase());
        };
        const findDocumentByTitle = (title: string): TapestryDocument | undefined => {
            return documentsRef.current.find(d => d.title.toLowerCase() === title.toLowerCase());
        };

        return {
            addElement: (data) => {
                const now = new Date().toISOString();
                const id = generateUUID();
                
                let x = data.x;
                let y = data.y;

                if (x === undefined || y === undefined) {
                    const count = elementsRef.current.length;
                    const angle = count * 0.5;
                    const radius = 50 + (5 * count);
                    const centerX = window.innerWidth / 2;
                    const centerY = window.innerHeight / 2;
                    x = centerX + radius * Math.cos(angle);
                    y = centerY + radius * Math.sin(angle);
                }

                const newElement: Element = { 
                    id, 
                    name: data.name, 
                    notes: data.notes || '', 
                    tags: (data.tags || []).map(normalizeTag), 
                    attributes: data.attributes || {}, 
                    customLists: data.customLists || {},
                    createdAt: now, 
                    updatedAt: now, 
                    x, 
                    y, 
                    fx: x, 
                    fy: y 
                };
                elementsRef.current = [...elementsRef.current, newElement];
                setElements(prev => [...prev, newElement]);
                return id;
            },
            updateElement: (name, data) => {
                const element = findElementByName(name);
                if (!element) return false;
                
                const updatedElement = { ...element, ...data, updatedAt: new Date().toISOString() };
                
                // Explicitly replace tags if provided to allow reordering or removal
                if (data.tags) { 
                    updatedElement.tags = data.tags.map(normalizeTag); 
                }
                
                elementsRef.current = elementsRef.current.map(e => e.id === element.id ? updatedElement : e);
                setElements(prev => prev.map(e => e.id === element.id ? updatedElement : e));
                return true;
            },
            deleteElement: (name) => {
                const element = findElementByName(name);
                if (!element) return false;
                // Update refs immediately for consistency in batch operations
                elementsRef.current = elementsRef.current.filter(f => f.id !== element.id);
                relationshipsRef.current = relationshipsRef.current.filter(r => r.source !== element.id && r.target !== element.id);
                // Call parent handler for UI state updates (selection clearing etc)
                onDeleteElement(element.id);
                return true;
            },
            addRelationship: (sourceName, targetName, label, directionStr) => {
                const source = findElementByName(sourceName);
                const target = findElementByName(targetName);
                if (!source || !target) return false;
                let direction = RelationshipDirection.To;
                if (directionStr) { if (directionStr.toUpperCase() === 'FROM') direction = RelationshipDirection.From; if (directionStr.toUpperCase() === 'NONE') direction = RelationshipDirection.None; }
                const newRel: Relationship = { id: generateUUID(), source: source.id, target: target.id, label: label, direction: direction, tags: [] };
                relationshipsRef.current = [...relationshipsRef.current, newRel];
                setRelationships(prev => [...prev, newRel]);
                return true;
            },
            deleteRelationship: (sourceName, targetName) => {
                const source = findElementByName(sourceName);
                const target = findElementByName(targetName);
                if (!source || !target) return false;
                relationshipsRef.current = relationshipsRef.current.filter(r => { const isMatch = (r.source === source.id && r.target === target.id) || (r.source === target.id && r.target === source.id); return !isMatch; });
                setRelationships(prev => prev.filter(r => { const isMatch = (r.source === source.id && r.target === target.id) || (r.source === target.id && r.target === source.id); return !isMatch; }));
                return true;
            },
            setElementAttribute: (elementName, key, value) => {
                const element = findElementByName(elementName);
                if (!element) return false;
                const attributes = { ...(element.attributes || {}), [key]: value };
                const updated = { ...element, attributes, updatedAt: new Date().toISOString() };
                elementsRef.current = elementsRef.current.map(e => e.id === element.id ? updated : e);
                setElements(prev => prev.map(e => e.id === element.id ? updated : e));
                return true;
            },
            deleteElementAttribute: (elementName, key) => {
                const element = findElementByName(elementName);
                if (!element) return false;
                const attributes = { ...(element.attributes || {}) };
                delete attributes[key];
                const updated = { ...element, attributes, updatedAt: new Date().toISOString() };
                elementsRef.current = elementsRef.current.map(e => e.id === element.id ? updated : e);
                setElements(prev => prev.map(e => e.id === element.id ? updated : e));
                return true;
            },
            setRelationshipAttribute: (sourceName, targetName, key, value) => {
                const source = findElementByName(sourceName);
                const target = findElementByName(targetName);
                if (!source || !target) return false;
                let relIndex = relationshipsRef.current.findIndex(r => r.source === source.id && r.target === target.id);
                if (relIndex === -1) { relIndex = relationshipsRef.current.findIndex(r => r.source === target.id && r.target === source.id); }
                if (relIndex === -1) return false;
                const rel = relationshipsRef.current[relIndex];
                const attributes = { ...(rel.attributes || {}), [key]: value };
                const updated = { ...rel, attributes };
                relationshipsRef.current = [...relationshipsRef.current];
                relationshipsRef.current[relIndex] = updated;
                setRelationships(prev => prev.map(r => r.id === rel.id ? updated : r));
                return true;
            },
            deleteRelationshipAttribute: (sourceName, targetName, key) => {
                const source = findElementByName(sourceName);
                const target = findElementByName(targetName);
                if (!source || !target) return false;
                let relIndex = relationshipsRef.current.findIndex(r => r.source === source.id && r.target === target.id);
                if (relIndex === -1) { relIndex = relationshipsRef.current.findIndex(r => r.source === target.id && r.target === source.id); }
                if (relIndex === -1) return false;
                const rel = relationshipsRef.current[relIndex];
                const attributes = { ...(rel.attributes || {}) };
                delete attributes[key];
                const updated = { ...rel, attributes };
                relationshipsRef.current = [...relationshipsRef.current];
                relationshipsRef.current[relIndex] = updated;
                setRelationships(prev => prev.map(r => r.id === rel.id ? updated : r));
                return true;
            },
            readDocument: (title) => { const doc = findDocumentByTitle(title); return doc ? doc.content : null; },
            createDocument: (title, content = '', type = 'text', data = null) => { 
                const now = new Date().toISOString(); 
                const newDoc: TapestryDocument = { id: generateUUID(), title, content: content || '', folderId: null, createdAt: now, updatedAt: now, type, data }; 
                documentsRef.current = [...documentsRef.current, newDoc]; 
                setDocuments(prev => [...prev, newDoc]); 
                if (!openDocIds.includes(newDoc.id)) { setOpenDocIds(prev => [...prev, newDoc.id]); } 
                return newDoc.id; 
            },
            updateDocument: (title, content, mode) => { 
                const doc = findDocumentByTitle(title); 
                if (!doc) return false; 
                
                const safeContent = content || '';
                let newContent = safeContent;
                
                // If replacing, we just use safeContent.
                // If appending/prepending, we need to be careful about empty existing content.
                if (mode === 'append') { 
                    newContent = doc.content ? `${doc.content}\n\n${safeContent}` : safeContent; 
                } else if (mode === 'prepend') {
                    newContent = doc.content ? `${safeContent}\n\n${doc.content}` : safeContent;
                }
                
                const updatedDoc = { ...doc, content: newContent, updatedAt: new Date().toISOString() }; 
                documentsRef.current = documentsRef.current.map(d => d.id === doc.id ? updatedDoc : d); 
                setDocuments(prev => prev.map(d => d.id === doc.id ? updatedDoc : d)); 
                return true; 
            },
            createFolder: (name, parentId) => {
                const id = generateUUID();
                const newFolder: TapestryFolder = { id, name, parentId: parentId || null, createdAt: new Date().toISOString() };
                foldersRef.current = [...foldersRef.current, newFolder];
                setFolders(prev => [...prev, newFolder]);
                return id;
            },
            moveDocument: (docId, folderId) => {
                const doc = documentsRef.current.find(d => d.id === docId);
                if (!doc) return false;
                const updatedDoc = { ...doc, folderId, updatedAt: new Date().toISOString() };
                documentsRef.current = documentsRef.current.map(d => d.id === docId ? updatedDoc : d);
                setDocuments(prev => prev.map(d => d.id === docId ? updatedDoc : d));
                return true;
            }
        };
    }, [onDeleteElement, openDocIds]); // Dependencies
};
