const CARD_IMAGE_CACHE_NAME = "pokemon-tcg-card-images-v1";

function getCardId(cardOrId) {
    if (!cardOrId) return null;

    if (typeof cardOrId === "string") {
        return cardOrId;
    }

    return cardOrId.id || cardOrId.cardId || null;
}

function normalizeSize(size) {
    return size === "large" ? "large" : "small";
}

export function buildBackendCardImageUrl(cardOrId, size = "small") {
    const cardId = getCardId(cardOrId);

    if (!cardId) {
        return null;
    }

    return `/api/card-images/${encodeURIComponent(cardId)}/${normalizeSize(size)}`;
}

export function buildRemoteFallbackCardImageUrl(card, size = "small") {
    if (!card) return null;

    if (normalizeSize(size) === "large") {
        return card.imageUrlLarge || card.imageUrlSmall || null;
    }

    return card.imageUrlSmall || card.imageUrlLarge || null;
}

export async function getCachedCardImageBlobUrl(card, size = "small") {
    if (!("caches" in window)) {
        return null;
    }

    const url = buildBackendCardImageUrl(card, size);

    if (!url) {
        return null;
    }

    const cache = await caches.open(CARD_IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (!cachedResponse) {
        return null;
    }

    const blob = await cachedResponse.blob();

    return URL.createObjectURL(blob);
}

export async function fetchAndCacheCardImageBlobUrl(card, size = "small") {
    if (!("caches" in window)) {
        return null;
    }

    const url = buildBackendCardImageUrl(card, size);

    if (!url) {
        return null;
    }

    const cache = await caches.open(CARD_IMAGE_CACHE_NAME);

    const response = await fetch(url, {
        method: "GET",
        cache: "reload",
    });

    if (!response.ok) {
        throw new Error(`Cannot fetch image ${url}. Status: ${response.status}`);
    }

    await cache.put(url, response.clone());

    const blob = await response.blob();

    return URL.createObjectURL(blob);
}

export async function getCardImageBlobUrlWithCache(card, size = "small") {
    const cached = await getCachedCardImageBlobUrl(card, size);

    if (cached) {
        return cached;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return null;
    }

    return fetchAndCacheCardImageBlobUrl(card, size);
}

export async function preloadCardImagesToBrowserCache(cardIds, options = {}) {
    const ids = [...new Set((cardIds || []).filter(Boolean))];

    const includeSmall = options.small ?? true;
    const includeLarge = options.large ?? true;

    let requested = 0;
    let success = 0;
    let failed = 0;

    for (const cardId of ids) {
        if (includeSmall) {
            requested++;

            try {
                const blobUrl = await fetchAndCacheCardImageBlobUrl(cardId, "small");
                if (blobUrl) URL.revokeObjectURL(blobUrl);
                success++;
            } catch {
                failed++;
            }
        }

        if (includeLarge) {
            requested++;

            try {
                const blobUrl = await fetchAndCacheCardImageBlobUrl(cardId, "large");
                if (blobUrl) URL.revokeObjectURL(blobUrl);
                success++;
            } catch {
                failed++;
            }
        }
    }

    return {
        cardCount: ids.length,
        requested,
        success,
        failed,
    };
}

export async function clearBrowserCardImageCache() {
    if (!("caches" in window)) {
        return false;
    }

    return caches.delete(CARD_IMAGE_CACHE_NAME);
}
export async function saveCardImageBlobToBrowserCache(cardOrId, size = "small", blob) {
    if (!("caches" in window)) {
        throw new Error("Cache API nie jest dostępne w tej przeglądarce.");
    }

    const url = buildBackendCardImageUrl(cardOrId, size);

    if (!url) {
        throw new Error("Nie można zbudować URL obrazu karty.");
    }

    if (!blob) {
        throw new Error("Brak danych obrazu do zapisania.");
    }

    const cache = await caches.open(CARD_IMAGE_CACHE_NAME);

    const contentType =
        blob.type ||
        (normalizeSize(size) === "large" ? "image/jpeg" : "image/jpeg");

    const response = new Response(blob, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "X-Pokemon-TCG-Offline-Image": "true",
        },
    });

    await cache.put(url, response);

    return true;
}

export async function getBrowserCardImageCacheInfo() {
    if (!("caches" in window)) {
        return {
            supported: false,
            entryCount: 0,
            totalBytes: 0,
            totalMb: 0,
        };
    }

    const cache = await caches.open(CARD_IMAGE_CACHE_NAME);
    const requests = await cache.keys();

    let totalBytes = 0;

    for (const request of requests) {
        try {
            const response = await cache.match(request);
            const blob = await response.blob();
            totalBytes += blob.size || 0;
        } catch {
            // ignorujemy pojedynczy uszkodzony wpis cache
        }
    }

    return {
        supported: true,
        entryCount: requests.length,
        totalBytes,
        totalMb: Math.round((totalBytes / 1024 / 1024) * 100) / 100,
    };
}