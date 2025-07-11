// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });
    const [accessToken, setAccessToken] = useState(() =>
        localStorage.getItem("accessToken") || null
    );
    const [refreshToken, setRefreshToken] = useState(() =>
        localStorage.getItem("refreshToken") || null
    );

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
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, refreshToken, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
