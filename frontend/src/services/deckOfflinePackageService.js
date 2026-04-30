import api from "../api";
import { saveDeckToOfflineSnapshot } from "./offline/offlineSnapshotStore.js";

function safeFilename(value) {
    return String(value || "deck")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 80);
}

export async function downloadDeckOfflinePackage(deckId, deckName = "deck") {
    const res = await api.get(`/user/decks/${deckId}/offline-package`, {
        responseType: "blob",
    });

    const blob = new Blob([res.data], {
        type: "application/zip",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `deck-${deckId}-${safeFilename(deckName)}-offline.zip`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
}

export async function previewDeckOfflinePackage(file) {
    if (!file) {
        throw new Error("Nie wybrano pliku ZIP.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/user/offline-packages/deck-preview", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return res.data;
}

export async function importDeckOfflinePackage(file) {
    if (!file) {
        throw new Error("Nie wybrano pliku ZIP.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/user/offline-packages/deck-import", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    const result = res.data;

    if (result?.success && result?.deck) {
        saveDeckToOfflineSnapshot(result.deck);
    }

    return result;
}