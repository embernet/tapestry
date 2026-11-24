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
 * comes as the same AbortError as a Cancel, so time tells them apart.
 */
export function classifyPickerFailure(err: { name?: string } | null | undefined, elapsedMs: number): 'cancelled' | 'unavailable' {
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
