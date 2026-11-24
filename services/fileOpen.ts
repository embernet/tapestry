// "Open a file" for every button that opens one: the File System Access picker where it
// is available and works, otherwise the caller's always-mounted <input type="file">,
// clicked in the same user gesture (so call openFile straight from the click handler,
// before any await).
import { choosePicker, classifyPickerFailure, PickerEnv } from '../utils/filePicker';
import { isInIframe } from '../utils';
import { confirmDialog, notify } from './dialogs';

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

export interface OpenFileOptions {
    /** The always-mounted file input; its onChange handles a file chosen through it. */
    input: HTMLInputElement | null;
    /** Picker filter, e.g. { description: 'JSON Files', accept: { 'application/json': ['.json'] } }. */
    types: { description: string; accept: Record<string, string[]> }[];
    /** A file chosen in the File System Access picker, with its handle (Save can write back to it). */
    onPicked: (file: File, handle: any) => void | Promise<void>;
    /** Picker's starting folder, e.g. 'documents'. */
    startIn?: string;
    /** Wording for the in-page step shown when the picker is refused. */
    title?: string;
    message?: string;
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

export async function openFile(opts: OpenFileOptions): Promise<void> {
    if (choosePicker(pickerEnv()) === 'file-input') {
        clickInput(opts.input);   // synchronous: still inside the click's user gesture
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
        // The refused picker used up this click's permission to open a file chooser,
        // so ask for one more click (in the page), which opens it. Later opens go
        // straight to the file chooser.
        if (await confirmDialog({ title: opts.title ?? 'Open a file', message: opts.message ?? 'Choose a file from your computer.', confirmLabel: 'Choose file…' })) {
            clickInput(opts.input);
        }
        return;
    }
    await opts.onPicked(picked.file, picked.handle);
}
