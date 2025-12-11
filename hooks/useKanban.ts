
import React, { useState, useCallback } from 'react';
import { Element } from '../types';

export const useKanban = (
    setElements: React.Dispatch<React.SetStateAction<Element[]>>
) => {
    const [notification, setNotification] = useState<{ x: number; y: number; message: string } | null>(null);

    const handleAddToKanban = useCallback((ids: string[], coords: {x: number, y: number}, elements: Element[]) => {
        const attributeKey = 'Status';
        const defaultColumn = 'To Do';
        const targetIds = new Set(ids);
  
        let added = 0;
        let existing = 0;
  
        const updates: {id: string, val: string}[] = [];
  
        elements.forEach(el => {
            if (targetIds.has(el.id)) {
                if (el.attributes && el.attributes[attributeKey]) {
                    existing++;
                } else {
                    added++;
                    updates.push({id: el.id, val: defaultColumn});
                }
            }
        });
  
        if (added > 0) {
             setElements(prev => prev.map(el => {
                 const update = updates.find(u => u.id === el.id);
                 if (update) {
                     return {
                         ...el,
                         attributes: { ...el.attributes, [attributeKey]: update.val },
                         updatedAt: new Date().toISOString()
                     };
                 }
                 return el;
             }));
        }
  
        let msg = '';
        if (added > 0) {
            msg = `Added ${added} task${added > 1 ? 's' : ''}`;
            if (existing > 0) msg += `. ${existing} already on board`;
        } else if (existing > 0) {
            msg = `${existing} task${existing > 1 ? 's' : ''} already on board`;
        } else {
            msg = "No tasks added";
        }
  
        setNotification({ x: coords.x, y: coords.y, message: msg });
        setTimeout(() => setNotification(null), 3000);
  
    }, [setElements]);

    return {
        notification,
        setNotification,
        handleAddToKanban
    };
};
