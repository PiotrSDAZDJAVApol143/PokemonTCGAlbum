import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function CardDetails() {
    const { cardId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Przyjmij dane z poprzedniej strony (widoku albumu)
    const page = location.state?.page || 0;
    const size = location.state?.size || 10;
    const name = location.state?.name || "";
    const setId = location.state?.setId || "";
    const idxOnPage = location.state?.idxOnPage || 0;
    const view = location.state?.view || "all";

    const [cards, setCards] = useState([]);
    const [card, setCard] = useState(null);
    const [totalPages, setTotalPages] = useState(1);

    // Pobierz karty z aktualnej strony (tak jak w AlbumAllView/AlbumSetCardsView)
    useEffect(() => {
        axios.get("/api/cards/search", {
            params: { page, size, name, setId }
        }).then(res => {
            setCards(res.data.content);
            setTotalPages(res.data.totalPages);
        });
    }, [page, size, name, setId]);

    // Pobierz szczegóły aktualnej karty
    useEffect(() => {
        if (!cardId) return;
        axios.get(`/api/cards/${cardId}`)
            .then(res => setCard(res.data));
    }, [cardId]);

    // Przycisk powrót (do albumu na ostatnią stronę gdzie byłeś)
    const handleBack = () => {
        if (view === "set") {
            navigate("/album", { state: { step: "set-cards", setId, page, search: name } });
        } else {
            navigate("/album", { state: { step: "all", page, search: name } });
        }
    };

    // Strzałka w lewo
    const goToPrev = () => {
        if (idxOnPage > 0) {
            // Wewnątrz strony — tylko zmiana karty
            const prevCard = cards[idxOnPage - 1];
            navigate(`/card/${prevCard.id}`, {
                state: { page, size, name, setId, idxOnPage: idxOnPage - 1, view }
            });
        } else if (page > 0) {
            // Jesteś na początku strony — pobierz poprzednią stronę i wejdź w jej ostatnią kartę
            axios.get("/api/cards/search", {
                params: { page: page - 1, size, name, setId }
            }).then(res => {
                const lastIdx = res.data.content.length - 1;
                const prevCard = res.data.content[lastIdx];
                navigate(`/card/${prevCard.id}`, {
                    state: { page: page - 1, size, name, setId, idxOnPage: lastIdx, view }
                });
            });
        }
    };

    // Strzałka w prawo
    const goToNext = () => {
        if (idxOnPage < cards.length - 1) {
            // Wewnątrz strony — tylko zmiana karty
            const nextCard = cards[idxOnPage + 1];
            navigate(`/card/${nextCard.id}`, {
                state: { page, size, name, setId, idxOnPage: idxOnPage + 1, view }
            });
        } else if (page < totalPages - 1) {
            // Jesteś na końcu strony — pobierz następną stronę i wejdź w jej pierwszą kartę
            axios.get("/api/cards/search", {
                params: { page: page + 1, size, name, setId }
            }).then(res => {
                const nextCard = res.data.content[0];
                navigate(`/card/${nextCard.id}`, {
                    state: { page: page + 1, size, name, setId, idxOnPage: 0, view }
                });
            });
        }
    };

    if (!card) return <div className="p-10">Ładowanie...</div>;

    return (
        <div className="relative min-h-[90vh]">
            <button
                className="absolute left-10 top-10 px-6 py-2 rounded bg-gray-200 font-bold"
                onClick={handleBack}
            >← Powrót</button>
            <div className="flex justify-center items-center gap-10 p-8 min-h-[80vh]">
                <button
                    className="text-4xl p-3 hover:bg-gray-200 rounded-full disabled:opacity-30"
                    onClick={goToPrev}
                    disabled={page === 0 && idxOnPage === 0}
                >←</button>
                <div className="flex gap-12 items-start">
                    <img src={card.imageUrlLarge || card.imageUrlSmall} alt={card.name} className="w-[440px] rounded-lg shadow-lg" />
                    <div>
                        <div className="text-5xl font-extrabold mb-4">{card.name}</div>
                        {/* ...inne dane */}
                    </div>
                </div>
                <button
                    className="text-4xl p-3 hover:bg-gray-200 rounded-full disabled:opacity-30"
                    onClick={goToNext}
                    disabled={page === totalPages - 1 && idxOnPage === cards.length - 1}
                >→</button>
            </div>
        </div>
    );
}
