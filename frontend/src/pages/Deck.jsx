import { useState, useEffect } from "react";
import NewDeckModal from "../components/NewDeckModal";
import DeckEditModal from "../components/DeckEditModal";
import api from "../api";
import { jwtDecode } from "jwt-decode";

function DeckTile({ deck, selected, onClick }) {
    return (
        <div
            className={`relative border-2 rounded-xl cursor-pointer bg-white shadow-md group
flex flex-col items-center justify-center h-[150px] w-[135px] min-w-[120px] max-w-[150px]
transition-all hover:scale-105 ${selected ? "border-yellow-400" : "border-gray-200"}`}
            onClick={onClick}
        >
            <div className="absolute top-1 left-1 text-yellow-400 text-lg">{deck.favorite && "★"}</div>
            {deck.status === "INCOMPLETE" && (
                <div className="absolute bottom-1 right-2 text-red-500 text-lg">⚠️</div>
            )}
            <img src={deck.logoUrl} alt="deck" className="w-12 h-12 mb-1" />
            <div className="font-bold text-center text-sm">{deck.name}</div>
        </div>
    );
}

function DeckChecklist({ deck }) {
    const cardCount = deck.cards.length;
    const missing = cardCount < 60 ? 60 - cardCount : 0;
    const extra = cardCount > 60 ? cardCount - 60 : 0;
    const hasBasicPokemon = deck.cards.some(c => c.type === "Pokemon" && c.subtype === "Basic");
    const hasBasicEnergy = deck.cards.some(c => c.type === "Energy" && c.subtype === "Basic");
    return (
        <div className="bg-white rounded shadow p-4 mt-4">
            <div className="text-lg font-bold mb-2">Checklista talii:</div>
            <ul className="list-none ml-0 space-y-1">
                <li>
                    <span className={cardCount === 60 ? "text-green-600" : "text-red-500"}>●</span>
                    {" "}Dokładnie 60 kart {missing > 0 && <span className="text-red-500 ml-2">Brakuje {missing}</span>}
                    {extra > 0 && <span className="text-red-500 ml-2">Za dużo o {extra}</span>}
                </li>
                <li>
                    <span className={hasBasicPokemon ? "text-green-600" : "text-red-500"}>●</span>
                    {" "}Minimum 1 Basic Pokémon
                </li>
                <li>
                    <span className={hasBasicEnergy ? "text-green-600" : "text-red-500"}>●</span>
                    {" "}Minimum 1 Basic Energy
                </li>
            </ul>
        </div>
    );
}

