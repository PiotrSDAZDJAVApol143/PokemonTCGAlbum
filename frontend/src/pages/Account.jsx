import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";

function parseJwt(token) {
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

function fmtTs(tsSeconds) {
    if (!tsSeconds) return "-";
    return new Date(tsSeconds * 1000).toLocaleString();
}

export default function Account() {
    const { accessToken, refreshToken, refreshAccessToken, logout } = useAuth();

    const decoded = useMemo(() => parseJwt(accessToken), [accessToken]);
    const exp = decoded?.exp ?? null;

    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState(null);

    // profil
    const [username, setUsername] = useState("");
    const [profileMsg, setProfileMsg] = useState("");

    // hasło
    const [curPwd, setCurPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [newPwd2, setNewPwd2] = useState("");
    const [pwdMsg, setPwdMsg] = useState("");

    // sesja
    const [sessionMsg, setSessionMsg] = useState("");

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const res = await api.get("/user/me"); // <-- bez /api bo masz instancję api z baseURL
                if (!alive) return;
                setMe(res.data);
                setUsername(res.data?.username ?? "");
            } catch {
                if (!alive) return;
                setMe(null);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const saveProfile = async () => {
        setProfileMsg("");
        try {
            const res = await api.patch("/user/me", { username });
            setMe(res.data);
            setProfileMsg("Zapisano profil.");
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data || e.message || "Błąd";
            setProfileMsg(`Błąd: ${msg}`);
        }
    };

    const changePassword = async () => {
        setPwdMsg("");

        if (!curPwd || !newPwd || !newPwd2) {
            setPwdMsg("Uzupełnij wszystkie pola.");
            return;
        }
        if (newPwd !== newPwd2) {
            setPwdMsg("Nowe hasła nie są identyczne.");
            return;
        }

        try {
            await api.post("/user/change-password", { currentPassword: curPwd, newPassword: newPwd });
            setPwdMsg("Hasło zmienione.");
            setCurPwd(""); setNewPwd(""); setNewPwd2("");
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data || e.message || "Błąd";
            setPwdMsg(`Błąd: ${msg}`);
        }
    };

    const doRefresh = async () => {
        await refreshAccessToken();
    };

    const doLogout = async () => {
        try {
            if (refreshToken) await api.post("/auth/logout", { refreshToken });
        } finally {
            logout();
        }
    };

    if (loading) return <div className="p-10">Ładowanie...</div>;

    return (
        <div className="min-h-[90vh] p-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-3xl font-extrabold mb-6">Twoje konto</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PROFIL */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="text-xl font-bold mb-4">Profil</div>

                        <div className="text-sm text-gray-600 mb-1">Login</div>
                        <input
                            className="border rounded w-full px-3 py-2 mb-3"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        <div className="text-sm text-gray-600 mb-1">Rola</div>
                        <div className="px-3 py-2 rounded bg-gray-50 border mb-4">
                            <b>{me?.role ?? "-"}</b>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                                onClick={saveProfile}
                            >
                                Zapisz
                            </button>
                            {profileMsg && (
                                <div
                                    className={`text-sm ${profileMsg.startsWith("Błąd") ? "text-red-600" : "text-green-700"}`}>
                                    {profileMsg}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SESJA */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="text-xl font-bold mb-4">Sesja</div>

                        <div className="text-sm text-gray-600 mb-1">Access token wygasa</div>
                        <div className="px-3 py-2 rounded bg-gray-50 border mb-4">
                            <b>{fmtTs(exp)}</b>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                className="px-4 py-2 rounded bg-amber-500 text-white hover:bg-amber-600"
                                onClick={doRefresh}
                            >
                                refreshToken
                            </button>

                            <button
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                                onClick={doLogout}
                            >
                                Wyloguj
                            </button>
                        </div>

                        {sessionMsg && (
                            <div
                                className={`mt-3 text-sm ${sessionMsg.startsWith("Błąd") ? "text-red-600" : "text-green-700"}`}>
                                {sessionMsg}
                            </div>
                        )}
                    </div>
                </div>

                {/* ZMIANA HASŁA */}
                <div className="bg-white rounded-xl shadow p-6 mt-6">
                    <div className="text-xl font-bold mb-4">Zmień hasło</div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Aktualne hasło</div>
                            <input type="password" className="border rounded w-full px-3 py-2" value={curPwd}
                                   onChange={e => setCurPwd(e.target.value)}/>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Nowe hasło</div>
                            <input type="password" className="border rounded w-full px-3 py-2" value={newPwd}
                                   onChange={e => setNewPwd(e.target.value)}/>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Powtórz nowe hasło</div>
                            <input type="password" className="border rounded w-full px-3 py-2" value={newPwd2}
                                   onChange={e => setNewPwd2(e.target.value)}/>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                        <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                onClick={changePassword}>
                            Zmień hasło
                        </button>

                        {pwdMsg && (
                            <div className={`text-sm ${pwdMsg.startsWith("Błąd") ? "text-red-600" : "text-green-700"}`}>
                                {pwdMsg}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}