// In-page messages and questions: the app's replacement for the browser's
// alert(), confirm() and prompt(), which are never used (see ENGINEERING_CHARTER.md §1).
//
//   notify('Saved to Documents', 'success')             toast, auto-dismissing
//   if (await confirmDialog({ message: 'Delete this slide?', danger: true })) ...
//   const name = await promptDialog({ message: 'Script name' });   // null = cancelled
//
// <DialogHost /> (components/DialogHost.tsx) renders them; it is mounted once in App.

export type NoticeKind = 'info' | 'success' | 'warning' | 'error';

export interface Notice {
    id: number;
    message: string;
    kind: NoticeKind;
}

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;      // destructive action: red confirm button
}

export interface PromptOptions {
    title?: string;
    message: string;
    defaultValue?: string;
    placeholder?: string;
    confirmLabel?: string;
    multiline?: boolean;
}

/** The in-page "choose a file" step: a label for the page's file input, and a drop zone. */
export interface FileStepOptions {
    title?: string;
    message: string;
    /** The always-mounted <input type="file"> whose onChange takes the file. */
    input: HTMLInputElement | null;
    /** What to drop, e.g. "Tapestry model file (.json)". */
    fileKind?: string;
    /** Show the "no file window opened" help at once (a direct click already opened nothing). */
    showBlockedHelp?: boolean;
}

export type DialogRequest =
    | { id: number; type: 'confirm'; options: ConfirmOptions; resolve: (ok: boolean) => void }
    | { id: number; type: 'file'; options: FileStepOptions; resolve: (gotFile: boolean) => void }
    | { id: number; type: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void };

type Listener = () => void;

let seq = 0;
let notices: Notice[] = [];
let dialogs: DialogRequest[] = [];
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());

export function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}
export const getNotices = () => notices;
export const getDialogs = () => dialogs;

export function dismissNotice(id: number) {
    notices = notices.filter(n => n.id !== id);
    emit();
}

/** Show a toast. Errors stay longer; at most five are shown at once. */
export function notify(message: string, kind: NoticeKind = 'info') {
    const id = ++seq;
    notices = [...notices.slice(-4), { id, message, kind }];
    emit();
    setTimeout(() => dismissNotice(id), kind === 'error' || kind === 'warning' ? 9000 : 5000);
}

function open<T>(make: (id: number, resolve: (v: T) => void) => DialogRequest): Promise<T> {
    return new Promise<T>(resolve => {
        const id = ++seq;
        dialogs = [...dialogs, make(id, (v: T) => {
            dialogs = dialogs.filter(d => d.id !== id);
            emit();
            resolve(v);
        })];
        emit();
    });
}

/** Ask a yes/no question in the page. Resolves true on confirm, false on cancel or Escape. */
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
    const opts = typeof options === 'string' ? { message: options } : options;
    return open<boolean>((id, resolve) => ({ id, type: 'confirm', options: opts, resolve }));
}

/** Ask for a file in the page. Resolves true once a file reached the input, false on cancel. */
export function chooseFileDialog(options: FileStepOptions): Promise<boolean> {
    return open<boolean>((id, resolve) => ({ id, type: 'file', options, resolve }));
}

/** Ask for a value in the page. Resolves the text, or null when cancelled. */
export function promptDialog(options: PromptOptions | string): Promise<string | null> {
    const opts = typeof options === 'string' ? { message: options } : options;
    return open<string | null>((id, resolve) => ({ id, type: 'prompt', options: opts, resolve }));
}
