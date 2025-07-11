import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AlbumSetCardsView({
                                              setId,
                                              goBack,
                                              page,
                                              setPage,
                                              search,
                                              setSearch,
                                          }) {
    const [cards, setCards] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/api/cards/search", {
            params: { setId, page, size: 10, name: search }
        }).then(res => {
            setCards(res.data.content);
            setTotalPages(res.data.totalPages);
        });
    }, [setId, page, search]);
    useEffect(() => {
        if (!setId) return;
        axios.get("/api/cards/sets").then(res => {
            const set = res.data.find(s => s.id === setId);
            setSetInfo(set || null);
        });
    }, [setId]);

    return (
        <div className="px-5 pt-1">
            <div className="flex items-center justify-between mb-5">
                <button
                    className="px-6 py-2 rounded bg-gray-200 font-bold"
                    onClick={goBack}
                >← Powrót
                </button>
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
            <div className="text-2xl font-bold mb-4">Karty w secie</div>
            <div className="grid grid-cols-5 gap-8 mb-6">
                {cards.map((card, i) => (
                    <div
                        key={card.id}
                        className="flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-105"
                        onClick={() => navigate(`/card/${card.id}`, {
                            state: {
                                page,
                                size: 10,
                                setId,
                                search,
                                idxOnPage: i,
                                view: "set"
                            }
                        })}
                        style={{ minHeight: 260 }}
                    >
                        <img
                            src={card.imageUrlSmall || card.officialArtworkUrl}
                            alt={card.name}
                            className="w-[184px] h-[260px] object-contain drop-shadow-lg"
                            style={{ background: "#fff", borderRadius: "12px" }}
                        />
                        <div className="font-bold mt-2">{card.name}</div>
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-center items-center gap-4">
                <button
                    className="px-4 py-2 rounded border"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                >Poprzednia
                </button>
                <span>{page + 1} / {totalPages}</span>
                <button
                    className="px-4 py-2 rounded border"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                >Następna
                </button>
            </div>
        </div>
    );
}
