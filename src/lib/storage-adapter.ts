/**
 * Lightweight IndexedDB adapter for persisting challenge code.
 * 
 * We use IndexedDB instead of localStorage because:
 * 1. Storage limits: localStorage is capped at ~5MB, which is insufficient for 10k+ challenges.
 * 2. Async I/O: localStorage is synchronous and blocks the main thread.
 * 3. Structured Cloning: IndexedDB supports storing complex objects natively (though we mostly use strings here).
 */

const DB_NAME = 'twe-storage';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;

/**
 * Opens (and upgrades if necessary) the IndexedDB database.
 */
function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error || new Error('Unknown IndexedDB open error'));
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

/**
 * Generic helper for running a transaction.
 */
async function withStore<T>(
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<void>
): Promise<T> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = callback(store);

        transaction.oncomplete = () => resolve(request.result as T);
        transaction.onerror = () => reject(transaction.error || new Error('Unknown IndexedDB transaction error'));
    });
}

export const storage = {
    /**
     * Get a value from storage.
     */
    async getItem(key: string): Promise<string | null> {
        try {
            const result = await withStore<string>('readonly', (store) => store.get(key));
            return result === undefined ? null : result;
        } catch (error) {
            console.error('Failed to get item from IndexedDB:', error);
            return null; // Fallback to null (missing) on error
        }
    },

    /**
     * Set a value in storage.
     */
    async setItem(key: string, value: string): Promise<void> {
        try {
            await withStore('readwrite', (store) => store.put(value, key));
        } catch (error) {
            console.error('Failed to set item in IndexedDB:', error);
        }
    },

    /**
     * Remove a value from storage.
     */
    async removeItem(key: string): Promise<void> {
        try {
            await withStore('readwrite', (store) => store.delete(key));
        } catch (error) {
            console.error('Failed to remove item from IndexedDB:', error);
        }
    },

    /**
     * Clear all keys (use carefully).
     */
    async clear(): Promise<void> {
        try {
            await withStore('readwrite', (store) => store.clear());
        } catch (error) {
            console.error('Failed to clear IndexedDB:', error);
        }
    }
};
