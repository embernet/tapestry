
import { useMemo } from 'react';
import { ModelActions } from '../types';
import { AUTO_GENERATED_TAG } from '../constants';
import { normalizeTag } from '../utils';

export const useAutomatedActions = (baseActions: ModelActions): ModelActions => {
    return useMemo(() => {
        return {
            ...baseActions,
            addElement: (data) => {
                // Ensure tags array exists
                const tags = data.tags ? [...data.tags] : [];
                
                // Add the auto-generated tag if not present
                const normTag = normalizeTag(AUTO_GENERATED_TAG);
                if (!tags.some(t => normalizeTag(t) === normTag)) {
                    tags.push(AUTO_GENERATED_TAG);
                }

                // Call original action with modified data
                return baseActions.addElement({
                    ...data,
                    tags
                });
            }
            // All other methods pass through directly
        };
    }, [baseActions]);
};
