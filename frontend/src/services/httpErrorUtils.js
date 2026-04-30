export function getHttpStatus(error) {
    return error?.response?.status ?? null;
}

export function isOfflineLikeError(error) {
    const status = getHttpStatus(error);
    const code = error?.code;
    const message = String(error?.message || "").toLowerCase();

    return (
        !error?.response ||
        code === "ERR_NETWORK" ||
        code === "ECONNABORTED" ||
        code === "ERR_BAD_RESPONSE" ||
        status === 0 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        message.includes("network") ||
        message.includes("failed") ||
        message.includes("timeout")
    );
}

export function isRealAuthError(error) {
    const status = getHttpStatus(error);
    return status === 401 || status === 403;
}

export function isAuthEndpoint(url) {
    const safeUrl = String(url || "");
    return (
        safeUrl.includes("/auth/login") ||
        safeUrl.includes("/auth/refresh") ||
        safeUrl.includes("/auth/logout")
    );
}