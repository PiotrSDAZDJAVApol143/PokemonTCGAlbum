// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import { attachAuthInterceptors } from "../api"; // jeśli eksportujesz z tego samego pliku

const AuthContext = createContext();

function parseJwt(token) {
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken") || null);
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refreshToken") || null);

    // ===== persist =====
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

    // ===== login / logout =====
    const login = ({ username, accessToken, refreshToken }) => {
        setUser({ username });
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
    };

    // ===== refresh (z blokadą równoległych refreshy) =====
    const refreshInFlightRef = useRef(null);

    const refreshAccessToken = async () => {
        if (!refreshToken) throw new Error("No refresh token");

        // jeśli już trwa refresh -> podłącz się
        if (refreshInFlightRef.current) return refreshInFlightRef.current;

        refreshInFlightRef.current = (async () => {
            const res = await api.post("/auth/refresh", { refreshToken }); // backend: /api/auth/refresh
            const newAccess = res.data?.accessToken;
            const newRefresh = res.data?.refreshToken; // u Ciebie zwykle ten sam, ale obsługujemy rotację

            if (!newAccess) throw new Error("Refresh response missing accessToken");

            setAccessToken(newAccess);
            if (newRefresh) setRefreshToken(newRefresh);

            return newAccess;
        })();

        try {
            return await refreshInFlightRef.current;
        } finally {
            refreshInFlightRef.current = null;
        }
    };

    // ===== auto refresh w tle (np. 60s przed exp) =====
    const refreshTimerRef = useRef(null);

    useEffect(() => {
        // wyczyść poprzedni timer
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
        const refreshAt = expMs - 60_000; // 60 sekund przed wygaśnięciem
        const delay = Math.max(5_000, refreshAt - now); // min 5s, żeby nie walić natychmiast pętlą

        refreshTimerRef.current = setTimeout(async () => {
            try {
                await refreshAccessToken();
                // po odświeżeniu tokena ten useEffect odpali się ponownie i ustawi kolejny timer
            } catch {
                // jeśli refresh padnie (np. refresh token wygasł) -> wyloguj
                logout();
            }
        }, delay);

        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, refreshToken]);

    // ===== podpinamy interceptory api (Authorization + retry po 401) =====
    useEffect(() => {
        const detach = attachAuthInterceptors({
            getAccessToken: () => accessToken,
            refreshAccessToken,
            logout,
        });

        return () => detach?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, refreshToken]); // tokeny zmienią się po refreshu/loginie

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                login,
                logout,
                refreshAccessToken, // <--- DODANE: będzie użyte w "Twoje konto"
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}