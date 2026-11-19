import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { subscribe, getNotices, getDialogs, dismissNotice, DialogRequest, NoticeKind } from '../services/dialogs';

// Renders the app's toasts and in-page confirm / prompt dialogs (services/dialogs.ts).

const KIND_STYLE: Record<NoticeKind, { dark: string; light: string; icon: string }> = {
    info:    { dark: 'bg-gray-800 border-blue-500 text-gray-100',   light: 'bg-white border-blue-500 text-gray-900',   icon: 'ℹ' },
    success: { dark: 'bg-gray-800 border-green-500 text-gray-100',  light: 'bg-white border-green-600 text-gray-900',  icon: '✓' },
    warning: { dark: 'bg-gray-800 border-yellow-500 text-gray-100', light: 'bg-white border-yellow-500 text-gray-900', icon: '!' },
    error:   { dark: 'bg-gray-800 border-red-500 text-gray-100',    light: 'bg-white border-red-600 text-gray-900',    icon: '✕' },
};

const Dialog: React.FC<{ request: DialogRequest; isDarkMode: boolean }> = ({ request, isDarkMode }) => {
    const isPrompt = request.type === 'prompt';
    const opts = request.options as any;
    const [value, setValue] = useState<string>(isPrompt ? (opts.defaultValue ?? '') : '');
    const boxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);

    const cancel = () => (isPrompt ? (request.resolve as (v: string | null) => void)(null) : (request.resolve as (v: boolean) => void)(false));
    const accept = () => (isPrompt ? (request.resolve as (v: string | null) => void)(value) : (request.resolve as (v: boolean) => void)(true));

    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        (isPrompt ? inputRef.current : confirmRef.current)?.focus();
        if (isPrompt) inputRef.current?.select();
        return () => { previous?.focus?.(); };
    }, [isPrompt]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();   // keep app-wide shortcuts out of the dialog
        if (e.key === 'Escape') { e.preventDefault(); cancel(); return; }
        if (e.key === 'Enter' && !(isPrompt && opts.multiline && !e.ctrlKey && !e.metaKey)) { e.preventDefault(); accept(); return; }
        if (e.key === 'Tab' && boxRef.current) {   // keep focus inside the dialog
            const f = boxRef.current.querySelectorAll<HTMLElement>('input, textarea, button');
            if (f.length === 0) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };

    const panel = isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900';
    const input = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const cancelBtn = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-900';
    const okBtn = opts.danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white';
    const titleId = `dlg-title-${request.id}`, msgId = `dlg-msg-${request.id}`;
    const title = opts.title || (isPrompt ? 'Enter a value' : 'Please confirm');

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget) cancel(); }}>
            <div ref={boxRef} role={isPrompt ? 'dialog' : 'alertdialog'} aria-modal="true" aria-labelledby={titleId} aria-describedby={msgId}
                onKeyDown={onKeyDown} className={`w-full max-w-md rounded-lg border shadow-2xl p-5 ${panel}`}>
                <h2 id={titleId} className="text-lg font-semibold mb-2">{title}</h2>
                <p id={msgId} className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{opts.message}</p>
                {isPrompt && (opts.multiline ? (
                    <textarea ref={inputRef} value={value} onChange={e => setValue(e.target.value)} placeholder={opts.placeholder} rows={8}
                        aria-labelledby={msgId} className={`mt-3 w-full rounded border p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${input}`} />
                ) : (
                    <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)} placeholder={opts.placeholder}
                        aria-labelledby={msgId} className={`mt-3 w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${input}`} />
                ))}
                {isPrompt && opts.multiline && <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Ctrl+Enter to confirm</p>}
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={cancel} className={`px-4 py-2 rounded text-sm font-medium ${cancelBtn}`}>{opts.cancelLabel || 'Cancel'}</button>
                    <button type="button" ref={confirmRef} onClick={accept} className={`px-4 py-2 rounded text-sm font-semibold ${okBtn}`}>{opts.confirmLabel || 'OK'}</button>
                </div>
            </div>
        </div>
    );
};

export const DialogHost: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const notices = useSyncExternalStore(subscribe, getNotices);
    const dialogs = useSyncExternalStore(subscribe, getDialogs);
    const top = dialogs[0];   // one at a time, in order

    return (
        <>
            {top && <Dialog key={top.id} request={top} isDarkMode={isDarkMode} />}
            <div className="fixed bottom-10 right-4 z-[10001] flex flex-col gap-2 w-[min(24rem,calc(100vw-2rem))] pointer-events-none">
                {notices.map(n => {
                    const s = KIND_STYLE[n.kind];
                    return (
                        <div key={n.id} role={n.kind === 'error' || n.kind === 'warning' ? 'alert' : 'status'}
                            className={`pointer-events-auto flex items-start gap-3 rounded-md border-l-4 shadow-lg px-3 py-2 text-sm ${isDarkMode ? s.dark : s.light}`}>
                            <span aria-hidden="true" className="font-bold mt-px">{s.icon}</span>
                            <span className="flex-1 whitespace-pre-wrap break-words">{n.message}</span>
                            <button type="button" onClick={() => dismissNotice(n.id)} aria-label="Dismiss"
                                className={`ml-1 leading-none ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>×</button>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default DialogHost;
