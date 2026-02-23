
// A robust CSV Parser that handles quoted strings and newlines

export const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else if (char === '"') {
                // End of quoted field
                inQuotes = false;
            } else {
                // Inside quoted field
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                // End of field
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                // End of row
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
                if (char === '\r') i++; // Skip newline if CRLF
            } else if (char === '\r') {
                 // End of row (CR only)
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }
    
    // Push last field/row if exists
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    
    return rows;
};

export const generateCSV = (headers: string[], data: any[][]): string => {
    const escapeField = (field: any): string => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headerRow = headers.map(escapeField).join(',');
    const rows = data.map(row => row.map(escapeField).join(','));
    
    return [headerRow, ...rows].join('\n');
};

export const guessColumnMapping = (headers: string[], mode: 'nodes' | 'edges'): Record<number, string> => {
    const mapping: Record<number, string> = {};
    
    headers.forEach((h, idx) => {
        const lower = h.toLowerCase().trim().replace(/_/g, '');
        
        if (mode === 'nodes') {
            if (['id', 'uid', 'key'].includes(lower)) mapping[idx] = 'ignore'; // We ignore imported IDs usually to avoid collision, let name be key
            else if (['name', 'label', 'title', 'entity'].includes(lower)) mapping[idx] = 'name';
            else if (['note', 'notes', 'description', 'desc'].includes(lower)) mapping[idx] = 'notes';
            else if (['tag', 'tags', 'type', 'category', 'group'].includes(lower)) mapping[idx] = 'tags';
            else if (['x', 'posx', 'positionx'].includes(lower)) mapping[idx] = 'x';
            else if (['y', 'posy', 'positiony'].includes(lower)) mapping[idx] = 'y';
            else if (['created', 'createdat', 'date'].includes(lower)) mapping[idx] = 'created';
            else if (['updated', 'updatedat', 'modified'].includes(lower)) mapping[idx] = 'updated';
            else if (['rel', 'relation', 'connects', 'link'].some(k => lower.includes(k))) mapping[idx] = 'relationship';
            else mapping[idx] = 'attribute'; // Default to attribute for unknown columns
        } else {
            // Edge Mode
            if (['source', 'from', 'start', 'origin', 'src'].includes(lower)) mapping[idx] = 'source';
            else if (['target', 'to', 'end', 'destination', 'dst'].includes(lower)) mapping[idx] = 'target';
            else if (['label', 'type', 'relation', 'rel'].includes(lower)) mapping[idx] = 'label';
            else if (['dir', 'direction'].includes(lower)) mapping[idx] = 'ignore'; // Direction difficult to parse cleanly often
            else mapping[idx] = 'attribute'; // Default to attribute so we don't lose data
        }
    });

    return mapping;
};
