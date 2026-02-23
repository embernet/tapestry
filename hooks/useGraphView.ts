
import { useMemo, useCallback } from 'react';
import { Element, Relationship, GraphView } from '../types';

interface UseGraphViewProps {
    elements: Element[];
    relationships: Relationship[];
    activeView: GraphView | undefined;
    panelState: {
        isSunburstPanelOpen: boolean;
        sunburstState: { active: boolean, centerId: string | null, hops: number };
    };
    analysisFilterState: { mode: 'hide' | 'hide_others' | 'none', ids: Set<string> } | undefined;
}

export const useGraphView = ({
    elements,
    relationships,
    activeView,
    panelState,
    analysisFilterState
}: UseGraphViewProps) => {

    // --- Helper to get neighborhood (Recursively find connected nodes) ---
    const getNeighborhoodNodes = useCallback((centerId: string, depth: number) => {
        const visibleIds = new Set<string>([centerId]);
        let currentLayer = [centerId];
        
        for (let i = 0; i < depth; i++) {
            const nextLayer: string[] = [];
            currentLayer.forEach(nodeId => {
                relationships.forEach(rel => {
                    if (rel.source === nodeId && !visibleIds.has(rel.target as string)) {
                        visibleIds.add(rel.target as string);
                        nextLayer.push(rel.target as string);
                    }
                    if (rel.target === nodeId && !visibleIds.has(rel.source as string)) {
                        visibleIds.add(rel.source as string);
                        nextLayer.push(rel.source as string);
                    }
                });
            });
            currentLayer = nextLayer;
        }
        return visibleIds;
    }, [relationships]);

    // --- Core Filtering Logic ---
    const filteredElements = useMemo(() => {
        if (!activeView) return elements;

        // 1. Get View Config
        const { explicitInclusions, explicitExclusions, filters, nodePositions } = activeView;
        const { tags, date, nodeFilter: viewNodeFilter } = filters;
        const inclusionSet = new Set(explicitInclusions);
        const exclusionSet = new Set(explicitExclusions);

        // Pre-calculate View Neighborhood if active
        let neighborhoodSet: Set<string> | null = null;
        if (viewNodeFilter.active && viewNodeFilter.centerId) {
            neighborhoodSet = getNeighborhoodNodes(viewNodeFilter.centerId, viewNodeFilter.hops);
        }

        // 2. Base View Filtering
        let viewNodes = elements.filter(element => {
            // A. Explicit Exclusion takes precedence over everything
            if (exclusionSet.has(element.id)) return false;

            // B. Explicit Inclusion bypasses attribute filters
            if (inclusionSet.has(element.id)) return true;

            // C. Neighborhood Filter (If active, node MUST be in neighborhood unless explicitly included)
            if (neighborhoodSet && !neighborhoodSet.has(element.id)) return false;

            // D. Attribute Filters (Tags)
            const { included: includedTags, excluded: excludedTags } = tags;
            const includedTagSet = new Set(includedTags);
            const excludedTagSet = new Set(excludedTags);

            // Exclude if matches any excluded tag
            if (element.tags.some(tag => excludedTagSet.has(tag))) return false;

            // Include Logic: If includedTagSet has content, node must have at least one.
            const hasIncludedTag = element.tags.some(tag => includedTagSet.has(tag));
            if (includedTagSet.size > 0 && !hasIncludedTag) return false;

            // E. Date Filters
            const createdDate = element.createdAt.substring(0, 10);
            const updatedDate = element.updatedAt.substring(0, 10);
            if (date.createdAfter && createdDate < date.createdAfter) return false;
            if (date.createdBefore && createdDate > date.createdBefore) return false;
            if (date.updatedAfter && updatedDate < date.updatedAfter) return false;
            if (date.updatedBefore && updatedDate > date.updatedBefore) return false;

            return true;
        });

        // 3. Transient Tool Filtering (Applied ON TOP of the View)

        // A. Sunburst Tool (Transient Overlay)
        if (panelState.isSunburstPanelOpen && panelState.sunburstState.active && panelState.sunburstState.centerId) {
            const visibleIds = getNeighborhoodNodes(panelState.sunburstState.centerId, panelState.sunburstState.hops);
            viewNodes = viewNodes.filter(e => visibleIds.has(e.id));
        }

        // B. Analysis Filter (Hide/Hide Others from NetworkAnalysisPanel)
        if (analysisFilterState && analysisFilterState.mode === 'hide') {
            viewNodes = viewNodes.filter(e => !analysisFilterState.ids.has(e.id));
        } else if (analysisFilterState && analysisFilterState.mode === 'hide_others') {
            viewNodes = viewNodes.filter(e => analysisFilterState.ids.has(e.id));
        }

        // 4. Position Overrides
        // If the view has specific positions stored for nodes, use them.
        // Otherwise, fall back to the global position on the element.
        if (nodePositions) {
            return viewNodes.map(el => {
                const override = nodePositions[el.id];
                if (override) {
                    return {
                        ...el,
                        x: override.x,
                        y: override.y,
                        fx: override.x, // Fix position in D3 to prevent drift
                        fy: override.y
                    };
                }
                return el;
            });
        }

        return viewNodes;

    }, [elements, activeView, analysisFilterState, panelState.isSunburstPanelOpen, panelState.sunburstState, getNeighborhoodNodes]);

    const filteredRelationships = useMemo(() => {
        const visibleElementIds = new Set(filteredElements.map(f => f.id));
        return relationships.filter(rel => 
            visibleElementIds.has(rel.source as string) && 
            visibleElementIds.has(rel.target as string)
        );
    }, [relationships, filteredElements]);

    return { filteredElements, filteredRelationships, getNeighborhoodNodes };
};
