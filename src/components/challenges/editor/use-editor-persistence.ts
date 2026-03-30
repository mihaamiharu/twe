import { useState, useEffect, useRef } from 'react';
import { storage } from '@/lib/storage-adapter';

export function useEditorPersistence(
    storageKey: string | undefined,
    initialCode: string,
    onChange?: (code: string) => void
) {
    const [code, setCode] = useState<string>(initialCode);
    const [isStorageLoaded, setIsStorageLoaded] = useState(!storageKey);

    // Use ref for onChange to avoid triggering effect on every render
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Load code from storage - only depends on storageKey
    useEffect(() => {
        let mounted = true;

        const loadCode = async () => {
            if (!storageKey) {
                setIsStorageLoaded(true);
                return;
            }

            try {
                // Race condition: Timeout after 1s to prevent infinite loading
                const timeoutPromise = new Promise<null>((resolve) => {
                    setTimeout(() => resolve(null), 1000);
                });

                const storagePromise = storage.getItem(storageKey);

                 
                const saved = await Promise.race([storagePromise, timeoutPromise]);

                if (mounted) {
                    if (saved !== null) {
                        setCode(saved);
                        onChangeRef.current?.(saved);
                    }
                    setIsStorageLoaded(true);
                }
            } catch (err) {
                console.warn('Failed to load code from storage:', err);
                if (mounted) setIsStorageLoaded(true);
            }
        };

        if (storageKey) {
            setIsStorageLoaded(false);
            void loadCode();
        } else {
            setIsStorageLoaded(true);
        }

        return () => {
            mounted = false;
        };
    }, [storageKey]); // Removed initialCode and onChange from deps

    // Auto-save to storage with debounce
    useEffect(() => {
        if (storageKey && isStorageLoaded) {
            const debounceTimer = setTimeout(() => {
                void storage.setItem(storageKey, code);
            }, 500);
            return () => clearTimeout(debounceTimer);
        }
    }, [code, storageKey, isStorageLoaded]);

    return {
        code,
        setCode,
        isStorageLoaded,
    };
}
