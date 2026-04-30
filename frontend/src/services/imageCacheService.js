import api from "../api";

/**
 * Serwis cache obrazów.
 *
 * Teraz:
 * - rozmawia z backendem Spring Boot,
 * - backend zapisuje obrazy w lokalnym folderze cache.
 *
 * Docelowo:
 * - w aplikacji instalowanej ta logika będzie używać lokalnego storage urządzenia.
 */

export async function preloadCardImages(cardIds, options = {}) {
    const uniqueIds = [...new Set((cardIds || []).filter(Boolean))];

    const res = await api.post("/user/image-cache/preload-cards", {
        cardIds: uniqueIds,
        small: options.small ?? true,
        large: options.large ?? true,
    });

    return res.data;
}

export async function getImageCacheStats() {
    const res = await api.get("/user/image-cache/stats");
    return res.data;
}

export async function clearImageCache() {
    const res = await api.delete("/user/image-cache");
    return res.data;
}