import api from "../api";
import {
    deleteDeckFromOfflineSnapshot,
    getOfflineDeckById,
    getOfflineDecks,
    saveDeckToOfflineSnapshot,
    saveDecksToOfflineSnapshot,
} from "./offline/offlineSnapshotStore.js";

/**
 * Serwis decków.
 *
 * Teraz działa hybrydowo:
 * - najpierw próbuje backend Spring Boot,
 * - jeśli backend odpowie, zapisuje snapshot lokalny w IndexedDB,
 * - jeśli backend nie odpowie, używa ostatniego lokalnego snapshotu.
 *
 * Offline snapshot jest read-only.
 */

function normalizeDeck(deck, options = {}) {
    if (!deck) return null;

    return {
        ...deck,
        id: deck.id,
        name: deck.name || "Bez nazwy",
        cards: Array.isArray(deck.cards) ? deck.cards : [],
        wins: Number.isFinite(deck.wins) ? deck.wins : 0,
        losses: Number.isFinite(deck.losses) ? deck.losses : 0,
        shared: !!deck.shared,
        readOnly: !!deck.readOnly || !!options.forceReadOnly,
        ownerUserId: deck.ownerUserId ?? null,
        ownerUsername: deck.ownerUsername ?? null,
        offlineSnapshot: !!deck.offlineSnapshot || !!options.offlineSnapshot,
    };
}

function normalizeDeckList(data, options = {}) {
    const raw = Array.isArray(data)
        ? data
        : data?.decks || data?.content || [];

    return raw.map((deck) => normalizeDeck(deck, options)).filter(Boolean);
}

function isNetworkLikeError(error) {
    const status = error?.response?.status;

    return (
        !error?.response ||
        error?.code === "ERR_NETWORK" ||
        error?.code === "ECONNABORTED" ||
        error?.code === "ERR_BAD_RESPONSE" ||
        status === 0 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        error?.message?.toLowerCase?.().includes("network") ||
        error?.message?.toLowerCase?.().includes("failed")
    );
}

function offlineMutationError() {
    throw new Error(
        "Ta operacja wymaga połączenia z backendem. W trybie offline snapshot jest tylko do podglądu."
    );
}

export async function getDecks() {
    try {
        const res = await api.get("/user/decks");
        const decks = normalizeDeckList(res.data);

        await saveDecksToOfflineSnapshot(decks);

        return decks;
    } catch (e) {
        if (!isNetworkLikeError(e)) {
            throw e;
        }

        const offlineDecks = await getOfflineDecks();

        return offlineDecks.map((deck) =>
            normalizeDeck(deck, {
                forceReadOnly: true,
                offlineSnapshot: true,
            })
        );
    }
}

export async function getDeckById(deckId) {
    try {
        const res = await api.get(`/user/decks/${deckId}`);
        const deck = normalizeDeck(res.data);

        await saveDeckToOfflineSnapshot(deck);

        return deck;
    } catch (e) {
        if (!isNetworkLikeError(e)) {
            throw e;
        }

        const offlineDeck = await getOfflineDeckById(deckId);

        if (!offlineDeck) {
            throw new Error("Nie znaleziono decka w lokalnym snapshotcie offline.");
        }

        return normalizeDeck(offlineDeck, {
            forceReadOnly: true,
            offlineSnapshot: true,
        });
    }
}

export async function createDeck(payload) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    const res = await api.post("/user/decks/add", payload);
    const deck = normalizeDeck(res.data);

    await saveDeckToOfflineSnapshot(deck);

    return deck;
}

export async function updateDeck(deckId, payload) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    const res = await api.put(`/user/decks/${deckId}`, payload);
    const deck = normalizeDeck(res.data);

    await saveDeckToOfflineSnapshot(deck);

    return deck;
}

export async function deleteDeck(deckId) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    await api.delete(`/user/decks/${deckId}`);
    await deleteDeckFromOfflineSnapshot(deckId);
}

export async function registerDeckWin(deckId) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    const res = await api.post(`/user/decks/${deckId}/win`);
    const deck = normalizeDeck(res.data);

    await saveDeckToOfflineSnapshot(deck);

    return deck;
}

export async function registerDeckLoss(deckId) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    const res = await api.post(`/user/decks/${deckId}/loss`);
    const deck = normalizeDeck(res.data);

    await saveDeckToOfflineSnapshot(deck);

    return deck;
}

export async function resetDeckScore(deckId) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    const res = await api.post(`/user/decks/${deckId}/reset-score`);
    const deck = normalizeDeck(res.data);

    await saveDeckToOfflineSnapshot(deck);

    return deck;
}

export async function shareDeck(deckId, targetUsername) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    await api.post(`/user/decks/${deckId}/share`, {
        targetUsername,
    });
}

/**
 * Przy przypisywaniu kart do talii nie pokazujemy read-only/offline decków.
 */
export async function getEditableDecks() {
    const decks = await getDecks();

    return decks.filter((deck) => !deck.readOnly && !deck.offlineSnapshot);
}