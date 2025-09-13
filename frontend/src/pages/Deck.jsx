import {useState, useEffect} from "react";
import NewDeckModal from "../components/NewDeckModal";
import DeckEditModal from "../components/DeckEditModal";
import api from "../api";
import {jwtDecode} from "jwt-decode";
import {useNavigate} from "react-router-dom";
import {useAutoDeckImage} from "../components/useAutoDeckImage";

function DeckTile({deck, selected, onClick}) {
    const {src, onError} = useAutoDeckImage(deck.logoUrl, deck.baseEnergy, deck.secondaryEnergy);

    return (
        <div
            className={`relative border-2 rounded-xl cursor-pointer shadow-md group
      flex flex-col items-center justify-end h-[150px] w-[135px] min-w-[120px] max-w-[150px]
      transition-all hover:scale-105 overflow-hidden
      ${selected ? "border-yellow-400" : "border-gray-200"}`}
            onClick={onClick}
            style={{
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* ukryty <img> łapie błędy i przeskakuje na następny kandydat */}
            <img src={src} alt="" className="hidden" onError={onError}/>

            <div className="absolute inset-0 bg-black/15 pointer-events-none"/>

            <div className="absolute top-1 left-1 text-yellow-400 text-lg">{deck.favorite && "★"}</div>
            {deck.status === "INCOMPLETE" && (
                <div className="absolute bottom-1 right-2 text-red-500 text-lg">⚠️</div>
            )}

            <div className="w-full bg-black/55 text-white text-center text-[13px] font-bold py-1">
                {deck.name}
            </div>
        </div>
    );
}

function DeckChecklist({deck}) {
    const deckCards = deck?.cards ?? [];

    // liczba kart w talii z uwzględnieniem quantity
    const totalCards = deckCards.reduce((s, dc) => s + (dc.quantity ?? 1), 0);
    const missing = totalCards < 60 ? 60 - totalCards : 0;
    const extra = totalCards > 60 ? totalCards - 60 : 0;

    const hasBasicPokemon = deckCards.some(dc => {
        const c = dc.card ?? dc; // obsłuż oba kształty
        const sup = c?.supertype;
        const stage = c?.stage; // "Basic" / "Stage 1" / ...
        const subsCsv = (c?.subtypes ?? "").toString();
        const subsHasBasic = subsCsv
            .split(",")
            .map(s => s.trim().toLowerCase())
            .includes("basic");

        return sup === "Pokémon" && (stage === "Basic" || subsHasBasic) && (dc.quantity ?? 1) > 0;
    });

    const hasBasicEnergy = deckCards.some(dc => {
        const c = dc.card ?? dc;
        const sup = c?.supertype;
        const subsCsv = (c?.subtypes ?? "").toString();
        const subsHasBasic = subsCsv
            .split(",")
            .map(s => s.trim().toLowerCase())
            .includes("basic");
        const nameHasBasic = (c?.name ?? "").toLowerCase().includes("basic"); // fallback

        return sup === "Energy" && (subsHasBasic || nameHasBasic) && (dc.quantity ?? 1) > 0;
    });

    return (
        <div className="bg-white rounded shadow p-4 mt-4">
            <div className="text-lg font-bold mb-2">Checklista talii:</div>
            <ul className="list-none ml-0 space-y-1">
                <li>
                    <span className={totalCards === 60 ? "text-green-600" : "text-red-500"}>●</span>
                    {" "}Dokładnie 60 kart
                    {missing > 0 && <span className="text-red-500 ml-2">Brakuje {missing}</span>}
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
   // const [userId, setUserId] = useState(null);
    //const [username, setUsername] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const navigate = useNavigate();
    const isNewDeck = !selectedDeckId;

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

    const MULT_TABLE = {
        1: 1.00,
        2: 1.10,
        3: 1.20,
        4: 1.30,
        5: 1.38,
        6: 1.45,
    };
// dla większych ilości łagodnie rośnie i jest ograniczony
    function getMultiplier(count) {
        if (count <= 6) return MULT_TABLE[count];
        // np. powyżej 6: +0.03 za każdą kartę, cap 1.60
        const extra = 1.45 + (count - 6) * 0.03;
        return Math.min(extra, 1.60);
    }

// normalizacja stringów do kluczy grup
    function norm(s = "") {
        return String(s).trim().toLowerCase();
    }

// wyciąga klucz grupy i flagę czy należy naliczać bonus
    function getGroupKeyAndBonus(cardLike) {
        const c = cardLike?.card ?? cardLike ?? {};
        const supertype = c.supertype;
        // POKÉMON: grupuj po pokedexNumber (fallback po nazwie)
        if (supertype === "Pokémon" || supertype === "Pokemon") {
            const key = c.pokedexNumber != null ? `dex:${c.pokedexNumber}` : `pname:${norm(c.name)}`;
            return { key, bonus: true };
        }
        // ENERGIE: grupuj po typie energii / nazwie
        if (supertype === "Energy") {
            // spróbuj z pola type (Twoje karty je mają), a jak nie — po nazwie
            const byType = c.type ? `energy:${norm(c.type)}` : null;
            const byName = c.name ? `energyname:${norm(c.name)}` : null;
            return { key: byType || byName || `energy:unknown`, bonus: true };
        }
        // Inne karty – bez bonusu
        return { key: `other:${norm(c.name) || "?"}`, bonus: false };
    }

// GŁÓWNY licznik mocy talii z bonusami duplikatów
    function computeDeckPower(deckCards = []) {
        // zgrupuj po kluczu
        const groups = new Map();
        for (const dc of deckCards) {
            const { key, bonus } = getGroupKeyAndBonus(dc);
            const c = dc.card ?? dc ?? {};
            const qty = Number.isFinite(dc.quantity) ? dc.quantity : 1;
            const rating = Number.isFinite(c.overallRating) ? c.overallRating : 0;

            if (!groups.has(key)) {
                groups.set(key, { sumRating: 0, count: 0, bonus });
            }
            const g = groups.get(key);
            g.sumRating += rating * qty; // suma ratingów w grupie
            g.count += qty;              // ile sztuk w grupie
        }

        // policz wynik z mnożnikami
        let total = 0;
        for (const { sumRating, count, bonus } of groups.values()) {
            const mult = bonus ? getMultiplier(count) : 1;
            total += sumRating * mult;
        }
        // opcjonalnie: zaokrąglij
        return Math.round(total);
    }

    const deckPower = computeDeckPower(cards);

    const totalCards = cards.reduce((s, dc) => s + (dc.quantity ?? 1), 0);
    const { src: autoSrc, onError: autoOnError } = useAutoDeckImage(
        selectedDeck.logoUrl,
        selectedDeck.baseEnergy,
        selectedDeck.secondaryEnergy
    );
    const headerLogo = isNewDeck ? "/create_new_deck.jpg" : autoSrc;
    const headerOnError = isNewDeck ? undefined : autoOnError;

    // USTAWIENIE UŻYTKOWNIKA
 //  useEffect(() => {
 //      const token = localStorage.getItem("accessToken");
 //      if (token) {
 //          const payload = jwtDecode(token);
 //          const uname = payload.username || payload.sub || payload.preferred_username;
 //          setUsername(uname);
 //      }
 //  }, []);

    // POBIERZ USER ID
 //   useEffect(() => {
 //       if (!username) return;
 //       api.get(`/user/find-by-username/${username}`)
 //           .then(res => setUserId(res.data.id))
 //           .catch(err => console.error("Nie można pobrać userId:", err));
 //   }, [username]);

    useEffect(() => {
        api.get("/user/decks").then(res => setDecks(Array.isArray(res.data) ? res.data : (res.data.decks || res.data.content || [])))
    }, []);

 //   useEffect(() => {
 //       api.get("/user/decks")
 //           .then(res => {
 //               setDecks(Array.isArray(res.data) ? res.data : (res.data.decks || res.data.content || []));
 //           })
 //           .catch(err => {
 //               setDecks([]);
 //               console.error("Nie można pobrać decków:", err);
 //           });
 //   }, []);

    // DODAJ TALIE
    const handleCreateDeck = async ({name, logoUrl, baseEnergy, secondaryEnergy}) => {
      // if (!userId) {
      //     console.error("Nie znaleziono userId! Username:", username);
      //     return;
      // }
        try {
         //   const res = await api.post(`/user/${userId}/decks/add`, {name, logoUrl, baseEnergy, secondaryEnergy});
            const res = await api.post(`/user/decks/add`, { name, logoUrl, baseEnergy, secondaryEnergy });
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
    const handleEditSave = async ({name, logoUrl, baseEnergy, secondaryEnergy}) => {
      //  if (!userId) return;
        const deck = decks.find(d => d.id === selectedDeckId);
       // const updatedDeck = await api
       //     .put(`/user/${userId}/decks/${deck.id}`, {name, logoUrl, baseEnergy, secondaryEnergy})
       //     .then(res => res.data);
        const updatedDeck = await api.put(`/user/decks/${deck.id}`, { name, logoUrl, baseEnergy, secondaryEnergy }).then(r => r.data);
        setDecks(ds => ds.map(d => d.id === deck.id ? updatedDeck : d));
        setShowEdit(false);
    };

    // USUŃ TALIE
    const handleDelete = async () => {
     //   if (!userId) return;
        if (window.confirm("Na pewno usunąć?")) {
       //     await api.delete(`/user/${userId}/decks/${selectedDeckId}`);
            await api.delete(`/user/decks/${selectedDeckId}`);
            setDecks(ds => ds.filter(d => d.id !== selectedDeckId));
            setSelectedDeckId(null);
        }
    };

    // OBSŁUGA WYGRANA/PRZEGRANA (lokalnie, nie wysyła do backendu)
    const handleWin = () => {
        setDecks(ds => ds.map(d =>
            d.id === selectedDeck.id ? {...d, wins: (d.wins ?? 0) + 1} : d
        ));
    };
    const handleLoss = () => {
        setDecks(ds => ds.map(d =>
            d.id === selectedDeck.id ? {...d, losses: (d.losses ?? 0) + 1} : d
        ));
    };

    return (
        <div className="flex h-[90vh] w-full">
            <div className="w-[70%] px-8 py-6 overflow-y-auto">
                <div className="grid grid-cols-6 gap-8">
                    <div
                        className="relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer h-[150px] w-[135px] min-w-[120px] max-w-[150px] transition hover:scale-105 overflow-hidden"
                        onClick={() => setShowCreate(true)}
                        style={{
                            backgroundImage: "url('/create_new_deck.jpg')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        {/* przyciemnienie dla czytelności napisu */}
                        <div className="absolute inset-0 bg-black/30"/>

                        <div className="relative z-10 flex flex-col items-center text-white drop-shadow">
                            <span className="text-4xl mb-2">＋</span>
                            <span className="font-bold text-center leading-tight">
      Stwórz<br/>Nową Talię
    </span>
                        </div>
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
                    <img
                        src={headerLogo}
                        onError={headerOnError}
                        alt="deck"
                        className="w-20 h-20 rounded shadow object-cover"
                    />
                    <div>
                        <div className="text-2xl font-extrabold">{selectedDeck.name}</div>
                        <div className="text-gray-800 text-base mt-1">
                            Energie: {selectedDeck.baseEnergy}
                            {selectedDeck.secondaryEnergy ? " / " + selectedDeck.secondaryEnergy : ""}
                        </div>
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
                        >Wygrana
                        </button>
                        <button
                            className="bg-red-200 text-red-700 px-3 py-1 rounded"
                            onClick={handleLoss}
                        >Przegrana
                        </button>
                        <div className="mt-1 text-xs text-gray-500">
                            Rozegrane: <b>{wins + losses}</b> | Wygrane: <b>{wins}</b> | Przegrane: <b>{losses}</b>
                            <br/>
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
                <DeckChecklist deck={selectedDeck}/>
                <div className="flex gap-3 mt-6">
                    <button
                        className="px-4 py-2 bg-blue-400 text-white rounded"
                        onClick={() => setShowEdit(true)}
                    >Edytuj Deck
                    </button>
                    <button className="px-4 py-2 bg-gray-300 rounded">Kopiuj</button>
                    <button className="px-4 py-2 bg-gray-300 rounded">Export</button>
                    <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={handleDelete}>Usuń</button>
                </div>

                {/* Miniatury */}
                <div className="mt-6 w-full">
                    <div className="text-sm font-bold mb-2">Karty w talii:</div>

                    {/* czysty kontener, bez ramek */}
                    <div className="bg-transparent rounded-none">
                        {/* GRID: 5 kolumn, 2 rzędy widoczne → scroll w pionie */}
                        <div
                            className="
        grid grid-cols-4 gap-x-1 gap-y-2
        max-h-[350px] overflow-y-auto overflow-x-hidden
        p-2 pr-3
      "
                            /* ważne, żeby powiększenie nie było ucinane */
                            style={{contain: "paint"}}
                        >
                            {Object.values(
                                (selectedDeck.cards ?? []).reduce((acc, dc) => {
                                    const card = dc.card ?? dc;
                                    const id = card?.id;
                                    if (!id) return acc;
                                    if (!acc[id]) acc[id] = {card, qty: 0};
                                    acc[id].qty += (dc.quantity ?? 1);
                                    return acc;
                                }, {})
                            )
                                .slice(0, 60)
                                .map(({card, qty}) => (
                                    <button
                                        key={card.id}
                                        type="button"
                                        className="relative group flex flex-col items-center"
                                        onClick={() =>
                                            navigate(`/card/${card.id}`, {
                                                state: {from: "deck"} // <<— info do powrotu
                                            })
                                        }
                                        title={`${card.name || "Karta"} ×${qty}`}
                                    >
                                        {/* Duża miniatura, bez ramek, ładny cień */}
                                        <img
                                            src={card.imageUrlSmall || "/card_placeholder.png"}
                                            alt={card.name || "card"}
                                            className="
                w-[300px] h-[100px]
                object-contain bg-transparent rounded-md
                transition-transform duration-200
                group-hover:scale-[1.60]
              "
                                        />

                                        {/* licznik sztuk w prawym-dolnym rogu */}
                                        <span
                                            className="
                absolute -bottom-1 -right-0
                bg-black/70 text-white text-[11px] px-1.5 rounded
                pointer-events-none
              "
                                        >
              ×{qty}
            </span>
                                    </button>
                                ))}
                        </div>
                    </div>
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
