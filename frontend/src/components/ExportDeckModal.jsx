import { useEffect, useMemo, useState } from "react";
import api from "../api";

export default function ExportDeckModal({ deck, onClose, onSuccess }) {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUsername, setSelectedUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await api.get("/user/search", { params: { query } });
                if (cancelled) return;
                const list = Array.isArray(res.data) ? res.data : [];
                setUsers(list);
            } catch {
                if (!cancelled) setUsers([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 220);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const selectedUser = useMemo(
        () => users.find((u) => u.username === selectedUsername) || null,
        [users, selectedUsername]
    );

    const handleExport = async () => {
        if (!selectedUsername || !deck?.id) return;

        try {
            setSubmitting(true);
            setMessage("");
            await api.post(`/user/decks/${deck.id}/share`, { targetUsername: selectedUsername });
            setMessage(`Deck został udostępniony użytkownikowi ${selectedUsername}.`);
            onSuccess?.(selectedUsername);
        } catch (e) {
            setMessage(e?.response?.data?.message || e?.response?.data || "Nie udało się wyeksportować decka.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50 px-4">
            <div className="bg-white w-full max-w-[560px] rounded-2xl shadow-2xl p-6 relative">
                <button className="absolute right-3 top-2 text-2xl" onClick={onClose}>×</button>

                <div className="text-xl font-extrabold mb-1">Eksportuj deck</div>
                <div className="text-sm text-gray-600 mb-4">
                    Deck <b>{deck?.name}</b> zostanie udostępniony jako widok read-only. Odbiorca zobaczy karty i układ talii,
                    ale nie będzie mógł edytować Twojego decka.
                </div>

                <label className="block text-sm font-semibold mb-1">Szukaj użytkownika</label>
                <input
                    className="border px-3 py-2 rounded w-full mb-3"
                    placeholder="Wpisz login użytkownika…"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSelectedUsername("");
                        setMessage("");
                    }}
                />

                <div className="border rounded-xl max-h-[260px] overflow-y-auto bg-gray-50">
                    {loading ? (
                        <div className="p-3 text-sm text-gray-500">Szukam użytkowników…</div>
                    ) : users.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">Brak wyników.</div>
                    ) : (
                        users.map((user) => {
                            const active = selectedUsername === user.username;
                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition ${
                                        active ? "bg-indigo-100" : "hover:bg-gray-100"
                                    }`}
                                    onClick={() => {
                                        setSelectedUsername(user.username);
                                        setMessage("");
                                    }}
                                >
                                    <div className="font-semibold">{user.username}</div>
                                    <div className="text-xs text-gray-500">Konto docelowe do współdzielenia decka</div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="mt-3 text-sm text-gray-700 min-h-[24px]">
                    {selectedUser ? (
                        <span>Wybrano: <b>{selectedUser.username}</b></span>
                    ) : (
                        <span>Wybierz konto, które ma dostać widmowy podgląd tej talii.</span>
                    )}
                </div>

                {message && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-100 text-sm text-gray-800">
                        {message}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <button className="bg-gray-200 px-4 py-2 rounded" onClick={onClose}>
                        Zamknij
                    </button>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-40"
                        disabled={!selectedUsername || submitting}
                        onClick={handleExport}
                    >
                        {submitting ? "Eksportuję…" : "Eksportuj deck"}
                    </button>
                </div>
            </div>
        </div>
    );
}
