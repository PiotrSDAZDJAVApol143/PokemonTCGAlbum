const DB_NAME = "pokemon_tcg_offline_db";
const DB_VERSION = 1;

export const OFFLINE_STORES = {
    DECKS: "decks",
    CARDS: "cards",
    METADATA: "metadata",
};

export function openOfflineDb() {
    if (typeof window === "undefined" || !window.indexedDB) {
        return Promise.reject(new Error("IndexedDB is not available."));
    }

    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(OFFLINE_STORES.DECKS)) {
                db.createObjectStore(OFFLINE_STORES.DECKS, {
                    keyPath: "id",
                });
            }

            if (!db.objectStoreNames.contains(OFFLINE_STORES.CARDS)) {
                db.createObjectStore(OFFLINE_STORES.CARDS, {
                    keyPath: "id",
                });
            }

            if (!db.objectStoreNames.contains(OFFLINE_STORES.METADATA)) {
                db.createObjectStore(OFFLINE_STORES.METADATA, {
                    keyPath: "key",
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Cannot open IndexedDB."));
        request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked."));
    });
}

export function requestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
    });
}

export function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
            reject(transaction.error || new Error("IndexedDB transaction failed."));
        transaction.onabort = () =>
            reject(transaction.error || new Error("IndexedDB transaction aborted."));
    });
}

export async function getAllFromStore(storeName) {
    const db = await openOfflineDb();

    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    const result = await requestToPromise(store.getAll());

    await transactionDone(tx);

    return result || [];
}

export async function getOneFromStore(storeName, key) {
    const db = await openOfflineDb();

    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    const result = await requestToPromise(store.get(key));

    await transactionDone(tx);

    return result || null;
}

export async function putOneToStore(storeName, value) {
    const db = await openOfflineDb();

    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    store.put(value);

    await transactionDone(tx);
}

export async function deleteOneFromStore(storeName, key) {
    const db = await openOfflineDb();

    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    store.delete(key);

    await transactionDone(tx);
}

export async function clearStore(storeName) {
    const db = await openOfflineDb();

    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    store.clear();

    await transactionDone(tx);
}