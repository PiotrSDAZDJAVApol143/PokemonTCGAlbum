// src/pages/Account.jsx
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import axios from "axios";

export default function Account() {
    const { user, accessToken, refreshToken } = useAuth();
    const [editEmail, setEditEmail] = useState(false);
    const [editPassword, setEditPassword] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    if (!user) return null;

    const handleChangeEmail = async () => {
        if (!newEmail) return;
        setEmailLoading(true);
        try {
            await axios.put("/api/user/email", { email: newEmail }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            alert("Email zmieniony!");
            setEditEmail(false);
            setNewEmail("");
        } catch {
            alert("Błąd zmiany emaila!");
        } finally {
            setEmailLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword) return;
        setPasswordLoading(true);
        try {
            await axios.put("/api/user/password", { password: newPassword }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            alert("Hasło zmienione!");
            setEditPassword(false);
            setNewPassword("");
        } catch {
            alert("Błąd zmiany hasła!");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="bg-white rounded-xl shadow-lg p-8 border-4 border-black w-full max-w-2xl flex">
                {/* Lewa kolumna: avatar + nick */}
                <div className="w-1/3 pr-8">
                    <div className="mb-6 font-bold text-xl bg-gray-100 rounded-lg py-3 px-6 text-center">{user.username}</div>
                    <div className="bg-gray-200 rounded-lg flex items-center justify-center h-56">Avatar</div>
                </div>
                {/* Prawa kolumna: dane + akcje */}
                <div className="w-2/3 space-y-6">
                    <div>
                        <label className="font-bold">Login:</label>
                        <div className="bg-gray-100 rounded-lg px-4 py-2">{user.username}</div>
                    </div>
                    <div>
                        <label className="font-bold">Email:</label>
                        <div className="flex gap-2 items-center">
                            <div className="bg-gray-100 rounded-lg px-4 py-2 flex-1">email@example.com</div>
                            {!editEmail ? (
                                <button onClick={() => setEditEmail(true)} className="px-4 py-2 rounded bg-blue-300 font-bold">Zmień email</button>
                            ) : (
                                <>
                                    <input className="px-2 py-1 border rounded" placeholder="Nowy email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                                    <button className="px-4 py-2 rounded bg-green-400 font-bold"
                                            disabled={!newEmail || emailLoading}
                                            onClick={handleChangeEmail}
                                    >{emailLoading ? "..." : "Zatwierdź"}</button>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="font-bold">Hasło:</label>
                        <div className="flex gap-2 items-center">
                            <div className="bg-gray-100 rounded-lg px-4 py-2 flex-1">{showPassword ? newPassword : "************"}</div>
                            <button
                                onClick={() => setShowPassword((v) => !v)}
                                className="text-2xl"
                                title={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                            >👁️</button>
                            {!editPassword ? (
                                <button onClick={() => setEditPassword(true)} className="px-4 py-2 rounded bg-blue-300 font-bold">Zmień hasło</button>
                            ) : (
                                <>
                                    <input
                                        className="px-2 py-1 border rounded"
                                        type="password"
                                        placeholder="Nowe hasło"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                    <button className="px-4 py-2 rounded bg-green-400 font-bold"
                                            disabled={!newPassword || passwordLoading}
                                            onClick={handleChangePassword}
                                    >{passwordLoading ? "..." : "Zatwierdź"}</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
