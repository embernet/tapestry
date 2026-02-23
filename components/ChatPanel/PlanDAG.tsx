import React from 'react';
import { PlanStep } from '../../types';

interface PlanDAGProps {
    plan: PlanStep[];
    activePlan: PlanStep[] | null;
    planStatus: 'proposed' | 'executing' | 'completed' | 'paused';
    onDiscard: () => void;
    onExecute: () => void;
    isDarkMode: boolean;
}

// SVG DAG Visualizer
const DAGVisualizer = ({ plan, status }: { plan: PlanStep[], status: string }) => {
    // Helper to simplify ID for display
    const formatId = (id: string) => id.replace(/^step-?|^id-?/, '');

    // Simple layout logic: calculate layers based on dependencies
    const layers: Record<string, number> = {};
    const getLayer = (id: string): number => {
        if (layers[id] !== undefined) return layers[id];
        const step = plan.find(s => s.id === id);
        if (!step || step.dependencies.length === 0) {
            layers[id] = 0;
            return 0;
        }
        const depth = Math.max(...step.dependencies.map(d => getLayer(d))) + 1;
        layers[id] = depth;
        return depth;
    };

    plan.forEach(s => getLayer(s.id));
    const maxLayer = Math.max(0, ...Object.values(layers));

    // Group by layer
    const layerGroups: PlanStep[][] = Array(maxLayer + 1).fill([]).map(() => []);
    plan.forEach(s => {
        layerGroups[layers[s.id]].push(s);
    });

    // Calculate positions
    const nodeRadius = 14;
    const layerWidth = 60;
    const rowHeight = 50;
    const positions: Record<string, { x: number, y: number }> = {};

    let maxY = 0;
    layerGroups.forEach((group, lIndex) => {
        const x = 30 + lIndex * layerWidth;
        const startY = 30 + ((group.length - 1) * rowHeight) / -2; // Center
        group.forEach((step, rIndex) => {
            // Distribute vertically centered around mid
            // Simple approach: stack them
            const y = 50 + rIndex * rowHeight;
            // Better centering logic needed maybe? simplified for now
            positions[step.id] = { x, y };
            maxY = Math.max(maxY, y);
        });
    });

    const height = Math.max(100, maxY + 30);
    const width = Math.max(300, (maxLayer + 1) * layerWidth + 60);

    return (
        <div className="mt-4 border-t border-gray-600/30 pt-2 overflow-x-auto">
            <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">Dependency Graph</div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                <defs>
                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="12" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill="#9CA3AF" />
                    </marker>
                </defs>

                {/* Edges */}
                {plan.map(step => step.dependencies.map(depId => {
                    const start = positions[depId];
                    const end = positions[step.id];
                    if (!start || !end) return null;
                    return (
                        <line
                            key={`${depId}-${step.id}`}
                            x1={start.x} y1={start.y}
                            x2={end.x} y2={end.y}
                            stroke="#9CA3AF" strokeWidth="1.5" markerEnd="url(#arrowhead)"
                            className="opacity-50"
                        />
                    );
                }))}

                {/* Nodes */}
                {plan.map(step => {
                    const pos = positions[step.id];
                    if (!pos) return null;

                    let fill = "fill-gray-100 dark:fill-gray-700";
                    let stroke = "stroke-gray-400";
                    let textClass = "fill-gray-600 dark:fill-gray-300";

                    if (step.status === 'pending') {
                        fill = "fill-blue-100 dark:fill-blue-900"; stroke = "stroke-blue-500"; textClass = "fill-blue-700 dark:fill-blue-300";
                    } else if (step.status === 'in_progress') {
                        fill = "fill-orange-100 dark:fill-orange-900"; stroke = "stroke-orange-500"; textClass = "fill-orange-700 dark:fill-orange-300";
                    } else if (step.status === 'completed') {
                        fill = "fill-green-100 dark:fill-green-900"; stroke = "stroke-green-500"; textClass = "fill-green-700 dark:fill-green-300";
                    } else if (step.status === 'error') {
                        fill = "fill-red-100 dark:fill-red-900"; stroke = "stroke-red-500"; textClass = "fill-red-700 dark:fill-red-300";
                    }

                    return (
                        <g key={step.id}>
                            <circle cx={pos.x} cy={pos.y} r={nodeRadius} className={`${fill} ${stroke} stroke-2 transition-colors duration-300`} />
                            <text x={pos.x} y={pos.y} dy=".35em" textAnchor="middle" className={`text-[10px] font-bold ${textClass} pointer-events-none`}>
                                {formatId(step.id)}
                            </text>
                            <title>{step.description}</title>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const PlanDAG: React.FC<PlanDAGProps> = ({
    plan,
    activePlan,
    planStatus,
    onDiscard,
    onExecute,
    isDarkMode
}) => {
    const isActive = activePlan === plan;
    const isCompleted = plan.every(s => s.status === 'completed');
    const isFailed = plan.some(s => s.status === 'error');
    const isInProgress = plan.some(s => s.status === 'in_progress');

    // Derived Status Label
    let title = 'Proposed Plan';
    let borderColor = 'border-l-purple-500';
    let titleColor = 'text-purple-500';

    if (isActive) {
        if (planStatus === 'executing') title = 'Executing Plan...';
        else if (planStatus === 'completed') title = 'Plan Completed';
    } else {
        if (isCompleted) title = 'Plan Completed';
        else if (isFailed) title = 'Plan Failed';
        else if (isInProgress) title = 'Plan Interrupted';
    }

    if (isActive && planStatus === 'completed' || (!isActive && isCompleted)) {
        borderColor = 'border-l-green-500';
        titleColor = 'text-green-500';
    }

    const actionBg = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300';
    const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const formatId = (id: string) => id.replace(/^step-?|^id-?/, '');

    // USE LIVE STATE IF ACTIVE
    // If this plan is the active one, use the `activePlan` (live state from Orchestrator)
    // instead of the `plan` prop (static/delayed message state).
    const displayPlan = isActive && activePlan ? activePlan : plan;

    return (
        <div className={`mt-2 ${actionBg} border rounded-lg p-3 w-full max-w-[95%] shadow-lg border-l-4 ${borderColor}`}>
            <div className="flex justify-between items-center mb-2">
                <h4 className={`text-xs font-bold ${titleColor} uppercase tracking-wider`}>
                    {title}
                </h4>
                {isActive && planStatus === 'executing' && (
                    <span className="text-[10px] animate-pulse text-orange-400">Running...</span>
                )}
            </div>

            <div className="space-y-1">
                {displayPlan.map((step, i) => {
                    let statusColor = textColor;
                    if (step.status === 'pending') statusColor = "text-blue-500";
                    if (step.status === 'in_progress') statusColor = "text-orange-500 font-bold";
                    if (step.status === 'completed') statusColor = "text-green-500 opacity-70";
                    if (step.status === 'error') statusColor = "text-red-500";

                    let statusDotColor = "bg-gray-400"; // Fallback

                    // Pending / Waiting
                    if (step.status === 'pending') {
                        statusDotColor = "bg-black dark:bg-gray-400";
                    }

                    if (step.status === 'in_progress') statusDotColor = "bg-orange-500 animate-pulse";
                    if (step.status === 'completed') statusDotColor = "bg-green-500";
                    if (step.status === 'error') statusDotColor = "bg-red-500";

                    return (
                        <div key={i} className={`flex items-start text-xs ${statusColor} py-1`}>
                            <div className="min-w-[1.5rem] text-right mr-2 font-mono select-none opacity-60 flex items-center justify-end gap-1">
                                <span>{formatId(step.id)}.</span>
                            </div>
                            <div className="flex flex-col flex-grow">
                                <div className="flex items-center gap-2">
                                    <span>{step.description}</span>
                                    <div className={`w-2 h-2 rounded-full ${statusDotColor} flex-shrink-0`} title={step.status}></div>
                                </div>
                                {step.status === 'error' && step.result && (
                                    <div className="mt-1 ml-2 border-l-2 border-red-500 pl-2 max-w-full overflow-hidden">
                                        <details className="group">
                                            <summary className="text-red-400 text-[10px] cursor-pointer hover:text-red-300 select-none list-none flex items-center gap-1">
                                                <span className="font-bold">Error Details</span>
                                                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </summary>
                                            <div className="text-red-300 text-[10px] font-mono mt-1 whitespace-pre-wrap break-all bg-red-900/10 p-1 rounded max-h-32 overflow-y-auto custom-scrollbar select-text">
                                                {step.result}
                                            </div>
                                        </details>
                                        {/* Always visible short summary if not expanded? No, let's keep it clean with the details toggle but maybe show first line? */}
                                        <div className="text-red-400 text-[10px] truncate group-open:hidden max-w-[200px]">
                                            {step.result.split('\n')[0]}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <DAGVisualizer plan={displayPlan} status={planStatus} />

            <div className="mt-3 flex flex-col gap-2">
                {isActive && planStatus === 'proposed' && (
                    <div className="flex gap-2 justify-end">
                        <button onClick={onDiscard} className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1">Discard</button>
                        <button onClick={onExecute} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">Execute Plan</button>
                    </div>
                )}
            </div>
        </div>
    );
};
