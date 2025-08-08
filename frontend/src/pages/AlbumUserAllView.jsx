import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import UserAddCardPanel from "../components/UserAddCardPanel";

export default function AlbumUserAllView({ goBack, page = 0, setPage, search, setSearch }) {
    const [userCards, setUserCards] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState({ total: 0, unique: 0, duplicates: 0 });
    const navigate = useNavigate();
    const size = 10;

    // Pobieranie kart usera
    useEffect(() => {
        api.get("/user-cards/search", {
            params: { page, size, name: search },
        }).then(res => {
            setUserCards(res.data.content);
            setTotalPages(res.data.totalPages);
            setSummary({
                total: res.data.total,
                unique: res.data.unique,
                duplicates: res.data.duplicates
            });
        });
    }, [page, search]);

    // Funkcja do odświeżania po dodaniu karty
    const refresh = () => {
        api.get("/user-cards/search", {
            params: { page, size, name: search },
        }).then(res => {
            setUserCards(res.data.content);
            setTotalPages(res.data.totalPages);
            setSummary({
                total: res.data.total,
                unique: res.data.unique,
                duplicates: res.data.duplicates
            });
        });
    };

    return (
        <div className="px-5 pt-1">
            {/* --- Górny pasek --- */}
            <div className="flex items-center justify-between mb-5">
                <button className="px-6 py-2 rounded bg-gray-200 font-bold" onClick={goBack}>
                    ← Powrót
                </button>
                {/* Info o kolekcji */}
                <span className="ml-8 text-xl font-bold">
                    Informacje o Twojej kolekcji:&nbsp;
                    <span className="text-black">{summary.unique}</span> z {summary.total} kart
                    {summary.duplicates > 0 && (
                        <span className="text-gray-700">  (+ {summary.duplicates} duplikaty)</span>
                    )}
                </span>
                {/* --- Wyszukiwarka --- */}
                <input
                    className="border px-4 py-2 rounded w-80"
                    placeholder="Szukaj nazwę Pokemona..."
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                />
            </div>

            {/* Panel dodawania kart */}
            <div className="mb-6">
                <UserAddCardPanel onCardAdded={refresh} />
            </div>

            {/* --- Miniatury kart --- */}
            <div className="grid grid-cols-5 gap-8 mb-6">
                {userCards.map((userCard, i) => (
                    <div
                        key={userCard.cardId}
                        className="flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-105"
                        onClick={() => navigate(`/card/${userCard.cardId}`, {
                            state: {
                                page, size, name: search,
                                idxOnPage: i, view: "user"
                            }
                        })}
                        style={{ minHeight: 260 }}
                    >
                        <img
                            src={userCard.imageUrlSmall || userCard.officialArtworkUrl}
                            alt={userCard.cardName}
                            className="w-[220px] h-[310px] object-contain drop-shadow-lg"
                            style={{ background: "#fff", borderRadius: "12px" }}
                        />
                        <div className="font-bold mt-2">{userCard.cardName}</div>
                        {userCard.quantity > 1 && (
                            <span className="text-sm text-gray-500">x{userCard.quantity}</span>
                        )}
                    </div>
                ))}
            </div>
            {/* --- Paginacja --- */}
            <div className="mt-8 flex justify-center items-center gap-4">
                <button
                    className="px-4 py-2 rounded border"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                >Poprzednia</button>
                <span>{page + 1} / {totalPages}</span>
                <button
                    className="px-4 py-2 rounded border"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                >Następna</button>
            </div>
        </div>
    );
}
