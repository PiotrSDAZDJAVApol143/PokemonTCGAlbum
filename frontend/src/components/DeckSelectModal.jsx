import { useEffect, useMemo, useState } from "react";
import api from "../api";

export default function DeckSelectModal({ onSelect, onCancel }) {
    const [decks, setDecks] = useState([]);
    const [selected, setSelected] = useState("");

    // Filtry energii
    const [filterE1, setFilterE1] = useState(""); // "" = dowolna
    const [filterE2, setFilterE2] = useState(""); // "" = dowolna

    const energyOptions = [
        "", // dowolna
        "Mix",
        "Fire",
        "Water",
        "Grass",
        "Lightning",
        "Psychic",
        "Fighting",
        "Darkness",
        "Metal",
        "Fairy",
        "Dragon",
        "Colorless",
    ];

    useEffect(() => {
        api
            .get("/user/decks")
            .then((res) => {
                const list = Array.isArray(res.data)
                    ? res.data
                    : res.data?.decks || res.data?.content || [];
                setDecks(list);
            })
            .catch(() => setDecks([]));
    }, []);

    // --- helpery ---
    const norm = (v) => String(v ?? "").trim();

    const matchesOneEnergy = (deck, e) => {
        const b = norm(deck.baseEnergy);
        const s = norm(deck.secondaryEnergy);
        return b === e || s === e;
    };

    const matchesTwoEnergiesAnyOrder = (deck, e1, e2) => {
        const b = norm(deck.baseEnergy);
        const s = norm(deck.secondaryEnergy);

        // Musi mieć oba typy energii (druga może być null/"" -> wtedy nie spełni warunku)
        // Dopuszczamy dokładny duet w dowolnej kolejności:
        return (b === e1 && s === e2) || (b === e2 && s === e1);
    };

    // Lista decków po filtrach
    const filteredDecks = useMemo(() => {
        const e1 = norm(filterE1);
        const e2 = norm(filterE2);

        // brak filtrów -> wszystko
        if (!e1 && !e2) return decks;

        // tylko jedna energia
        if (e1 && !e2) return decks.filter((d) => matchesOneEnergy(d, e1));
        if (!e1 && e2) return decks.filter((d) => matchesOneEnergy(d, e2));

        // dwie energie -> duet bez względu na kolejność
        if (e1 && e2) return decks.filter((d) => matchesTwoEnergiesAnyOrder(d, e1, e2));

        return decks;
    }, [decks, filterE1, filterE2]);

    // Jeśli aktualnie wybrana talia “wypadnie” z filtrów – wyczyść selection
    useEffect(() => {
        if (!selected) return;
        const stillExists = filteredDecks.some((d) => String(d.id) === String(selected));
        if (!stillExists) setSelected("");
    }, [filteredDecks, selected]);

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl min-w-[420px] shadow-xl relative">
                <button className="absolute right-2 top-2 text-xl" onClick={onCancel}>
                    ×
                </button>

                <div className="text-lg font-bold mb-4">Wybierz talię do przypisania karty</div>

                {/* ===== FILTRY ENERGII ===== */}
                <div className="mb-4 p-3 rounded-lg bg-gray-50 border">
                    <div className="font-semibold mb-2">Filtruj po energiach</div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Energia 1</label>
                            <select
                                className="border px-3 py-2 rounded w-full"
                                value={filterE1}
                                onChange={(e) => setFilterE1(e.target.value)}
                            >
                                {energyOptions.map((opt) => (
                                    <option key={`e1-${opt || "any"}`} value={opt}>
                                        {opt === "" ? "Dowolna" : opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Energia 2</label>
                            <select
                                className="border px-3 py-2 rounded w-full"
                                value={filterE2}
                                onChange={(e) => setFilterE2(e.target.value)}
                            >
                                {energyOptions.map((opt) => (
                                    <option key={`e2-${opt || "any"}`} value={opt}>
                                        {opt === "" ? "Dowolna" : opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-600">
                            Wynik: <b>{filteredDecks.length}</b> / {decks.length}
                        </div>

                        <button
                            type="button"
                            className="text-sm px-3 py-1.5 rounded bg-white border hover:bg-gray-100"
                            onClick={() => {
                                setFilterE1("");
                                setFilterE2("");
                            }}
                        >
                            Wyczyść filtry
                        </button>
                    </div>
                </div>

                {/* ===== SELECT DECK ===== */}
                <label className="block text-sm font-semibold mb-1">Lista talii</label>
                <select
                    className="border px-4 py-2 rounded w-full"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                >
                    <option value="">-- Wybierz talię --</option>

                    {filteredDecks.map((deck) => {
                        const b = norm(deck.baseEnergy);
                        const s = norm(deck.secondaryEnergy);
                        const energiesLabel = b && s ? `${b} / ${s}` : b ? b : "-";

                        return (
                            <option key={deck.id} value={String(deck.id)}>
                                {deck.name} ({energiesLabel})
                            </option>
                        );
                    })}
                </select>

                <div className="flex justify-end gap-3 mt-8">
                    <button className="bg-gray-200 px-4 py-2 rounded" onClick={onCancel}>
                        Anuluj
                    </button>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-40"
                        disabled={!selected}
                        onClick={() => onSelect(selected)}
                    >
                        Przypisz
                    </button>
                </div>
            </div>
        </div>
    );
}