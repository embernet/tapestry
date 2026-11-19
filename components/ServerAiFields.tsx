import React from 'react';
import { ServerAiInfo } from '../services/serverSession';

// Settings for the 'server' provider: nothing to enter but (optionally) a model.
// The key stays on the server and is never shown.
export const ServerAiFields: React.FC<{
    info: ServerAiInfo;
    modelId?: string;
    onModelChange: (modelId: string) => void;
    labelClass: string;
    mutedClass: string;
    inputClass: string;
}> = ({ info, modelId, onModelChange, labelClass, mutedClass, inputClass }) => {
    const models = info.models || [];
    const current = modelId && models.includes(modelId) ? modelId : info.model || '';
    return (
        <div className="space-y-3">
            <p className={`text-xs ${mutedClass}`}>
                AI is provided by this Tapestry server ({info.label || 'shared'}). No API key is needed. Requests
                are sent through the server, which adds its own key.
            </p>
            <div className="space-y-2">
                <label htmlFor="server-ai-model" className={`block text-xs font-bold ${labelClass}`}>Model</label>
                {models.length > 1 ? (
                    <select id="server-ai-model" value={current} onChange={e => onModelChange(e.target.value)}
                        className={`w-full rounded p-2 focus:outline-none focus:border-blue-500 font-mono text-sm border ${inputClass}`}>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                ) : (
                    <div id="server-ai-model" className={`font-mono text-sm ${labelClass}`}>{current}</div>
                )}
            </div>
        </div>
    );
};
