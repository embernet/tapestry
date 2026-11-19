import React, { useEffect, useState } from 'react';

// Thin bar above the app: optional "← <portal>" back link on the left, the
// signed-in user and Sign out on the right. Filled from GET /api/session,
// which only the Tapestry server (server/index.js) provides; when the page is
// served any other way (e.g. `npm run dev`), the bar is not shown.

interface SessionInfo {
    user: { username: string; displayName?: string; source: 'local' | 'sso' };
    sso: boolean;
    portalUrl: string;
    portalName: string;
}

export const SessionBar: React.FC<{ isDarkMode: boolean; hidden?: boolean }> = ({ isDarkMode, hidden }) => {
    const [session, setSession] = useState<SessionInfo | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/session', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
            .then(r => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
            .then(data => { if (!cancelled && data?.user) setSession(data); })
            .catch(() => { /* no server session API: run without the bar */ });
        return () => { cancelled = true; };
    }, []);

    if (!session || hidden) return null;

    const bar = isDarkMode ? 'bg-gray-950 border-gray-800 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600';
    const link = isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black';
    const name = session.user.displayName || session.user.username;

    return (
        <nav aria-label="Session" className={`w-full flex-shrink-0 flex items-center justify-between px-3 h-7 text-xs border-b ${bar}`}>
            <div>
                {session.portalUrl && session.portalName && (
                    <a href={session.portalUrl} className={`${link} underline-offset-2 hover:underline`}>← {session.portalName}</a>
                )}
            </div>
            <div className="flex items-center gap-3">
                <span title={session.user.source === 'sso' ? 'Signed in with TIG-SSO' : 'Local account'}>
                    Signed in as <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>{name}</span>
                </span>
                <form method="post" action="/logout" className="m-0">
                    <button type="submit" className={`${link} underline-offset-2 hover:underline`}>Sign out</button>
                </form>
                {session.sso && session.user.source === 'sso' && (
                    <form method="post" action="/logout" className="m-0">
                        <input type="hidden" name="everywhere" value="1" />
                        <button type="submit" className={`${link} underline-offset-2 hover:underline`}>Sign out everywhere</button>
                    </form>
                )}
            </div>
        </nav>
    );
};

export default SessionBar;
