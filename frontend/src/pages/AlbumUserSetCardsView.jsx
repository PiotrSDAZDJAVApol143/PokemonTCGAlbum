import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function AlbumUserSetCardsView({
                                                  setId,
                                                  goBack,
                                                  page,
                                                  setPage,
                                                  search,
                                                  setSearch
                                              }) {
    const [cards, setCards] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [setInfo, setSetInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/user-cards/search", {
            params: { setId, page, size: 10, name: search },
        }).then(res => {
            setCards(res.data.content);
            setTotalPages(res.data.totalPages);
        });
    }, [setId, page, search]);

    useEffect(() => {
        if (!setId) return;
        api.get("/cards/sets").then(res => {
            const set = res.data.find(s => s.id === setId);
            setSetInfo(set || null);
        });
    }, [setId]);

    return (
        <div className="flex flex-col min-h-screen bg-[#f7f8fa] overflow-hidden">
            <div className="flex items-center justify-between px-14 py-4">
                <button className="px-6 py-2 rounded bg-gray-200 font-bold" onClick={goBack}>← Powrót</button>
                {setInfo &&
                    <div className="flex items-center gap-6 mx-auto">
                        {setInfo.logoUrl && (
                            <img src={setInfo.logoUrl} alt={setInfo.name} className="h-14 drop-shadow"/>
                        )}
                        <div className="flex flex-col items-start">
                            <span className="text-2xl font-bold">{setInfo.name}</span>
                            <span className="text-base text-gray-500">{setInfo.series}</span>
                        </div>
                    </div>
                }
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
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="grid grid-cols-5 gap-8 w-full max-w-[1280px] mx-auto" style={{ minHeight: 580 }}>
                    {cards.map((userCard, i) => (
                        <div
                            key={userCard.cardId}
                            className="flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-105"
                            onClick={() => navigate(`/card/${userCard.cardId}`, {
                                state: {
                                    page,
                                    size: 10,
                                    setId,
                                    search,
                                    idxOnPage: i,
                                    view: "user-set"
                                }
                            })}
                            style={{ minHeight: 260 }}
                        >
                            <img
                                src={userCard.imageUrlSmall || userCard.officialArtworkUrl}
                                alt={userCard.cardName || "Brak"}
                                className="w-[184px] h-[260px] object-contain drop-shadow-lg"
                                style={{ background: "#fff", borderRadius: "12px" }}
                            />
                            <div className="font-bold mt-2">{userCard.cardName}</div>
                            {userCard.quantity > 1 && (
                                <span className="text-sm text-gray-500">x{userCard.quantity}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-center items-center gap-4 py-2 bg-[transparent] w-full">
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
