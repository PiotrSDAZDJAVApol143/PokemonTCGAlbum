import {useState, useEffect} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";

export default function AlbumAllView({ goBack, page, setPage, search, setSearch }) {
    const [cards, setCards] = useState([]);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/api/cards/search", {
            params: { page, size, name: search }
        }).then(res => {
            setCards(res.data.content);
            setTotalPages(res.data.totalPages);
        });
    }, [page, size, search]);

    return (
        <div className="px-5 pt-1">
            <div className="flex items-center justify-between mb-5">
                <button className="px-6 py-2 rounded bg-gray-200 font-bold" onClick={goBack}>← Powrót</button>
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
            <div className="grid grid-cols-5 gap-8 mb-6">
                {cards.map((card, i) => (
                    <div
                        key={card.id}
                        className="flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-105"
                        onClick={() => navigate(`/card/${card.id}`, {
                            state: {
                                page,
                                size,
                                name: search,
                                idxOnPage: i,
                                view: "all"
                            }
                        })}
                        style={{ minHeight: 260 }}
                    >
                        <img
                            src={card.imageUrlSmall || card.officialArtworkUrl}
                            alt={card.name}
                            className="w-[220px] h-[310px] object-contain drop-shadow-lg"
                            style={{ background: "#fff", borderRadius: "12px" }}
                        />
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