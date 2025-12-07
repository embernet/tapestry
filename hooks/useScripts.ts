
import { useState, useCallback } from 'react';
import { Script } from '../types';
import { generateUUID } from '../utils';
import { EXAMPLE_SCRIPTS } from '../constants';

export const useScripts = () => {
    const [scripts, setScripts] = useState<Script[]>([]);

    // Initialize with examples if empty on first load (managed by persistence loading mostly)
    // But we can offer a method to load examples
    const loadExampleScripts = useCallback(() => {
        const examples = EXAMPLE_SCRIPTS.map(ex => ({
            id: generateUUID(),
            name: ex.name,
            code: ex.code,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
        setScripts(prev => [...prev, ...examples]);
    }, []);

    const createScript = useCallback((name: string, code: string = '') => {
        const newScript: Script = {
            id: generateUUID(),
            name,
            code,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setScripts(prev => [...prev, newScript]);
        return newScript.id;
    }, []);

    const updateScript = useCallback((updatedScript: Script) => {
        setScripts(prev => prev.map(s => s.id === updatedScript.id ? updatedScript : s));
    }, []);

    const deleteScript = useCallback((id: string) => {
        setScripts(prev => prev.filter(s => s.id !== id));
    }, []);

    return {
        scripts,
        setScripts,
        createScript,
        updateScript,
        deleteScript,
        loadExampleScripts
    };
};
