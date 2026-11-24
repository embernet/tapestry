// Which file chooser to use for "open a file", and how to read a picker failure.
// Pure functions, no imports, so test/file-open.test.cjs can load this file directly.

export type PickerKind = 'file-system-access' | 'file-input';

export interface PickerEnv {
    hasOpenFilePicker: boolean;   // 'showOpenFilePicker' in window
    isSecureContext: boolean;     // https or localhost; the API needs it
    inIframe: boolean;            // pickers are blocked in cross-origin frames
    pickerBlocked: boolean;       // the picker already failed at once this session
}

/**
 * The File System Access picker when it exists and can work (Save can then write back
 * to the same file); otherwise the page's always-mounted <input type="file">, which must
 * be clicked in the same user gesture. Firefox and Safari never have the picker, and
 * Chrome only has it in a secure context (not http://<host IP>).
 */
export function choosePicker(env: PickerEnv): PickerKind {
    if (env.hasOpenFilePicker && env.isSecureContext && !env.inIframe && !env.pickerBlocked) {
        return 'file-system-access';
    }
    return 'file-input';
}

/** A real Cancel takes the user longer than this; a blocked picker fails at once. */
export const PICKER_MIN_MS = 500;

/**
 * After the picker rejects: 'cancelled' when the user closed it, 'unavailable' when the
 * browser refused it (by policy, in a preview pane, under automation). A refusal often
 * comes as the same AbortError as a Cancel, so time tells them apart; an intercepted
 * picker says so in its message.
 */
export function classifyPickerFailure(err: { name?: string; message?: string } | null | undefined, elapsedMs: number): 'cancelled' | 'unavailable' {
    // Driven over the DevTools protocol (an automation tool, an embedded browser pane):
    // "Intercepted by Page.setInterceptFileChooserDialog()". No file window reaches the user.
    if (/intercept/i.test(err?.message ?? '')) return 'unavailable';
    if (err?.name === 'AbortError' && elapsedMs >= PICKER_MIN_MS) return 'cancelled';
    return 'unavailable';
}

export type SaveTarget = 'same-file' | 'save-picker' | 'download';

/**
 * Where "Save to disk" writes. Back to the same file only with a handle from the File
 * System Access picker; a file from <input type="file"> has no handle, so Save asks
 * where to save (save picker) or downloads the file.
 */
export function chooseSaveTarget(env: { hasWritableHandle: boolean; hasSaveFilePicker: boolean; isSecureContext: boolean; inIframe: boolean; pickerBlocked: boolean }): SaveTarget {
    if (env.inIframe) return 'download';
    if (env.hasWritableHandle) return 'same-file';
    if (env.hasSaveFilePicker && env.isSecureContext && !env.pickerBlocked) return 'save-picker';
    return 'download';
}

/** No sign of a file window (no change, cancel or window blur) this long after a click means it never opened. */
export const CHOOSER_SILENT_MS = 1500;

/**
 * Whether a file fits an <input accept="…"> list: ".json", "application/json", "text/*".
 * An empty list takes anything.
 */
export function acceptsFile(file: { name: string; type?: string }, accept: string | undefined | null): boolean {
    const rules = (accept || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (rules.length === 0) return true;
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return rules.some(r => {
        if (r.startsWith('.')) return name.endsWith(r);
        if (r.endsWith('/*')) return type.startsWith(r.slice(0, -1));
        return type === r;
    });
}

/** The extensions in an accept list, for messages: ".json" or ".md, .txt". */
export function describeAccept(accept: string | undefined | null): string {
    const exts = (accept || '').split(',').map(s => s.trim()).filter(s => s.startsWith('.'));
    return exts.length ? exts.join(', ') : 'supported';
}

export interface InputLike {
    accept: string;
    multiple: boolean;
    files: unknown;
    dispatchEvent(ev: unknown): boolean;
}

export type DropResult = { ok: true; count: number } | { ok: false; message: string };

/**
 * Hand dropped files to a file input as if they were chosen in its file window: set its
 * files and fire 'change', so the input's own onChange (the same import path) runs.
 * Files that don't fit the input's accept list are refused; nothing is changed then.
 * makeList turns File[] into a FileList (a DataTransfer's files in the browser).
 */
export function deliverToInput<F extends { name: string; type?: string }>(
    input: InputLike | null,
    dropped: ArrayLike<F>,
    makeList: (files: F[]) => unknown,
): DropResult {
    if (!input) return { ok: false, message: "Couldn't take the file. Reload the page and try again." };
    const all = Array.from(dropped);
    if (all.length === 0) return { ok: false, message: 'Nothing to open: drop a file from your computer.' };
    const fits = all.filter(f => acceptsFile(f, input.accept));
    if (fits.length === 0) {
        const what = all.length === 1 ? `"${all[0].name}" isn't` : "Those files aren't";
        return { ok: false, message: `${what} a ${describeAccept(input.accept)} file.` };
    }
    const chosen = input.multiple ? fits : fits.slice(0, 1);
    input.files = makeList(chosen);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, count: chosen.length };
}
