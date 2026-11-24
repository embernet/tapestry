// Which browser-stored models are "recovered models": changed since they were last saved.
// Pure functions, no imports, so test/recovery.test.cjs can load this file directly.

export interface RecoveryMeta {
    id: string;
    contentHash?: string;     // hash of the model as autosaved in this browser
    lastDiskHash?: string;    // hash when last saved to (or opened from) a file
    lastSavedHash?: string;   // hash when last saved anywhere else (e.g. a GitHub Gist)
}

/**
 * A model is recoverable when its autosaved content differs from every saved copy.
 * Saved and not changed since: not recoverable. A later change: recoverable again.
 * Never saved: recoverable.
 */
export function isRecoverable(meta: RecoveryMeta): boolean {
    if (!meta.contentHash) return true;
    return meta.contentHash !== meta.lastDiskHash && meta.contentHash !== meta.lastSavedHash;
}

/** The recovered-models list. Entries left by already-saved models drop out here. */
export function recoverableModels<T extends RecoveryMeta>(index: T[]): T[] {
    return index.filter(isRecoverable);
}

/** Metadata after a save: the saved hash is the current content's. */
export function markSaved<T extends RecoveryMeta>(meta: T, hash: string, where: 'disk' | 'other'): T {
    return where === 'disk'
        ? { ...meta, contentHash: hash, lastDiskHash: hash }
        : { ...meta, contentHash: hash, lastSavedHash: hash };
}

/**
 * Metadata after the model was written to a file (Save, Save As, or a download): the
 * file's name, and the saved hash is the content's, so the model leaves the recovered
 * list and shows no unsaved changes until it changes again.
 */
export function markSavedToFile<T extends RecoveryMeta & { filename?: string; updatedAt?: string }>(meta: T, hash: string, filename: string, now: string): T {
    return markSaved({ ...meta, filename, updatedAt: now }, hash, 'disk');
}
