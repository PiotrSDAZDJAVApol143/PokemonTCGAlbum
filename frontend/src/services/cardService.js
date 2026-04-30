import api from "../api";
import { getOfflineCardById } from "./offline/offlineSnapshotStore.js";

/**
 * Serwis kart.
 *
 * Online:
 * - pobiera karty z backendu.
 *
 * Offline:
 * - odczytuje kartę z lokalnego snapshotu IndexedDB.
 */

function normalizeCardSummary(card) {
    if (!card) return null;

    return {
        ...card,
        id: card.id || card.cardId,
        name: card.name || card.cardName,
    };
}

function normalizeOfflineCard(card) {
    if (!card) return null;

    return {
        ...card,
        id: card.id || card.cardId,
        name: card.name || card.cardName || "Nieznana karta",
        attacks: Array.isArray(card.attacks) ? card.attacks : [],
        abilities: Array.isArray(card.abilities) ? card.abilities : [],
        rules: Array.isArray(card.rules) ? card.rules : [],
        offlineSnapshot: true,
        readOnly: true,
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

export async function getCardById(cardId) {
    if (!cardId) {
        throw new Error("Brak ID karty.");
    }

    try {
        const res = await api.get(`/cards/${cardId}`);
        return res.data;
    } catch (e) {
        if (!isNetworkLikeError(e)) {
            throw e;
        }

        const offlineCard = await getOfflineCardById(cardId);

        if (!offlineCard) {
            throw new Error("Nie znaleziono karty w lokalnym snapshotcie offline.");
        }

        return normalizeOfflineCard(offlineCard);
    }
}

export async function searchPublicCards({ page = 0, size = 10, name = "", setId = "" }) {
    const params = { page, size };

    if (name) params.name = name;
    if (setId) params.setId = setId;

    const res = await api.get("/cards/search", { params });

    const content = res.data?.content ?? [];

    return {
        content: content.map(normalizeCardSummary).filter(Boolean),
        totalPages: res.data?.totalPages ?? 1,
    };
}