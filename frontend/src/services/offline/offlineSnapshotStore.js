import {
    OFFLINE_STORES,
    clearStore,
    deleteOneFromStore,
    getAllFromStore,
    getOneFromStore,
    openOfflineDb,
    putOneToStore,
    transactionDone,
} from "./offlineDb.js";

const OLD_LOCAL_STORAGE_KEY = "pokemon_tcg_offline_snapshot_v1";
const SNAPSHOT_VERSION = 2;

function emptySnapshot() {
    return {
        version: SNAPSHOT_VERSION,
        savedAt: null,
        decks: [],
        cardsById: {},
    };
}

function safeParseJson(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function normalizeDeck(deck) {
    if (!deck) return null;

    return {
        ...deck,
        id: deck.id,
        name: deck.name || "Bez nazwy",
        cards: Array.isArray(deck.cards) ? deck.cards : [],
        wins: Number.isFinite(deck.wins) ? deck.wins : 0,
        losses: Number.isFinite(deck.losses) ? deck.losses : 0,
        shared: !!deck.shared,
        readOnly: deck.readOnly ?? false,
        ownerUserId: deck.ownerUserId ?? null,
        ownerUsername: deck.ownerUsername ?? null,
        offlineSnapshot: true,
    };
}

function normalizeCard(card) {
    if (!card?.id) return null;

    return {
        ...card,
        id: card.id,
    };
}

function extractCardsFromDecks(decks) {
    const cardsById = {};

    for (const deck of decks || []) {
        for (const deckCard of deck.cards || []) {
            const card = deckCard?.card;

            if (!card?.id) {
                continue;
            }

            cardsById[card.id] = {
                ...cardsById[card.id],
                ...card,
            };
        }
    }

    return cardsById;
}

function objectFromCards(cards) {
    const result = {};

    for (const card of cards || []) {
        if (card?.id) {
            result[card.id] = card;
        }
    }

    return result;
}

async function getMetadataValue(key) {
    const row = await getOneFromStore(OFFLINE_STORES.METADATA, key);
    return row?.value ?? null;
}

async function setMetadataValue(key, value) {
    await putOneToStore(OFFLINE_STORES.METADATA, {
        key,
        value,
    });
}

/**
 * Migracja ze starego localStorage do IndexedDB.
 * Dzięki temu po podmianie kodu nie stracisz dotychczasowego snapshotu.
 */
async function migrateOldLocalStorageSnapshotIfNeeded() {
    if (typeof window === "undefined") {
        return;
    }

    const alreadyMigrated = await getMetadataValue("localStorageMigrationDone");

    if (alreadyMigrated) {
        return;
    }

    const existingDecks = await getAllFromStore(OFFLINE_STORES.DECKS);

    if (existingDecks.length > 0) {
        await setMetadataValue("localStorageMigrationDone", true);
        return;
    }

    const raw = window.localStorage.getItem(OLD_LOCAL_STORAGE_KEY);
    const parsed = safeParseJson(raw);

    if (!parsed || !Array.isArray(parsed.decks)) {
        await setMetadataValue("localStorageMigrationDone", true);
        return;
    }

    const safeDecks = parsed.decks
        .map(normalizeDeck)
        .filter(Boolean);

    const cardsFromDecks = extractCardsFromDecks(safeDecks);
    const cardsFromOldSnapshot = parsed.cardsById || {};

    const cardsById = {
        ...cardsFromOldSnapshot,
        ...cardsFromDecks,
    };

    const db = await openOfflineDb();

    const tx = db.transaction(
        [OFFLINE_STORES.DECKS, OFFLINE_STORES.CARDS, OFFLINE_STORES.METADATA],
        "readwrite"
    );

    const deckStore = tx.objectStore(OFFLINE_STORES.DECKS);
    const cardStore = tx.objectStore(OFFLINE_STORES.CARDS);
    const metadataStore = tx.objectStore(OFFLINE_STORES.METADATA);

    for (const deck of safeDecks) {
        deckStore.put(deck);
    }

    for (const card of Object.values(cardsById)) {
        const normalizedCard = normalizeCard(card);

        if (normalizedCard) {
            cardStore.put(normalizedCard);
        }
    }

    metadataStore.put({
        key: "version",
        value: SNAPSHOT_VERSION,
    });

    metadataStore.put({
        key: "savedAt",
        value: parsed.savedAt || new Date().toISOString(),
    });

    metadataStore.put({
        key: "localStorageMigrationDone",
        value: true,
    });

    await transactionDone(tx);
}

export async function loadOfflineSnapshot() {
    if (typeof window === "undefined") {
        return emptySnapshot();
    }

    try {
        await migrateOldLocalStorageSnapshotIfNeeded();

        const decks = await getAllFromStore(OFFLINE_STORES.DECKS);
        const cards = await getAllFromStore(OFFLINE_STORES.CARDS);
        const savedAt = await getMetadataValue("savedAt");

        return {
            version: SNAPSHOT_VERSION,
            savedAt,
            decks: decks.map(normalizeDeck).filter(Boolean),
            cardsById: objectFromCards(cards),
        };
    } catch (e) {
        console.error("Cannot load offline snapshot from IndexedDB:", e);
        return emptySnapshot();
    }
}

export async function saveDecksToOfflineSnapshot(decks) {
    if (typeof window === "undefined") {
        return;
    }

    const safeDecks = Array.isArray(decks)
        ? decks.map(normalizeDeck).filter(Boolean)
        : [];

    const cardsById = extractCardsFromDecks(safeDecks);
    const savedAt = new Date().toISOString();

    const db = await openOfflineDb();

    const tx = db.transaction(
        [OFFLINE_STORES.DECKS, OFFLINE_STORES.CARDS, OFFLINE_STORES.METADATA],
        "readwrite"
    );

    const deckStore = tx.objectStore(OFFLINE_STORES.DECKS);
    const cardStore = tx.objectStore(OFFLINE_STORES.CARDS);
    const metadataStore = tx.objectStore(OFFLINE_STORES.METADATA);

    deckStore.clear();

    for (const deck of safeDecks) {
        deckStore.put(deck);
    }

    for (const card of Object.values(cardsById)) {
        const normalizedCard = normalizeCard(card);

        if (normalizedCard) {
            cardStore.put(normalizedCard);
        }
    }

    metadataStore.put({
        key: "version",
        value: SNAPSHOT_VERSION,
    });

    metadataStore.put({
        key: "savedAt",
        value: savedAt,
    });

    metadataStore.put({
        key: "localStorageMigrationDone",
        value: true,
    });

    await transactionDone(tx);
}

export async function saveDeckToOfflineSnapshot(deck) {
    if (!deck?.id || typeof window === "undefined") {
        return;
    }

    const normalizedDeck = normalizeDeck(deck);
    const cardsById = extractCardsFromDecks([normalizedDeck]);
    const savedAt = new Date().toISOString();

    const db = await openOfflineDb();

    const tx = db.transaction(
        [OFFLINE_STORES.DECKS, OFFLINE_STORES.CARDS, OFFLINE_STORES.METADATA],
        "readwrite"
    );

    const deckStore = tx.objectStore(OFFLINE_STORES.DECKS);
    const cardStore = tx.objectStore(OFFLINE_STORES.CARDS);
    const metadataStore = tx.objectStore(OFFLINE_STORES.METADATA);

    deckStore.put(normalizedDeck);

    for (const card of Object.values(cardsById)) {
        const normalizedCard = normalizeCard(card);

        if (normalizedCard) {
            cardStore.put(normalizedCard);
        }
    }

    metadataStore.put({
        key: "version",
        value: SNAPSHOT_VERSION,
    });

    metadataStore.put({
        key: "savedAt",
        value: savedAt,
    });

    metadataStore.put({
        key: "localStorageMigrationDone",
        value: true,
    });

    await transactionDone(tx);
}

export async function getOfflineDecks() {
    const snapshot = await loadOfflineSnapshot();
    return snapshot.decks || [];
}

export async function getOfflineDeckById(deckId) {
    if (deckId == null) {
        return null;
    }

    const numericId = Number(deckId);

    if (Number.isFinite(numericId)) {
        try {
            const deck = await getOneFromStore(OFFLINE_STORES.DECKS, numericId);

            if (deck) {
                return normalizeDeck(deck);
            }
        } catch {
            // fallback niżej
        }
    }

    try {
        const deck = await getOneFromStore(OFFLINE_STORES.DECKS, String(deckId));

        if (deck) {
            return normalizeDeck(deck);
        }
    } catch {
        // fallback niżej
    }

    const decks = await getOfflineDecks();

    return (
        decks.find((item) => String(item.id) === String(deckId)) ||
        null
    );
}

export async function getOfflineCardById(cardId) {
    if (!cardId) {
        return null;
    }

    const card = await getOneFromStore(OFFLINE_STORES.CARDS, cardId);

    return card || null;
}

export async function clearOfflineSnapshot() {
    if (typeof window === "undefined") {
        return;
    }

    await clearStore(OFFLINE_STORES.DECKS);
    await clearStore(OFFLINE_STORES.CARDS);
    await clearStore(OFFLINE_STORES.METADATA);

    window.localStorage.removeItem(OLD_LOCAL_STORAGE_KEY);

    await setMetadataValue("version", SNAPSHOT_VERSION);
    await setMetadataValue("savedAt", null);
    await setMetadataValue("localStorageMigrationDone", true);
}

export async function getOfflineSnapshotInfo() {
    const snapshot = await loadOfflineSnapshot();

    return {
        savedAt: snapshot.savedAt,
        deckCount: snapshot.decks?.length || 0,
        cardCount: Object.keys(snapshot.cardsById || {}).length,
    };
}

export async function deleteDeckFromOfflineSnapshot(deckId) {
    if (!deckId || typeof window === "undefined") {
        return;
    }

    const numericId = Number(deckId);

    if (Number.isFinite(numericId)) {
        try {
            await deleteOneFromStore(OFFLINE_STORES.DECKS, numericId);
        } catch {
            // próbujemy string niżej
        }
    }

    try {
        await deleteOneFromStore(OFFLINE_STORES.DECKS, String(deckId));
    } catch {
        // jeśli nie było takiego wpisu, ignorujemy
    }

    await setMetadataValue("savedAt", new Date().toISOString());
}