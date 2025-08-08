import { useState, useEffect } from "react";
import api from "../api";

export default function DeckSelectModal({ onSelect, onCancel }) {
    const [decks, setDecks] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        // Pobierz decki usera – zmień endpoint, jeśli masz inny!
        api.get("/user/decks")
            .then(res => {
                // Dodaj loga poniżej:
                console.log("USER DECKS response:", res.data);

                // Jeżeli odpowiedź to tablica -> OK
                // Jeżeli nie -> szukaj tablicy wewnątrz (np. res.data.decks albo res.data.content), albo daj pustą
                setDecks(
                    Array.isArray(res.data)
                        ? res.data
                        : (res.data.decks || res.data.content || [])
                );
            })
            .catch(() => setDecks([]));
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl min-w-[350px] shadow-xl relative">
                <button className="absolute right-2 top-2 text-xl" onClick={onCancel}>×</button>
                <div className="text-lg font-bold mb-4">Wybierz talię do przypisania karty</div>
                <select
                    className="border px-4 py-2 rounded w-full"
                    value={selected || ""}
                    onChange={e => setSelected(e.target.value)}
                >
                    <option value="">-- Wybierz talię --</option>
                    {decks.map(deck => (
                        <option key={deck.id} value={deck.id}>{deck.name}</option>
                    ))}
                </select>
                <div className="flex justify-end gap-3 mt-8">
                    <button
                        className="bg-gray-200 px-4 py-2 rounded"
                        onClick={onCancel}
                    >Anuluj</button>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        disabled={!selected}
                        onClick={() => onSelect(selected)}
                    >Przypisz</button>
                </div>
            </div>
        </div>
    );
}
