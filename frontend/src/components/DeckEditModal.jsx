import { useState } from "react";

export default function DeckEditModal({ deck, logos, onSave, onClose }) {
    const [name, setName] = useState(deck.name || "");
    const [logoUrl, setLogoUrl] = useState(deck.logoUrl || logos[0]);
    const [baseEnergy, setBaseEnergy] = useState(deck.baseEnergy || "");
    const [secondaryEnergy, setSecondaryEnergy] = useState(deck.secondaryEnergy || "");

    const energyOptions = [
        "Mix", "Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Fairy", "Dragon", "Colorless"
    ];

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl min-w-[350px] shadow-xl relative">
                <button className="absolute right-2 top-2 text-xl" onClick={onClose}>×</button>
                <div className="text-lg font-bold mb-2">Edytuj Deck</div>
                <label className="block font-semibold mb-1">Nazwa:</label>
                <input
                    className="border px-3 py-2 rounded w-full mb-3"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <label className="block font-semibold mb-1">Logo:</label>
                <div className="flex gap-4 my-2">
                    {logos.map(l => (
                        <img
                            key={l}
                            src={l}
                            alt="logo"
                            className={`w-14 h-14 rounded border-2 cursor-pointer transition ${logoUrl === l ? "border-blue-400" : "border-gray-300"}`}
                            onClick={() => setLogoUrl(l)}
                        />
                    ))}
                </div>
                <label className="block font-semibold mb-1 mt-2">Podstawowa energia:</label>
                <select
                    className="border px-2 py-1 rounded w-full mb-2"
                    value={baseEnergy}
                    onChange={e => setBaseEnergy(e.target.value)}
                >
                    {energyOptions.map(opt => (
                        <option value={opt} key={opt}>{opt === "" ? "Wybierz..." : opt}</option>
                    ))}
                </select>
                <label className="block font-semibold mb-1">Dodatkowa energia (opcjonalnie):</label>
                <select
                    className="border px-2 py-1 rounded w-full mb-2"
                    value={secondaryEnergy}
                    onChange={e => setSecondaryEnergy(e.target.value)}
                >
                    {energyOptions.map(opt => (
                        <option value={opt} key={opt}>{opt === "" ? "Brak" : opt}</option>
                    ))}
                </select>
                <div className="flex gap-4 mt-6 justify-end">
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        disabled={!name || !baseEnergy}
                        onClick={() => onSave({
                            name,
                            logoUrl,
                            baseEnergy,
                            secondaryEnergy: secondaryEnergy || null
                        })}
                    >Zapisz</button>
                    <button
                        className="bg-gray-200 px-4 py-2 rounded"
                        onClick={onClose}
                    >Anuluj</button>
                </div>
            </div>
        </div>
    );
}