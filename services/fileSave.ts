// Save and Save As for every button and shortcut that saves the model to a file. The
// decisions are in utils/saveFlow.ts (runSave); this file supplies the browser: the
// File System Access save picker, the in-page questions and toasts, and the download.
// Call saveFile straight from the click or keydown, so the picker has the user gesture.
import { runSave } from '../utils/saveFlow';
import type { SaveResult, WritableHandle } from '../utils/saveFlow';
import { isInIframe } from '../utils';
import { confirmDialog, notify } from './dialogs';
import { isPickerBlocked, markPickerBlocked } from './fileOpen';

export type { SaveResult, WritableHandle };

// "This browser can't choose a folder" is said once a session.
let downloadExplained = false;

function downloadText(name: string, text: string) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function saveFile(req: { mode: 'save' | 'saveAs'; handle: WritableHandle | null; suggestedName: string; text: string | ((fileName: string) => string) }): Promise<SaveResult> {
    return runSave(req, {
        env: {
            hasSaveFilePicker: typeof window !== 'undefined' && 'showSaveFilePicker' in window,
            isSecureContext: typeof window !== 'undefined' && window.isSecureContext === true,
            inIframe: isInIframe(),
            pickerBlocked: isPickerBlocked(),
        },
        pickSaveFile: (options) => (window as any).showSaveFilePicker(options),
        download: downloadText,
        ask: (q) => confirmDialog({ title: q.title, message: q.message, confirmLabel: q.confirmLabel }),
        notify,
        markPickerBlocked,
        downloadExplained: () => downloadExplained,
        markDownloadExplained: () => { downloadExplained = true; },
    });
}
