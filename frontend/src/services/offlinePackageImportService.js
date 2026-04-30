import api from "../api";

/**
 * Import paczek offline.
 */

export async function previewDeckOfflinePackage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/user/offline-packages/deck-preview", formData);

    return res.data;
}

export async function importDeckOfflinePackage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/user/offline-packages/deck-import", formData);

    return res.data;
}