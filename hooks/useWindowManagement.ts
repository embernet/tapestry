
import { useState, useCallback } from 'react';
import { PanelLayout } from '../types';

export const useWindowManagement = () => {
    const [panelLayouts, setPanelLayouts] = useState<Record<string, PanelLayout>>({});
    const [panelZIndex, setPanelZIndex] = useState(100);
    const [activeDockedPanelId, setActiveDockedPanelId] = useState<string | null>(null);

    const openPanelAt = useCallback((id: string, defaultLayout: Partial<PanelLayout>) => {
        setPanelZIndex(prev => {
            const nextZ = prev + 1;
            setPanelLayouts(current => {
                if (!current[id]) {
                    // Only set default if not already present
                    return {
                        ...current,
                        [id]: {
                            x: 100, y: 100, w: 400, h: 500,
                            isFloating: true,
                            ...defaultLayout,
                            zIndex: nextZ
                        }
                    };
                } else {
                    // Just update Z if already exists
                    return {
                        ...current,
                        [id]: { ...current[id], zIndex: nextZ }
                    };
                }
            });
            return nextZ;
        });
    }, []);

    const bringToFront = useCallback((id: string) => {
        setPanelZIndex(prev => {
            const nextZ = prev + 1;
            setPanelLayouts(current => ({
                ...current,
                [id]: { ...current[id], zIndex: nextZ }
            }));
            return nextZ;
        });
    }, []);

    return {
        panelLayouts,
        setPanelLayouts,
        panelZIndex,
        setPanelZIndex,
        activeDockedPanelId,
        setActiveDockedPanelId,
        openPanelAt,
        bringToFront
    };
};
