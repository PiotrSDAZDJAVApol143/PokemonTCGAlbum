const CARD_PLACEHOLDER = "/card_placeholder.png";

function normalizeSize(size) {
    return size === "large" ? "large" : "small";
}

function getCardId(card) {
    return card?.id || card?.cardId || null;
}

/**
 * Od tego momentu frontend nie ładuje już obrazka bezpośrednio z internetu.
 * Frontend pyta backend:
 *
 * /api/card-images/{cardId}/small
 * /api/card-images/{cardId}/large
 *
 * Backend:
 * - sprawdza lokalny cache,
 * - jeśli trzeba, pobiera obraz,
 * - zapisuje go na dysk,
 * - zwraca obraz.
 */
export function getCardImageSrc(card, size = "small", fallback = CARD_PLACEHOLDER) {
    const cardId = getCardId(card);

    if (!cardId) {
        return fallback;
    }

    return `/api/card-images/${encodeURIComponent(cardId)}/${normalizeSize(size)}`;
}

export function getCardPlaceholder() {
    return CARD_PLACEHOLDER;
}