export default function Deck() {
    const [decks, setDecks] = useState([]);
    const [selectedDeckId, setSelectedDeckId] = useState(null); // null = nowa talia
    const [showEdit, setShowEdit] = useState(false);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    const availableLogos = [
        "/deck_default.png",
        "/deck_umbreon.png",
        "/deck_charmander.png",
        "/deck_grass.png",
        "/deck_lightning.png"
    ];

    // WYBÓR TALII
    const selectedDeck = selectedDeckId
        ? decks.find(d => d.id === selectedDeckId)
        : {
            name: "Nowa talia", logoUrl: "/deck_default.png", cards: [], status: "INCOMPLETE", wins: 0, losses: 0
        };
    const cards = selectedDeck.cards ?? [];
    const wins = selectedDeck.wins ?? 0;
    const losses = selectedDeck.losses ?? 0;
    const deckPower = cards.reduce((sum, c) => sum + (c.rating || 0), 0);

    // USTAWIENIE UŻYTKOWNIKA
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            const payload = jwtDecode(token);
            const uname = payload.username || payload.sub || payload.preferred_username;
            setUsername(uname);
        }
    }, []);

    // POBIERZ USER ID
    useEffect(() => {
        if (!username) return;
        api.get(`/user/find-by-username/${username}`)
            .then(res => setUserId(res.data.id))
            .catch(err => console.error("Nie można pobrać userId:", err));
    }, [username]);

    // POBIERZ TALIE
    useEffect(() => {
        if (!userId) return;
        api.get(`/user/${userId}/decks`)
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
            .catch(err => {
                setDecks([]); // zawsze pusta tablica gdy błąd
                console.error("Nie można pobrać decków:", err);
            });
    }, [userId]);

    // DODAJ TALIE
    const handleCreateDeck = async ({ name, logoUrl, baseEnergy, secondaryEnergy }) => {
        if (!userId) {
            console.error("Nie znaleziono userId! Username:", username);
            return;
        }
        try {
            const res = await api.post(`/user/${userId}/decks/add`, { name, logoUrl, baseEnergy, secondaryEnergy });
            const newDeck = res.data;
            setDecks(decks => [...decks, newDeck]);
            setShowCreate(false);
        } catch (e) {
            if (e.response) {
                console.error("Backend error:", e.response.data);
            }
            console.error("Błąd podczas dodawania talii:", e);
            alert("Błąd podczas dodawania talii: " + (e?.response?.data?.message || e.message));
        }
    };

    // EDYTUJ TALIE
    const handleEditSave = async ({ name, logoUrl, baseEnergy, secondaryEnergy }) => {
        if (!userId) return;
        const deck = decks.find(d => d.id === selectedDeckId);
        const updatedDeck = await api
            .put(`/user/${userId}/decks/${deck.id}`, { name, logoUrl, baseEnergy, secondaryEnergy })
            .then(res => res.data);
        setDecks(ds => ds.map(d => d.id === deck.id ? updatedDeck : d));
        setShowEdit(false);
    };

    // USUŃ TALIE
    const handleDelete = async () => {
        if (!userId) return;
        if (window.confirm("Na pewno usunąć?")) {
            await api.delete(`/user/${userId}/decks/${selectedDeckId}`);
            setDecks(ds => ds.filter(d => d.id !== selectedDeckId));
            setSelectedDeckId(null);
        }
    };

    // OBSŁUGA WYGRANA/PRZEGRANA (lokalnie, nie wysyła do backendu)
    const handleWin = () => {
        setDecks(ds => ds.map(d =>
            d.id === selectedDeck.id ? { ...d, wins: (d.wins ?? 0) + 1 } : d
        ));
    };
    const handleLoss = () => {
        setDecks(ds => ds.map(d =>
            d.id === selectedDeck.id ? { ...d, losses: (d.losses ?? 0) + 1 } : d
        ));
    };

    return (
        <div className="flex h-[90vh] w-full">
            <div className="w-[70%] px-8 py-6 overflow-y-auto">
                <div className="grid grid-cols-5 gap-8">
                    <div
                        className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 h-[150px] w-[135px] min-w-[120px] max-w-[150px] transition"
                        onClick={() => setShowCreate(true)}
                    >
                        <span className="text-4xl mb-2">＋</span>
                        <span className="font-bold text-center">Stwórz<br />Nową Talię</span>
                    </div>
                    {decks.map(deck => (
                        <DeckTile
                            key={deck.id}
                            deck={deck}
                            selected={selectedDeckId === deck.id}
                            onClick={() => setSelectedDeckId(deck.id)}
                        />
                    ))}
                </div>
            </div>
            <div className="w-[30%] bg-gray-50 p-8 flex flex-col items-start min-w-[370px] max-w-[500px]">
                <div className="flex items-center gap-4 mb-4">
                    <img src={selectedDeck.logoUrl} alt="deck" className="w-20 h-20 rounded shadow" />
                    <div>
                        <div className="text-2xl font-extrabold">{selectedDeck.name}</div>
                        <div className="text-gray-800 text-base mt-1">
                            Energie: {selectedDeck.baseEnergy}
                            {selectedDeck.secondaryEnergy ? " / " + selectedDeck.secondaryEnergy : ""}
                        </div>
                        <div className="text-gray-700">{cards.length}/60 kart</div>
                        <div>
                            <span
                                className={`font-bold ${selectedDeck.status === "COMPLETE" ? "text-green-700" : "text-orange-500"}`}>
                                {selectedDeck.status === "COMPLETE" ? "Gotowa" : "W budowie"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mb-2 flex items-center gap-6">
                    <div>
                        <div className="text-sm font-bold">Wynik:</div>
                        <button
                            className="bg-green-200 text-green-700 px-3 py-1 rounded mr-2"
                            onClick={handleWin}
                        >Wygrana</button>
                        <button
                            className="bg-red-200 text-red-700 px-3 py-1 rounded"
                            onClick={handleLoss}
                        >Przegrana</button>
                        <div className="mt-1 text-xs text-gray-500">
                            Rozegrane: <b>{wins + losses}</b> | Wygrane: <b>{wins}</b> | Przegrane: <b>{losses}</b>
                            <br />
                            Win Ratio: <b>{
                            wins + losses > 0
                                ? ((wins / (wins + losses)) * 100).toFixed(1) + "%"
                                : "-"
                        }</b>
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-bold">Deck Power:</div>
                        <div className="text-lg">{deckPower}</div>
                    </div>
                </div>
                <DeckChecklist deck={selectedDeck} />
                <div className="flex gap-3 mt-6">
                    <button
                        className="px-4 py-2 bg-blue-400 text-white rounded"
                        onClick={() => setShowEdit(true)}
                    >Edytuj Deck</button>
                    <button className="px-4 py-2 bg-gray-300 rounded">Kopiuj</button>
                    <button className="px-4 py-2 bg-gray-300 rounded">Export</button>
                    <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={handleDelete}>Usuń</button>
                </div>
                <div className="mt-6 flex gap-2 flex-wrap">
                    {cards.slice(0, 5).map(card => (
                        <img key={card.id} src={card.imageUrlSmall} alt={card.name} className="w-14 h-20 rounded shadow" />
                    ))}
                </div>
            </div>
            {showEdit &&
                <DeckEditModal
                    deck={selectedDeck}
                    logos={availableLogos}
                    onSave={handleEditSave}
                    onClose={() => setShowEdit(false)}
                />
            }
            {showCreate &&
                <NewDeckModal
                    logos={availableLogos}
                    onSave={handleCreateDeck}
                    onClose={() => setShowCreate(false)}
                />
            }
        </div>
    );
}
