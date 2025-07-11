// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState("login");
    const [loading, setLoading] = useState(false);

    // Login form
    const [loginData, setLoginData] = useState({ username: "", password: "" });

    // Register form
    const [registerData, setRegisterData] = useState({
        username: "",
        email: "",
        password: "",
        repeatPassword: "",
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post("/api/auth/login", {
                username: loginData.username,
                password: loginData.password,
            });
            login({
                username: loginData.username,
                accessToken: res.data.accessToken,
                refreshToken: res.data.refreshToken,
            });
            navigate("/home");
        } catch (err) {
            alert("Błędny login lub hasło!");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (registerData.password !== registerData.repeatPassword) {
            alert("Hasła nie są identyczne!");
            return;
        }
        setLoading(true);
        try {
            await axios.post("/api/auth/register", {
                username: registerData.username,
                password: registerData.password,
                email: registerData.email,
            });
            alert("Konto założone! Możesz się teraz zalogować.");
            setTab("login");
        } catch (err) {
            alert("Błąd rejestracji!");
        } finally {
            setLoading(false);
        }
    };

    if (user) return null; // Po zalogowaniu nie pokazuj tej strony

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="bg-white rounded-xl shadow-lg p-8 border-4 border-black w-full max-w-xl">
                {/* Tabulator */}
                <div className="flex mb-6">
                    <button
                        onClick={() => setTab("login")}
                        className={`flex-1 py-3 font-bold text-2xl border-b-2 ${tab === "login" ? "border-black" : "border-gray-300"}`}
                    >
                        Zaloguj się
                    </button>
                    <button
                        onClick={() => setTab("register")}
                        className={`flex-1 py-3 font-bold text-2xl border-b-2 ${tab === "register" ? "border-black" : "border-gray-300"}`}
                    >
                        Zarejestruj
                    </button>
                </div>
                {tab === "login" ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block font-bold text-xl mb-2">Login:</label>
                            <input
                                className="w-full p-4 rounded-lg border-2"
                                type="text"
                                required
                                value={loginData.username}
                                onChange={e => setLoginData(l => ({ ...l, username: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-xl mb-2">Hasło:</label>
                            <input
                                className="w-full p-4 rounded-lg border-2"
                                type="password"
                                required
                                value={loginData.password}
                                onChange={e => setLoginData(l => ({ ...l, password: e.target.value }))}
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-400 to-purple-600 text-white text-lg font-bold mt-4"
                        >
                            {loading ? "Logowanie..." : "Zaloguj się"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label className="block font-bold text-xl mb-2">Login:</label>
                            <input
                                className="w-full p-4 rounded-lg border-2"
                                type="text"
                                required
                                value={registerData.username}
                                onChange={e => setRegisterData(r => ({ ...r, username: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-xl mb-2">Email:</label>
                            <input
                                className="w-full p-4 rounded-lg border-2"
                                type="email"
                                required
                                value={registerData.email}
                                onChange={e => setRegisterData(r => ({ ...r, email: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-xl mb-2">Hasło:</label>
                            <input
                                className="w-full p-4 rounded-lg border-2"
                                type="password"
                                required
                                value={registerData.password}
                                onChange={e => setRegisterData(r => ({ ...r, password: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-xl mb-2">Powtórz hasło:</label>
                            <input
                                className="w-full p-4 rounded-lg border-2"
                                type="password"
                                required
                                value={registerData.repeatPassword}
                                onChange={e => setRegisterData(r => ({ ...r, repeatPassword: e.target.value }))}
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-400 to-purple-600 text-white text-lg font-bold mt-4"
                        >
                            {loading ? "Rejestracja..." : "Zarejestruj"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
