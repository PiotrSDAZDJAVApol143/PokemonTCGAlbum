// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import { attachAuthInterceptors } from "../api";
import {
    isOfflineLikeError,
    isRealAuthError,
} from "../services/httpErrorUtils.js";

const AuthContext = createContext();

function parseJwt(token) {
    if (!token) return null;

    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
}

function getInitialOnlineStatus() {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken") || null);
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refreshToken") || null);

    /**
     * isOnline = status przeglądarki.
     * backendUnavailable = backend Spring Boot nie odpowiada albo proxy zwraca 500/502/503/504.
     */
    const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
    const [backendUnavailable, setBackendUnavailable] = useState(false);

    const offlineAuthMode = !!user && !!accessToken && (!isOnline || backendUnavailable);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setBackendUnavailable(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
    }, [user]);

    useEffect(() => {
        if (accessToken) localStorage.setItem("accessToken", accessToken);
        else localStorage.removeItem("accessToken");
    }, [accessToken]);

    useEffect(() => {
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        else localStorage.removeItem("refreshToken");
    }, [refreshToken]);

    const login = ({ username, accessToken, refreshToken }) => {
        setUser({ username });
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setBackendUnavailable(false);
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setBackendUnavailable(false);
    };

    const markBackendUnavailable = () => {
        setBackendUnavailable(true);
    };

    const markBackendAvailable = () => {
        setBackendUnavailable(false);
    };

    const refreshInFlightRef = useRef(null);

    const refreshAccessToken = async () => {
        if (!refreshToken) throw new Error("No refresh token");

        if (refreshInFlightRef.current) return refreshInFlightRef.current;

        refreshInFlightRef.current = (async () => {
            const res = await api.post("/auth/refresh", { refreshToken });

            const newAccess = res.data?.accessToken;
            const newRefresh = res.data?.refreshToken;

            if (!newAccess) {
                throw new Error("Refresh response missing accessToken");
            }

            setAccessToken(newAccess);

            if (newRefresh) {
                setRefreshToken(newRefresh);
            }

            setBackendUnavailable(false);

            return newAccess;
        })();

        try {
            return await refreshInFlightRef.current;
        } finally {
            refreshInFlightRef.current = null;
        }
    };

    const refreshTimerRef = useRef(null);

    useEffect(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        if (!accessToken || !refreshToken) return;

        const decoded = parseJwt(accessToken);
        const expSec = decoded?.exp;

        if (!expSec) return;

        const now = Date.now();
        const expMs = expSec * 1000;
        const refreshAt = expMs - 60_000;
        const delay = Math.max(5_000, refreshAt - now);

        refreshTimerRef.current = setTimeout(async () => {
            try {
                await refreshAccessToken();
            } catch (error) {
                /**
                 * Backend niedostępny — NIE logoutujemy.
                 * Użytkownik zostaje w aplikacji i może używać snapshotu offline.
                 */
                if (isOfflineLikeError(error) && !isRealAuthError(error)) {
                    markBackendUnavailable();
                    return;
                }

                /**
                 * Realny błąd auth — logout.
                 */
                logout();
            }
        }, delay);

        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, refreshToken]);

    /**
     * Gdy przeglądarka wróci online, spróbuj odświeżyć token.
     * Jeśli backend dalej nie działa, zostajemy w trybie offline.
     */
    useEffect(() => {
        if (!isOnline || !user || !refreshToken) return;

        let cancelled = false;

        const tryRefreshAfterOnline = async () => {
            try {
                await refreshAccessToken();

                if (!cancelled) {
                    markBackendAvailable();
                }
            } catch (error) {
                if (cancelled) return;

                if (isOfflineLikeError(error) && !isRealAuthError(error)) {
                    markBackendUnavailable();
                    return;
                }

                logout();
            }
        };

        tryRefreshAfterOnline();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    useEffect(() => {
        const detach = attachAuthInterceptors({
            getAccessToken: () => accessToken,
            refreshAccessToken,
            logout,
            notifyOfflineAuthProblem: markBackendUnavailable,
        });

        return () => detach?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, refreshToken]);

    const authValue = useMemo(
        () => ({
            user,
            accessToken,
            refreshToken,
            login,
            logout,
            refreshAccessToken,

            isOnline,
            backendUnavailable,
            offlineAuthMode,

            markBackendUnavailable,
            markBackendAvailable,
        }),
        [user, accessToken, refreshToken, isOnline, backendUnavailable, offlineAuthMode]
    );

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}