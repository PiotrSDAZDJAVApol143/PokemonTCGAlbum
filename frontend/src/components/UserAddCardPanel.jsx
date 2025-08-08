import {useState} from "react";
import api from "../api";
import { AiOutlineSearch } from "react-icons/ai";

export default function UserAddCardPanel({ onCardAdded }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // DODAJEMY STAN DLA PODGLĄDU:
    const [showPreview, setShowPreview] = useState(false);
    const [previewCard, setPreviewCard] = useState(null);
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });

    // Szukanie kart
    const handleSearch = () => {
        setLoading(true);
        api.get("/cards/search", {
            params: {name: query, page: 0, size: 10},
        }).then(res => {
            setResults(res.data.content);
            setLoading(false);
        });
    };

    // Dodawanie karty
    const handleAdd = (card) => {
        api.post("/user-cards/add", {
            cardId: card.id,
            quantity: 1
        }).then(() => {
            onCardAdded();
        });
    };

    return (
        <div>
            <div className="flex gap-2 mb-2">
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="border px-2 py-1 rounded w-56"
                    placeholder="Wpisz kod lub nazwę karty"
                />
                <button onClick={handleSearch} className="px-4 py-1 bg-blue-600 text-white rounded">
                    Szukaj w Bazie Danych
                </button>
            </div>
            {loading && <div>Ładowanie...</div>}
            <div>
                {results.map(card => (
                    <div key={card.id} className="flex items-center justify-between border-b px-2 py-1 relative">
                        <span>
                            {card.numberInSet} / {card.set?.printedTotal ?? "?"} - {card.name} HP{card.hp} / {card.set?.series} - {card.set?.name}
                        </span>
                        {/* Ikona lupy z podglądem */}
                        <span
                            onMouseEnter={e => {
                                setPreviewCard(card);
                                setShowPreview(true);
                                // Do pozycjonowania tooltipa względem ikony
                                const rect = e.target.getBoundingClientRect();
                                setPreviewPos({ x: rect.left, y: rect.bottom });
                            }}
                            onMouseLeave={() => setShowPreview(false)}
                            className="cursor-pointer ml-2"
                            title="Szybki podgląd"
                        >
                            <AiOutlineSearch size={22} />
                        </span>
                        <button
                            className="bg-green-500 text-white px-3 py-1 rounded ml-2"
                            onClick={() => handleAdd(card)}
                        >dodaj</button>

                        {/* Szybki podgląd: tooltip */}
                        {showPreview && previewCard?.id === card.id && (
                            <div
                                className="absolute z-20 p-2 bg-white border rounded shadow-xl"
                                style={{
                                    left: 120, // Możesz dać previewPos.x jeśli chcesz pozycję globalną
                                    top: 30,
                                    minWidth: 200
                                }}
                                onMouseEnter={() => setShowPreview(true)}
                                onMouseLeave={() => setShowPreview(false)}
                            >
                                <img
                                    src={card.imageUrlSmall || card.officialArtworkUrl}
                                    alt={card.name}
                                    className="w-[120px] h-[170px] object-contain"
                                    style={{ background: "#fff", borderRadius: "8px" }}
                                />
                                <div className="text-center font-bold mt-2">{card.name}</div>
                            </div>

                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
