// Save and Save As: what happens on each path, with the browser passed in (deps), so
// test/file-save.test.cjs can run every path. services/fileSave.ts supplies the real
// browser: the save picker, the in-page questions, the download and the toasts.
import { chooseSaveTarget, classifyPickerFailure, classifyWriteFailure } from './filePicker.ts';
import type { SaveEnv } from './filePicker.ts';

/** The part of a FileSystemFileHandle a save uses. */
export interface WritableHandle {
    name: string;
    createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
    requestPermission?(desc: { mode: 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
}

export interface SaveDeps {
    env: Omit<SaveEnv, 'hasWritableHandle'>;
    /** window.showSaveFilePicker */
    pickSaveFile: (options: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<WritableHandle>;
    /** Save the text as a download under this name. */
    download: (name: string, text: string) => void;
    /** In-page yes/no question; true to go ahead. */
    ask: (q: { title: string; message: string; confirmLabel: string }) => Promise<boolean>;
    /** In-page toast. */
    notify: (message: string, kind: 'info' | 'success' | 'warning' | 'error') => void;
    /** The picker was refused: don't try it again this session (shared with Open). */
    markPickerBlocked: () => void;
    /** Whether "this browser can't choose a folder" has been said already this session. */
    downloadExplained: () => boolean;
    markDownloadExplained: () => void;
    now?: () => number;
}

export interface SaveRequest {
    mode: 'save' | 'saveAs';
    /** The model's file handle, if it has one. */
    handle: WritableHandle | null;
    /** Suggested file name: the model's name plus .json. */
    suggestedName: string;
    /** The file's contents, or a function of the name it is saved under. */
    text: string | ((fileName: string) => string);
}

export type SaveResult =
    | { status: 'written'; handle: WritableHandle; name: string }   // to a file on disk
    | { status: 'downloaded'; name: string }                         // to the Downloads folder
    | { status: 'cancelled' }                                        // nothing saved
    | { status: 'failed'; message: string };                         // nothing saved, told the user

export const JSON_TYPES = [{ description: 'Tapestry model (JSON)', accept: { 'application/json': ['.json'] } }];

const textFor = (req: SaveRequest, name: string) => typeof req.text === 'function' ? req.text(name) : req.text;

async function write(handle: WritableHandle, text: string) {
    const w = await handle.createWritable();
    await w.write(text);
    await w.close();
}

const savedTo = (handle: WritableHandle, deps: SaveDeps): SaveResult => {
    deps.notify(`Saved to ${handle.name}`, 'success');
    return { status: 'written', handle, name: handle.name };
};

function download(req: SaveRequest, deps: SaveDeps): SaveResult {
    deps.download(req.suggestedName, textFor(req, req.suggestedName));
    if (deps.downloadExplained()) {
        deps.notify(`Downloaded ${req.suggestedName}`, 'success');
    } else {
        deps.markDownloadExplained();
        deps.notify(`This browser can't choose a folder, so ${req.suggestedName} went to your Downloads folder.`, 'info');
    }
    return { status: 'downloaded', name: req.suggestedName };
}

/** Ask where to save (save picker), write there; a download where no picker can work. */
async function saveWithPicker(req: SaveRequest, deps: SaveDeps): Promise<SaveResult> {
    const env = { ...deps.env, hasWritableHandle: false };
    if (chooseSaveTarget(env, 'saveAs') === 'download') return download(req, deps);
    const now = deps.now ?? Date.now;
    const started = now();
    let handle: WritableHandle;
    try {
        handle = await deps.pickSaveFile({ suggestedName: req.suggestedName, types: JSON_TYPES });
    } catch (err: any) {
        if (classifyPickerFailure(err, now() - started) === 'cancelled') return { status: 'cancelled' };
        deps.markPickerBlocked();
        return download(req, deps);
    }
    try {
        await write(handle, textFor(req, handle.name));
    } catch {
        // The picker gave a file we can't write (a read-only folder, a locked file): keep the save.
        deps.notify(`Couldn't write to ${handle.name}, so it was downloaded instead.`, 'warning');
        deps.download(req.suggestedName, textFor(req, req.suggestedName));
        return { status: 'downloaded', name: req.suggestedName };
    }
    return savedTo(handle, deps);
}

/** Last resort after the model's own file can't be written: ask, then the picker. */
async function offerPicker(req: SaveRequest, deps: SaveDeps, why: string): Promise<SaveResult> {
    const go = await deps.ask({ title: 'Save somewhere else?', message: `${why} Choose where to save it instead.`, confirmLabel: 'Choose where to save' });
    if (!go) return notSaved(deps);
    return saveWithPicker(req, deps);
}

function notSaved(deps: SaveDeps): SaveResult {
    const message = 'Not saved to a file. Your changes are still kept in this browser.';
    deps.notify(message, 'warning');
    return { status: 'failed', message };
}

/**
 * Save: back to the model's file when it has one, silently; otherwise ask where (save
 * picker). Save As: always ask where. A download where no picker can work. A cancelled
 * picker saves nothing and says nothing. If the model's file can't be written (access
 * revoked or refused, or the file has gone), ask in the page, ask the browser for access
 * again, and failing that offer the picker: the save is never dropped without a word.
 */
export async function runSave(req: SaveRequest, deps: SaveDeps): Promise<SaveResult> {
    const target = chooseSaveTarget({ ...deps.env, hasWritableHandle: !!req.handle }, req.mode);
    if (target === 'download') return download(req, deps);
    if (target === 'save-picker' || !req.handle) return saveWithPicker(req, deps);

    const handle = req.handle;
    try {
        await write(handle, textFor(req, handle.name));
        return savedTo(handle, deps);
    } catch (err: any) {
        if (classifyWriteFailure(err) === 'gone') {
            return offerPicker(req, deps, `${handle.name} can't be found: it may have been moved or deleted.`);
        }
    }
    // Write access refused or revoked. The in-page button's click lets the browser ask again.
    const retry = await deps.ask({
        title: 'Allow saving to this file?',
        message: `Tapestry isn't allowed to write to ${handle.name} at the moment. Allow it, and the model is saved there.`,
        confirmLabel: 'Allow and save',
    });
    if (!retry) return notSaved(deps);
    try {
        const state = handle.requestPermission ? await handle.requestPermission({ mode: 'readwrite' }) : 'granted';
        if (state !== 'granted') throw Object.assign(new Error('Permission not granted'), { name: 'NotAllowedError' });
        await write(handle, textFor(req, handle.name));
        return savedTo(handle, deps);
    } catch {
        return offerPicker(req, deps, `Tapestry still can't write to ${handle.name}.`);
    }
}
