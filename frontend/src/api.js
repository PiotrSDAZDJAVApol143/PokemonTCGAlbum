// src/api.js
import axios from "axios";

const api = axios.create({
    baseURL: "/api",
});

// UWAGA: w React StrictMode useEffect może odpalać 2x w dev,
// więc zadbamy o odpinanie interceptorów w setup.
export function attachAuthInterceptors({
                                           getAccessToken,
                                           refreshAccessToken,
                                           logout,
                                       }) {
    // REQUEST: dokładamy Authorization
    const reqId = api.interceptors.request.use((config) => {
        const token = getAccessToken?.();
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // RESPONSE: jeśli 401 -> refresh -> retry
    const resId = api.interceptors.response.use(
        (res) => res,
        async (error) => {
            const original = error?.config;

            // Brak configu lub nie 401 -> normalnie
            if (!original || error?.response?.status !== 401) {
                return Promise.reject(error);
            }

            // Nie próbuj refreshować gdy to i tak endpoint auth
            const url = (original.url || "").toString();
            if (url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/logout")) {
                // jeżeli tu jest 401, to znaczy że refresh token padł -> logout
                logout?.();
                return Promise.reject(error);
            }

            // zapobiegamy pętli
            if (original._retry) {
                logout?.();
                return Promise.reject(error);
            }
            original._retry = true;

            try {
                const newToken = await refreshAccessToken(); // <- musi zwrócić NOWY access token
                // ustaw header i ponów request
                original.headers = original.headers ?? {};
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            } catch (e) {
                logout?.();
                return Promise.reject(e);
            }
        }
    );

    // zwróć funkcję czyszczącą (ważne w dev)
    return () => {
        api.interceptors.request.eject(reqId);
        api.interceptors.response.eject(resId);
    };
}

export default api;