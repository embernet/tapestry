import { useEffect, useState } from 'react';

// What the Tapestry server (server/index.js) tells the page about this session.
// Fetched once per page load. null = not served by the Tapestry server (e.g.
// `npm run dev`), so the page runs exactly as before: no bar, no shared AI.

export interface ServerAiInfo {
    available: boolean;
    label?: string;     // e.g. "OpenAI"
    model?: string;     // default model
    models?: string[];  // models users may choose from
}

export interface ServerSession {
    user: { username: string; displayName?: string; source: 'local' | 'sso'; isAdmin?: boolean };
    sso: boolean;
    portalUrl: string;
    portalName: string;
    ai?: ServerAiInfo;
}

// Where the page sends AI requests for the 'server' provider (OpenAI-compatible).
export { SERVER_AI_BASE_URL } from './aiRequest';

let cached: ServerSession | null = null;
let pending: Promise<ServerSession | null> | null = null;

export function loadServerSession(): Promise<ServerSession | null> {
    if (!pending) {
        pending = fetch('/api/session', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
            .then(r => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
            .then(data => (cached = data?.user ? data : null))
            .catch(() => null);
    }
    return pending;
}

export function useServerSession(): ServerSession | null {
    const [session, setSession] = useState<ServerSession | null>(cached);
    useEffect(() => {
        let live = true;
        loadServerSession().then(s => { if (live) setSession(s); });
        return () => { live = false; };
    }, []);
    return session;
}

// True when calling this provider needs a key the user hasn't entered.
export function needsApiKey(config: { provider: string; apiKey?: string }): boolean {
    return !config.apiKey && config.provider !== 'ollama' && config.provider !== 'server';
}
