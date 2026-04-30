import api from "../api";

/**
 * Serwis użytkowników.
 *
 * Teraz:
 * - używa backendu Spring Boot.
 *
 * Docelowo:
 * - może korzystać z lokalnych profili rodzinnych,
 * - lokalnej bazy SQLite,
 * - synchronizacji Wi-Fi.
 */

function normalizeUser(user) {
    if (!user) return null;

    return {
        id: user.id,
        username: user.username || "",
    };
}

export async function searchUsers(query = "") {
    const res = await api.get("/user/search", {
        params: { query },
    });

    const raw = Array.isArray(res.data) ? res.data : [];

    return raw.map(normalizeUser).filter(Boolean);
}