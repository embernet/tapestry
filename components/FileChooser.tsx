import React, { useEffect, useState } from 'react';
import { dropFiles, watchChooser, BLOCKED_HELP, usesPicker } from '../services/fileOpen';
import { notify } from '../services/dialogs';
import { describeAccept } from '../utils/filePicker';

// Ways to give the page a file that don't depend on a click after an await:
//   <ChooseFileLabel>  a <label htmlFor> for an always-mounted <input type="file">: the
//                      user's own click on it opens the file window, natively.
//   useFileDrop        drag-and-drop onto any element, handed to the same input's onChange
//                      (services/fileOpen.ts dropFiles). Works where file windows are
//                      blocked or intercepted.
//   <FileChooser>      both, as a drop zone with a "Choose file…" label inside, and help
//                      when the file window didn't open.

let idSeq = 0;

/** The id of the input in ref, giving it one if it has none (labels need it). */
function useInputId(inputRef: React.RefObject<HTMLInputElement>): string | undefined {
    const [id, setId] = useState<string | undefined>(() => inputRef.current?.id || undefined);
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        if (!el.id) el.id = `file-input-${++idSeq}`;
        setId(el.id);
    });
    return id;
}

interface ChooseFileLabelProps {
    inputRef: React.RefObject<HTMLInputElement>;
    className?: string;
    title?: string;
    children: React.ReactNode;
    /** Called as the file window should open (click, Enter or Space). */
    onActivate?: () => void;
}

/** A button-styled <label> for the input: opens its file window within the user's click. */
export const ChooseFileLabel: React.FC<ChooseFileLabelProps> = ({ inputRef, className, title, children, onActivate }) => {
    const id = useInputId(inputRef);
    const activate = () => {
        if (inputRef.current) inputRef.current.value = '';   // the same file again still fires change
        onActivate?.();
    };
    return (
        <label
            htmlFor={id}
            role="button"
            tabIndex={0}
            title={title}
            data-file-choose=""
            className={`cursor-pointer select-none ${className ?? ''}`}
            onClick={activate}
            onKeyDown={(e) => {
                // Labels don't answer the keyboard; Enter and Space are a click in this gesture.
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    activate();
                    inputRef.current?.click();
                }
            }}
        >
            {children}
        </label>
    );
};

/** Drop handlers that hand dropped files to the input (its onChange imports them). */
export function useFileDrop(inputRef: React.RefObject<HTMLInputElement>, opts: { onRejected?: (message: string) => void; onAccepted?: () => void } = {}) {
    const [isDragging, setIsDragging] = useState(false);
    const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const dropProps = {
        onDragEnter: (e: React.DragEvent) => { if (hasFiles(e)) { e.preventDefault(); setIsDragging(true); } },
        onDragOver: (e: React.DragEvent) => { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } },
        onDragLeave: (e: React.DragEvent) => {
            if (!(e.currentTarget as Node).contains(e.relatedTarget as Node | null)) setIsDragging(false);
        },
        onDrop: (e: React.DragEvent) => {
            if (!hasFiles(e) && !(e.dataTransfer?.files?.length)) return;
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            const result = dropFiles(inputRef.current, e.dataTransfer.files);
            if (result.ok) opts.onAccepted?.();
            else (opts.onRejected ?? ((m: string) => notify(m, 'error')))(result.message);
        },
    };
    return { isDragging, dropProps };
}

interface FileChooserProps {
    inputRef: React.RefObject<HTMLInputElement>;
    isDarkMode?: boolean;
    /** e.g. "Tapestry model file (.json)"; defaults to the input's accept list. */
    fileKind?: string;
    /** Called once a file reached the input (chosen or dropped). */
    onFile?: () => void;
    /** Show the blocked-chooser help from the start. */
    showBlockedHelp?: boolean;
    /** Where the File System Access picker works, "Choose file…" calls this instead. */
    onUsePicker?: () => void;
    autoFocus?: boolean;
}

/** A drop zone with a "Choose file…" label for the input, and help if no file window opens. */
export const FileChooser: React.FC<FileChooserProps> = ({ inputRef, isDarkMode = true, fileKind, onFile, showBlockedHelp = false, onUsePicker, autoFocus }) => {
    const [help, setHelp] = useState(showBlockedHelp);
    const [error, setError] = useState<string | null>(null);
    const { isDragging, dropProps } = useFileDrop(inputRef, { onRejected: setError, onAccepted: () => setError(null) });
    const zoneRef = React.useRef<HTMLDivElement>(null);
    const kind = fileKind ?? `file (${describeAccept(inputRef.current?.accept)})`;

    useEffect(() => {
        const el = inputRef.current;
        if (!el || !onFile) return;
        const onChange = () => { if (el.files && el.files.length > 0) onFile(); };
        el.addEventListener('change', onChange);
        return () => el.removeEventListener('change', onChange);
    }, [inputRef, onFile]);

    useEffect(() => { if (autoFocus) zoneRef.current?.querySelector<HTMLElement>('[data-file-choose]')?.focus(); }, [autoFocus]);

    const zone = isDragging
        ? 'border-blue-400 bg-blue-500/10'
        : (isDarkMode ? 'border-gray-500' : 'border-gray-400');
    const btn = 'inline-block px-4 py-2 rounded text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-300';
    const pickerFirst = onUsePicker && usesPicker();

    return (
        <div ref={zoneRef} data-file-drop="" {...dropProps} className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${zone}`}>
            {pickerFirst ? (
                    <button type="button" onClick={onUsePicker} className={btn} data-file-choose="">Choose file…</button>
                ) : (
                    <ChooseFileLabel inputRef={inputRef} className={btn} onActivate={() => { setError(null); watchChooser(inputRef.current, () => setHelp(true)); }}>
                        Choose file…
                    </ChooseFileLabel>
                )}
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>or drag a {kind} here</p>
            {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
            {help && <p role="status" className={`mt-3 text-xs text-left ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>{BLOCKED_HELP}</p>}
        </div>
    );
};
