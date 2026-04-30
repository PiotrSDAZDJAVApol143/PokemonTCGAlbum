import api from "../api";

/**
 * Serwis funkcji DEV związanych z ocenami kart.
 *
 * Docelowo zostanie w DEV Console, a nie w zwykłej aplikacji rodzinnej offline.
 */

export async function saveOverallRating(cardId, rating) {
    await api.patch(`/dev/${cardId}/rating`, { rating });
}

export async function recalcCardRating(cardId) {
    await api.patch(`/dev/${cardId}/recalc-rating`);
}

export async function saveAttackRating(defId, rating) {
    await api.patch(`/dev/attack-defs/${defId}/rating`, { rating });
}

export async function saveAbilityRating(defId, rating) {
    await api.patch(`/dev/ability-defs/${defId}/rating`, { rating });
}

export async function saveRuleRating(ruleId, rating) {
    await api.patch(`/dev/rule/${ruleId}/rating`, { rating });
}