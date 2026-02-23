
import { useState, useCallback } from 'react';
import { Relationship, SimulationNodeState } from '../types';

interface UseImpactAnalysisProps {
    relationships: Relationship[];
}

export const useImpactAnalysis = ({ relationships }: UseImpactAnalysisProps) => {
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    const [simulationState, setSimulationState] = useState<Record<string, SimulationNodeState>>({});

    const runImpactSimulation = useCallback((startNodeId: string) => {
        const newSimState: Record<string, SimulationNodeState> = {};
        const queue: { id: string, state: SimulationNodeState }[] = [];
        
        // Initial perturbation: If already increased, decrease it, otherwise increase
        newSimState[startNodeId] = simulationState[startNodeId] === 'increased' ? 'decreased' : 'increased';
        queue.push({ id: startNodeId, state: newSimState[startNodeId] });
        
        const visited = new Set<string>();
        visited.add(startNodeId);

        // Positive/Negative keywords
        const isPositive = (label: string) => ['causes', 'increases', 'promotes', 'leads to', 'produces', 'enables', 'enhances', 'amplifies', 'reinforces'].some(k => label.toLowerCase().includes(k));
        const isNegative = (label: string) => ['inhibits', 'decreases', 'prevents', 'reduces', 'stops', 'block', 'counteracts'].some(k => label.toLowerCase().includes(k));

        while (queue.length > 0) {
            const { id, state } = queue.shift()!;
            
            const outgoing = relationships.filter(r => r.source === id);
            
            outgoing.forEach(rel => {
                const targetId = rel.target as string;
                if (visited.has(targetId)) return;
                
                let nextState: SimulationNodeState = 'neutral';
                
                if (isPositive(rel.label)) {
                    // Positive correlation: Same state
                    nextState = state;
                } else if (isNegative(rel.label)) {
                    // Negative correlation: Inverse state
                    nextState = state === 'increased' ? 'decreased' : 'increased';
                }
                
                if (nextState !== 'neutral') {
                    newSimState[targetId] = nextState;
                    visited.add(targetId);
                    queue.push({ id: targetId, state: nextState });
                }
            });
        }
        setSimulationState(newSimState);
    }, [relationships, simulationState]);

    return {
        isSimulationMode,
        setIsSimulationMode,
        simulationState,
        setSimulationState,
        runImpactSimulation
    };
};
