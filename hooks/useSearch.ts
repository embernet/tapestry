
import React, { useState, useEffect, useCallback } from 'react';

export const useSearch = (
    graphCanvasRef: React.RefObject<any>,
    setAnalysisHighlights: React.Dispatch<React.SetStateAction<Map<string, string>>>,
    activeTool: string | null
) => {
    const [searchInitialCamera, setSearchInitialCamera] = useState<{x: number, y: number, k: number} | null>(null);

    // Initial camera capture
    useEffect(() => {
        if (activeTool === 'search' && graphCanvasRef.current) {
            setSearchInitialCamera(graphCanvasRef.current.getCamera());
        }
    }, [activeTool, graphCanvasRef]);
  
    const handleSearch = useCallback((matchIds: Set<string>) => {
        const map = new Map<string, string>();
        matchIds.forEach(id => map.set(id, '#00ff00')); 
        setAnalysisHighlights(map);
    }, [setAnalysisHighlights]);
  
    const handleSearchReset = useCallback(() => {
        if (searchInitialCamera && graphCanvasRef.current) {
            graphCanvasRef.current.setCamera(searchInitialCamera.x, searchInitialCamera.y, searchInitialCamera.k);
        }
        setAnalysisHighlights(new Map());
    }, [searchInitialCamera, graphCanvasRef, setAnalysisHighlights]);

    return {
        handleSearch,
        handleSearchReset,
        searchInitialCamera
    };
};
