import api from "../api";

/**
 * Serwis kart użytkownika.
 *
 * Online:
 * - pobiera instancje kart z backendu,
 * - dodaje/usuwa/przenosi karty.
 *
 * Offline:
 * - operacje zapisu są zablokowane,
 * - szczegóły instancji zwracają pustą listę, bo snapshot decka nie jest jeszcze pełną kolekcją użytkownika.
 *
 * Docelowo:
 * - ten plik zostanie podmieniony na lokalną bazę SQLite / IndexedDB / profil rodzinny.
 */

function normalizeCardSummary(card) {
    if (!card) return null;

    return {
        ...card,
        id: card.id || card.cardId,
        name: card.name || card.cardName,
    };
}

function normalizeCardDetails(data) {
    return {
        ...data,
        instances: Array.isArray(data?.instances) ? data.instances : [],
    };
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
        "Ta operacja wymaga połączenia z backendem. W trybie offline kolekcja użytkownika jest tylko do podglądu."
    );
}

export async function searchUserCards({ page = 0, size = 10, name = "", setId = "" }) {
    const params = { page, size };

    if (name) params.name = name;
    if (setId) params.setId = setId;

    try {
        const res = await api.get("/user-cards/search", { params });

        const content = res.data?.content ?? [];

        return {
            content: content.map(normalizeCardSummary).filter(Boolean),
            totalPages: res.data?.totalPages ?? 1,
            offlineSnapshot: false,
        };
    } catch (e) {
        if (!isNetworkLikeError(e)) {
            throw e;
        }

        return {
            content: [],
            totalPages: 1,
            offlineSnapshot: true,
        };
    }
}

export async function getUserCardDetails(cardId) {
    try {
        const res = await api.get(`/user-cards/details/${cardId}`);
        return normalizeCardDetails(res.data);
    } catch (e) {
        if (!isNetworkLikeError(e)) {
            throw e;
        }

        return {
            cardId,
            instances: [],
            offlineSnapshot: true,
            readOnly: true,
        };
    }
}

export async function addCardInstance(cardId) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    try {
        await api.post("/user-cards/add-instance", { cardId });
        return getUserCardDetails(cardId);
    } catch (e) {
        if (isNetworkLikeError(e)) {
            offlineMutationError();
        }

        throw e;
    }
}

export async function deleteCardInstance(instanceId) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    try {
        await api.delete(`/user-cards/instance/${instanceId}`);
    } catch (e) {
        if (isNetworkLikeError(e)) {
            offlineMutationError();
        }

        throw e;
    }
}

export async function assignInstanceToDeck(instanceId, deckId) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    try {
        await api.post(`/user-cards/instance/${instanceId}/assign-to-deck`, { deckId });
    } catch (e) {
        if (isNetworkLikeError(e)) {
            offlineMutationError();
        }

        throw e;
    }
}

export async function removeInstanceFromDeck(instanceId) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    try {
        await api.post(`/user-cards/instance/${instanceId}/remove-from-deck`);
    } catch (e) {
        if (isNetworkLikeError(e)) {
            offlineMutationError();
        }

        throw e;
    }
}

export async function assignManyInstancesToDeck(instanceIds, deckId) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    for (const id of instanceIds) {
        await assignInstanceToDeck(id, deckId);
    }
}

export async function removeManyInstancesFromDeck(instanceIds) {
    if (!navigator.onLine) {
        offlineMutationError();
    }

    for (const id of instanceIds) {
        await removeInstanceFromDeck(id);
    }
}