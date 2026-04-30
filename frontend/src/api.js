// src/api.js
import axios from "axios";
import {
    isAuthEndpoint,
    isOfflineLikeError,
    isRealAuthError,
} from "./services/httpErrorUtils.js";

const api = axios.create({
    baseURL: "/api",
});

export function attachAuthInterceptors({
                                           getAccessToken,
                                           refreshAccessToken,
                                           logout,
                                           notifyOfflineAuthProblem,
                                       }) {
    const reqId = api.interceptors.request.use((config) => {
        const token = getAccessToken?.();

        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    });

    const resId = api.interceptors.response.use(
        (res) => res,
        async (error) => {
            const original = error?.config;
            const status = error?.response?.status;
            const url = (original?.url || "").toString();

            /**
             * Bardzo ważne:
             * brak backendu / proxy 500 / network error NIE oznacza błędnego tokena.
             * W takim przypadku nie robimy logout().
             */
            if (isOfflineLikeError(error) && !isRealAuthError(error)) {
                notifyOfflineAuthProblem?.(error);
                return Promise.reject(error);
            }

            if (!original || status !== 401) {
                return Promise.reject(error);
            }

            /**
             * Jeśli /auth/login albo /auth/refresh zwróciło prawdziwe 401,
             * to token jest nieważny i logout ma sens.
             */
            if (isAuthEndpoint(url)) {
                logout?.();
                return Promise.reject(error);
            }

            if (original._retry) {
                logout?.();
                return Promise.reject(error);
            }

            original._retry = true;

            try {
                const newToken = await refreshAccessToken();

                original.headers = original.headers ?? {};
                original.headers.Authorization = `Bearer ${newToken}`;

                return api(original);
            } catch (refreshError) {
                /**
                 * Refresh nie udał się, bo backend jest offline?
                 * Nie wylogowuj. Zachowaj lokalną sesję.
                 */
                if (isOfflineLikeError(refreshError) && !isRealAuthError(refreshError)) {
                    notifyOfflineAuthProblem?.(refreshError);
                    return Promise.reject(refreshError);
                }

                /**
                 * Refresh zwrócił realne 401/403 — dopiero wtedy logout.
                 */
                logout?.();
                return Promise.reject(refreshError);
            }
        }
    );

    return () => {
        api.interceptors.request.eject(reqId);
        api.interceptors.response.eject(resId);
    };
}

export default api;