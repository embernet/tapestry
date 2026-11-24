// "Open a file" for every button that opens one: the File System Access picker where it
// is available and works, otherwise the caller's always-mounted <input type="file">,
// clicked in the same user gesture (so call openFile straight from the click handler,
// before any await). When neither opens a file window (refused picker, a browser that
// blocks or intercepts file choosers), an in-page step offers a <label> for the input
// and a drop zone; dropped files go through the input's own onChange (dropFiles).
import { choosePicker, classifyPickerFailure, PickerEnv, deliverToInput, DropResult, CHOOSER_SILENT_MS } from '../utils/filePicker';
import { isInIframe } from '../utils';
import { chooseFileDialog, notify } from './dialogs';

// A picker that failed at once (blocked or unavailable) is not tried again this session.
let pickerBlocked = false;
export const isPickerBlocked = () => pickerBlocked;
export const markPickerBlocked = () => { pickerBlocked = true; };

export function pickerEnv(): PickerEnv {
    return {
        hasOpenFilePicker: typeof window !== 'undefined' && 'showOpenFilePicker' in window,
        isSecureContext: typeof window !== 'undefined' && window.isSecureContext === true,
        inIframe: isInIframe(),
        pickerBlocked,
    };
}

/** True when a click should go to the File System Access picker (not the file input). */
export const usesPicker = () => choosePicker(pickerEnv()) === 'file-system-access';

export const BLOCKED_HELP = 'If no file window opened, this browser may be blocking or intercepting file choosers (for example an automation tool, or a browser policy). Drag the file onto this box instead, or open Tapestry in an ordinary browser window.';

export interface OpenFileOptions {
    /** The always-mounted file input; its onChange handles a file chosen through it. */
    input: HTMLInputElement | null;
    /** Picker filter, e.g. { description: 'JSON Files', accept: { 'application/json': ['.json'] } }. */
    types: { description: string; accept: Record<string, string[]> }[];
    /** A file chosen in the File System Access picker, with its handle (Save can write back to it). */
    onPicked: (file: File, handle: any) => void | Promise<void>;
    /** Picker's starting folder, e.g. 'documents'. */
    startIn?: string;
    /** Wording for the in-page step shown when no file window opens. */
    title?: string;
    message?: string;
    /** What to drop there, e.g. "Tapestry model file (.json)". */
    fileKind?: string;
}

/**
 * Hand dropped files to a file input: they go through its onChange, exactly as a file
 * chosen in its window would. Files that don't fit its accept list are refused.
 */
export function dropFiles(input: HTMLInputElement | null, files: FileList | File[] | null | undefined): DropResult {
    return deliverToInput(input, files ?? [], (chosen) => {
        try {
            const dt = new DataTransfer();
            chosen.forEach(f => dt.items.add(f));
            return dt.files;
        } catch {
            return files;   // no DataTransfer constructor: the dropped list as it is
        }
    });
}

/**
 * Call onSilent if, within CHOOSER_SILENT_MS of a click that should open the file window,
 * there's no sign of one: no file chosen, no Cancel, no window blur. A blocked or
 * intercepted chooser gives none of these. Returns a function that stops watching.
 */
export function watchChooser(input: HTMLInputElement | null, onSilent: () => void): () => void {
    if (!input || typeof window === 'undefined') return () => {};
    let done = false;
    const stop = () => {
        done = true;
        clearTimeout(timer);
        input.removeEventListener('change', stop);
        input.removeEventListener('cancel', stop);
        window.removeEventListener('blur', stop);
    };
    const timer = setTimeout(() => { if (!done) { stop(); onSilent(); } }, CHOOSER_SILENT_MS);
    input.addEventListener('change', stop);
    input.addEventListener('cancel', stop);
    window.addEventListener('blur', stop);
    return stop;
}

function clickInput(input: HTMLInputElement | null): boolean {
    if (!input) {
        notify("Couldn't open the file chooser. Reload the page and try again.", 'error');
        return false;
    }
    input.value = '';   // choosing the same file again still fires change
    input.click();
    return true;
}

function fileStep(opts: OpenFileOptions, showBlockedHelp: boolean) {
    return chooseFileDialog({
        title: opts.title ?? 'Open a file',
        message: opts.message ?? 'Choose a file from your computer.',
        input: opts.input,
        fileKind: opts.fileKind,
        showBlockedHelp,
    });
}

export async function openFile(opts: OpenFileOptions): Promise<void> {
    if (!usesPicker()) {
        // Synchronous: still inside the click's user gesture. If no file window shows,
        // offer the in-page step (label + drop zone) with the help already showing.
        if (clickInput(opts.input)) watchChooser(opts.input, () => { void fileStep(opts, true); });
        return;
    }
    const started = Date.now();
    let picked: { file: File; handle: any };
    try {
        const [handle] = await (window as any).showOpenFilePicker({ types: opts.types, ...(opts.startIn ? { startIn: opts.startIn } : {}) });
        picked = { file: await handle.getFile(), handle };
    } catch (err: any) {
        if (classifyPickerFailure(err, Date.now() - started) === 'cancelled') return;
        console.warn("File picker unavailable; using the browser's file chooser instead.", err);
        markPickerBlocked();
        // The refused picker used up this click's permission to open a file chooser, so
        // the step's "Choose file…" is a <label> for the input: the user's own click on it
        // opens the chooser. Its drop zone works even when no chooser can open.
        await fileStep(opts, false);
        return;
    }
    await opts.onPicked(picked.file, picked.handle);
}
