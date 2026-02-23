
import { useState, useEffect } from 'react';

// Conservative estimate for LocalStorage limit (5MB)
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

export const useStorageUsage = () => {
    const [usage, setUsage] = useState({ usedKB: 0, percent: 0, totalKB: STORAGE_LIMIT_BYTES / 1024 });

    const calculateUsage = () => {
        let totalBytes = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                // Approximate usage: key length + value length (assuming 1 byte per char for rough estimate)
                // UTF-16 characters are 2 bytes, but some browsers count UTF-16 characters against the limit (e.g. 5M chars)
                // rather than bytes. We'll sum lengths as a "units" count against a 5M unit limit.
                const keyLength = key.length;
                const valueLength = (localStorage.getItem(key) || '').length;
                totalBytes += keyLength + valueLength;
            }
        }

        // Convert to KB
        const usedKB = Math.round(totalBytes / 1024);
        const percent = Math.min(100, Math.round((totalBytes / STORAGE_LIMIT_BYTES) * 100));

        setUsage({
            usedKB,
            percent,
            totalKB: Math.round(STORAGE_LIMIT_BYTES / 1024)
        });
    };

    useEffect(() => {
        calculateUsage();
        // Poll every 5 seconds to update usage
        const interval = setInterval(calculateUsage, 5000);

        return () => clearInterval(interval);
    }, []);

    return usage;
};
