import { useState, useEffect, useMemo } from "react";
import NewDeckModal from "../components/NewDeckModal";
import DeckEditModal from "../components/DeckEditModal";
import ExportDeckModal from "../components/ExportDeckModal";
import api from "../api";
import { useLocation, useNavigate } from "react-router-dom";
import { useAutoDeckImage } from "../components/useAutoDeckImage";


// =========================
// Logos
// =========================

const AVAILABLE_LOGOS = [
    "/deck_default.png",
    "/deck_umbreon.png",
    "/deck_charmander.png",
    "/deck_grass.png",
    "/deck_lightning.png",
];

// =========================
// Completeness (checklista) – wspólne źródło prawdy
// =========================

function evaluateDeckCompleteness(deck) {
    const deckCards = deck?.cards ?? [];

    const totalCards = deckCards.reduce((s, dc) => s + (dc?.quantity ?? 1), 0);

    const hasBasicPokemon = deckCards.some((dc) => {
        const c = dc.card ?? dc;
        const supertype = String(c?.supertype ?? "").toLowerCase();
        const stage = String(c?.stage ?? "");
        const subsCsv = (c?.subtypes ?? "").toString();

        const subs = subsCsv
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

        const isPokemon = supertype === "pokémon" || supertype === "pokemon";
        const isBasic = stage === "Basic" || subs.includes("basic");
        const qty = dc?.quantity ?? 1;

        return isPokemon && isBasic && qty > 0;
    });

    const hasBasicEnergy = deckCards.some((dc) => {
        const c = dc.card ?? dc;
        const supertype = String(c?.supertype ?? "").toLowerCase();
        const subsCsv = (c?.subtypes ?? "").toString();
        const name = String(c?.name ?? "").toLowerCase();

        const subs = subsCsv
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

        const isEnergy = supertype === "energy";
        const isBasic = subs.includes("basic") || name.includes("basic");
        const qty = dc?.quantity ?? 1;

        return isEnergy && isBasic && qty > 0;
    });

    const missing = totalCards < 60 ? 60 - totalCards : 0;
    const extra = totalCards > 60 ? totalCards - 60 : 0;

    const isComplete = totalCards === 60 && hasBasicPokemon && hasBasicEnergy;

    return { totalCards, missing, extra, hasBasicPokemon, hasBasicEnergy, isComplete };
}

// =========================
// UI helpers
// =========================

function getGlowStyleByCardCount(totalCards) {
    let rgb = "0,0,0";
    if (totalCards === 60) rgb = "34,197,94";
    else if (totalCards >= 50 && totalCards <= 59) rgb = "234,179,8";
    else if (totalCards < 50) rgb = "239,68,68";
    else rgb = "0,0,0";

    return {
        boxShadow: `
      0 0 20px rgba(${rgb}, .18),
      0 0 0 10px rgba(${rgb}, .10),
      0 0 0 7px  rgba(${rgb}, .35),
      0 0 0 4px  rgba(${rgb}, 1),
      0 10px 22px rgba(0,0,0,.12)
    `,
    };
}


function getGlowLabel(totalCards) {
    if (totalCards === 60) return "OK: 60 kart";
    if (totalCards >= 50 && totalCards <= 59) return "Prawie: 50–59 kart";
    if (totalCards < 50) return "Za mało: < 50 kart";
    return "Za dużo: 61+ kart";
}

// =========================
// Components
// =========================

function DeckTile({ deck, selected, onClick, onDoubleClick, cardsCount, complete }) {
    const { src, onError } = useAutoDeckImage(deck.logoUrl, deck.baseEnergy, deck.secondaryEnergy);
    const glowStyle = getGlowStyleByCardCount(cardsCount);
    const glowLabel = getGlowLabel(cardsCount);

    return (
        <div
            className={`deck-tile-frame relative w-full max-w-[160px] aspect-[0.9] border-2 rounded-2xl cursor-pointer shadow-md group
            flex flex-col items-center justify-end
            transition-all hover:scale-[1.03] overflow-hidden justify-self-center
            ${selected ? "border-yellow-400 ring-2 ring-yellow-300" : ""}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            title={`${deck.name} — ${glowLabel} (${cardsCount}/60)`}
            style={{
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                ...glowStyle,
            }}
        >
            <img src={src} alt="" className="hidden" onError={onError} />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />

            <div className="absolute top-1 left-1 text-yellow-400 text-lg">
                {deck.favorite && "★"}
            </div>

            {deck.shared && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/65 text-white text-[10px] font-bold">
                    Shared
                </div>
            )}

            {!complete && <div className="absolute bottom-1 right-2 text-red-500 text-lg">⚠️</div>}

            <div className="deck-overlay-title w-full text-center text-[13px] font-bold py-1 px-2 leading-tight">
                {deck.name}
            </div>
        </div>
    );
}

function DeckChecklist({ deck, compact = false }) {
    const evalD = useMemo(() => evaluateDeckCompleteness(deck), [deck]);

    return (
        <div
            className={`deck-card-box rounded-2xl ${
                compact ? "p-3" : "p-4"
            }`}
        >
            <div
                className={`font-bold app-text-primary ${
                    compact ? "text-lg mb-2" : "text-xl mb-3"
                }`}
            >
                Checklista talii:
            </div>

            <ul
                className={`list-none ml-0 app-text-secondary ${
                    compact ? "space-y-1 text-[14px] leading-snug" : "space-y-2"
                }`}
            >
                <li>
                    <span className={evalD.totalCards === 60 ? "text-green-600" : "text-red-500"}>●</span>{" "}
                    Dokładnie 60 kart
                    {evalD.missing > 0 && <span className="text-red-500 ml-2">Brakuje {evalD.missing}</span>}
                    {evalD.extra > 0 && <span className="text-red-500 ml-2">Za dużo o {evalD.extra}</span>}
                </li>
                <li>
                    <span className={evalD.hasBasicPokemon ? "text-green-600" : "text-red-500"}>●</span>{" "}
                    Minimum 1 Basic Pokémon
                </li>
                <li>
                    <span className={evalD.hasBasicEnergy ? "text-green-600" : "text-red-500"}>●</span>{" "}
                    Minimum 1 Basic Energy
                </li>
            </ul>
        </div>
    );
}


// =========================
// Main
// =========================

export default function Deck() {
    const [decks, setDecks] = useState([]);
    const [selectedDeckId, setSelectedDeckId] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showExport, setShowExport] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const isNewDeck = !selectedDeckId;
    const openDeckViewerFromDeck = (deck) => {
        if (!deck?.id) return;

        navigate(`/poke-game/deck/${deck.id}`, {
            state: {
                from: "deck",
                selectedDeckId: deck.id,
            },
        });
    };

    // Sortowanie
    const [sortBy, setSortBy] = useState("POWER"); // POWER | NAME | CARDS | WIN_RATIO | MATCHES
    const [sortDir, setSortDir] = useState("DESC"); // ASC | DESC

    // Filtr miniatur
    const [thumbFilter, setThumbFilter] = useState("ALL");

    // Wynik zapis do backendu
    const [savingResult, setSavingResult] = useState(false);

    // ====== Fetch decks
    useEffect(() => {
        api
            .get("/user/decks")
            .then((res) =>
                setDecks(Array.isArray(res.data) ? res.data : res.data?.decks || res.data?.content || [])
            )
            .catch(() => setDecks([]));
    }, []);

    useEffect(() => {
        const deckIdFromState = location.state?.selectedDeckId;
        if (deckIdFromState) {
            setSelectedDeckId(deckIdFromState);
        }
    }, [location.state?.selectedDeckId]);

    // ====== WYBÓR TALII (MUSI BYĆ PRZED useMemo zależnym od selectedDeck)
    const selectedDeck = useMemo(() => {
        if (!selectedDeckId) {
            return {
                name: "Nowa talia",
                logoUrl: "/deck_default.png",
                cards: [],
                status: "INCOMPLETE",
                wins: 0,
                losses: 0,
            };
        }
        return decks.find((d) => d.id === selectedDeckId) ?? null;
    }, [selectedDeckId, decks]);

    // Bezpieczny fallback (np. po usunięciu talii / chwilowym braku w liście)
    const safeSelectedDeck =
        selectedDeck ??
        ({
            name: "Talia nie znaleziona",
            logoUrl: "/deck_default.png",
            cards: [],
            status: "INCOMPLETE",
            wins: 0,
            losses: 0,
        });

    const selectedEval = useMemo(
        () => evaluateDeckCompleteness(safeSelectedDeck),
        [safeSelectedDeck]
    );

    const uiStatus = selectedEval.isComplete ? "COMPLETE" : "INCOMPLETE";
    const isSharedDeck = !!safeSelectedDeck?.shared;
    const isReadOnlyDeck = !!safeSelectedDeck?.readOnly;
    const deckOwnerLabel = safeSelectedDeck?.ownerUsername || "Ty";

    // ===== Metryki
    function getTotalCardsInDeck(deck) {
        const cards = deck?.cards ?? [];
        return cards.reduce((s, dc) => s + (dc.quantity ?? 1), 0);
    }

    function getWinRatio(deck) {
        const wins = deck?.wins ?? 0;
        const losses = deck?.losses ?? 0;
        const played = wins + losses;
        return played > 0 ? wins / played : 0;
    }

    function getMatchesPlayed(deck) {
        const wins = deck?.wins ?? 0;
        const losses = deck?.losses ?? 0;
        return wins + losses;
    }

    const deckMetrics = useMemo(() => {
        const m = new Map();
        for (const d of decks) {
            const evalD = evaluateDeckCompleteness(d);
            m.set(d.id, {
                name: (d.name ?? "").toString(),
                power: d.deckPower ?? 0,
                cards: getTotalCardsInDeck(d),
                winRatio: getWinRatio(d),
                matches: getMatchesPlayed(d),
                complete: evalD.isComplete,
            });
        }
        return m;
    }, [decks]);

    const sortedDecks = useMemo(() => {
        const arr = [...decks];
        const dir = sortDir === "ASC" ? 1 : -1;

        arr.sort((a, b) => {
            const A = deckMetrics.get(a.id) || {};
            const B = deckMetrics.get(b.id) || {};

            let cmp = 0;

            if (sortBy === "NAME") {
                cmp = (A.name || "").localeCompare(B.name || "", "pl", { sensitivity: "base" });
            } else if (sortBy === "POWER") {
                cmp = (A.power ?? 0) - (B.power ?? 0);
            } else if (sortBy === "CARDS") {
                cmp = (A.cards ?? 0) - (B.cards ?? 0);
            } else if (sortBy === "WIN_RATIO") {
                cmp = (A.winRatio ?? 0) - (B.winRatio ?? 0);
            } else if (sortBy === "MATCHES") {
                cmp = (A.matches ?? 0) - (B.matches ?? 0);
            }

            if (cmp !== 0) return cmp * dir;

            return (A.name || "").localeCompare(B.name || "", "pl", { sensitivity: "base" });
        });

        return arr;
    }, [decks, deckMetrics, sortBy, sortDir]);

    // ===== Dane dla panelu
    const deckPower = safeSelectedDeck.deckPower ?? 0;

    const deckUniqueCardsAll = Object.values(
        (safeSelectedDeck.cards ?? []).reduce((acc, dc) => {
            const card = dc.card ?? dc;
            const id = card?.id;
            if (!id) return acc;
            if (!acc[id]) acc[id] = { card, qty: 0 };
            acc[id].qty += dc.quantity ?? 1;
            return acc;
        }, {})
    ).slice(0, 60);

    const isPokemon = (card) => {
        const st = String(card?.supertype ?? "").toLowerCase();
        return st === "pokémon" || st === "pokemon";
    };

    const deckUniqueCardsFiltered = useMemo(() => {
        if (thumbFilter === "POKEMON") {
            return deckUniqueCardsAll.filter(({ card }) => isPokemon(card));
        }
        if (thumbFilter === "SUPPORTER") {
            return deckUniqueCardsAll.filter(({ card }) => !isPokemon(card));
        }
        return deckUniqueCardsAll;
    }, [deckUniqueCardsAll, thumbFilter]);

    const deckCardIds = deckUniqueCardsFiltered.map(({ card }) => card.id);

    const wins = safeSelectedDeck.wins ?? 0;
    const losses = safeSelectedDeck.losses ?? 0;

    const { src: autoSrc, onError: autoOnError } = useAutoDeckImage(
        safeSelectedDeck.logoUrl,
        safeSelectedDeck.baseEnergy,
        safeSelectedDeck.secondaryEnergy
    );
    const headerLogo = isNewDeck ? "/create_new_deck.jpg" : autoSrc;
    const headerOnError = isNewDeck ? undefined : autoOnError;

    // ===== CRUD: create/edit/delete
    const handleCreateDeck = async ({ name, logoUrl, baseEnergy, secondaryEnergy }) => {
        try {
            const res = await api.post(`/user/decks/add`, { name, logoUrl, baseEnergy, secondaryEnergy });
            const newDeck = res.data;
            setDecks((ds) => [...ds, newDeck]);
            setShowCreate(false);
        } catch (e) {
            console.error("Błąd podczas dodawania talii:", e);
            alert("Błąd podczas dodawania talii: " + (e?.response?.data?.message || e.message));
        }
    };

    const handleEditSave = async ({ name, logoUrl, baseEnergy, secondaryEnergy }) => {
        const deck = decks.find((d) => d.id === selectedDeckId);
        if (!deck) return;

        const updatedDeck = await api
            .put(`/user/decks/${deck.id}`, { name, logoUrl, baseEnergy, secondaryEnergy })
            .then((r) => r.data);

        setDecks((ds) => ds.map((d) => (d.id === deck.id ? updatedDeck : d)));
        setShowEdit(false);
    };

    const handleDelete = async () => {
        if (!selectedDeckId || isReadOnlyDeck) return;
        if (window.confirm("Na pewno usunąć?")) {
            await api.delete(`/user/decks/${selectedDeckId}`);
            setDecks((ds) => ds.filter((d) => d.id !== selectedDeckId));
            setSelectedDeckId(null);
        }
    };

    const handleExportSuccess = (targetUsername) => {
        alert(`Deck został udostępniony użytkownikowi ${targetUsername}.`);
        setShowExport(false);
    };

    // ===== Wyniki (win/loss/reset) – wymagają endpointów w backendzie
    function replaceDeckInState(updatedDeck) {
        setDecks((ds) => ds.map((d) => (d.id === updatedDeck.id ? { ...d, ...updatedDeck } : d)));
    }

    function ensureDeckSelectedOrWarn() {
        if (!selectedDeckId) {
            alert("Najpierw wybierz istniejącą talię (talia musi mieć ID w bazie).");
            return false;
        }
        return true;
    }

    const handleWin = async () => {
        if (!ensureDeckSelectedOrWarn()) return;
        if (savingResult) return;

        try {
            setSavingResult(true);
            const updated = await api.post(`/user/decks/${selectedDeckId}/win`).then((r) => r.data);
            replaceDeckInState(updated);
        } catch (e) {
            console.error(e);
            alert("Nie udało się zapisać wygranej: " + (e?.response?.data?.message || e.message));
        } finally {
            setSavingResult(false);
        }
    };

    const handleLoss = async () => {
        if (!ensureDeckSelectedOrWarn()) return;
        if (savingResult) return;

        try {
            setSavingResult(true);
            const updated = await api.post(`/user/decks/${selectedDeckId}/loss`).then((r) => r.data);
            replaceDeckInState(updated);
        } catch (e) {
            console.error(e);
            alert("Nie udało się zapisać przegranej: " + (e?.response?.data?.message || e.message));
        } finally {
            setSavingResult(false);
        }
    };

    const resetWinRatio = async () => {
        if (!ensureDeckSelectedOrWarn()) return;
        if (savingResult) return;

        const ok = window.confirm("Zresetować wynik tej talii? Ustawi wins=0 i losses=0.");
        if (!ok) return;

        try {
            setSavingResult(true);
            const updated = await api.post(`/user/decks/${selectedDeckId}/reset-score`).then((r) => r.data);
            replaceDeckInState(updated);
        } catch (e) {
            console.error(e);
            alert("Nie udało się zresetować wyniku: " + (e?.response?.data?.message || e.message));
        } finally {
            setSavingResult(false);
        }
    };


    // =========================
    // Render
    // =========================

    return (
        <div className="h-[calc(100vh-9rem)] min-h-0 w-full overflow-hidden">
            <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px] gap-6">
                {/* LEWY PANEL */}
                <div className="deck-surface min-h-0 overflow-hidden rounded-[30px] flex flex-col">
                    {/* Pasek sortowania */}
                    <div className="shrink-0 p-5">
                        <div className="deck-card-box rounded-2xl px-4 py-3 flex flex-wrap items-center gap-4">
                            <div className="font-bold app-text-primary">Sortuj:</div>

                            <select
                                className="deck-input rounded px-3 py-2 min-w-[230px]"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="POWER">Wg Deck Power</option>
                                <option value="NAME">Wg Nazwy (A-Z)</option>
                                <option value="CARDS">Wg liczby kart</option>
                                <option value="WIN_RATIO">Wg Win Ratio</option>
                                <option value="MATCHES">Wg rozegranych meczy</option>
                            </select>

                            <button
                                type="button"
                                className="deck-btn-muted rounded px-3 py-2"
                                onClick={() => setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"))}
                                title="Zmień kierunek sortowania"
                            >
                                {sortDir === "ASC" ? "↑ Rosnąco" : "↓ Malejąco"}
                            </button>

                            <div className="text-xs app-text-secondary ml-auto hidden lg:block">
                                Tip: kliknij strzałkę, aby odwrócić sortowanie
                            </div>
                        </div>
                    </div>

                    {/* Scrollowana siatka talii */}
                    <div className="deck-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                        <div
                            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5 auto-rows-max">
                            {/* Nowa talia */}
                            <div
                                className="deck-tile-frame relative w-full max-w-[160px] aspect-[0.9] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer
transition hover:scale-[1.03] overflow-hidden justify-self-center"
                                onClick={() => setShowCreate(true)}
                                style={{
                                    backgroundImage: "url('/create_new_deck.jpg')",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            >
                                <div className="absolute inset-0 bg-black/30"/>
                                <div className="relative z-10 flex flex-col items-center text-white drop-shadow">
                                    <span className="text-4xl mb-2">＋</span>
                                    <span className="font-bold text-center leading-tight">
                                    Stwórz
                                    <br/>
                                    Nową Talię
                                </span>
                                </div>
                            </div>

                            {/* Decki */}
                            {sortedDecks.map((deck) => (
                                <DeckTile
                                    key={deck.id}
                                    deck={deck}
                                    selected={selectedDeckId === deck.id}
                                    onClick={() => setSelectedDeckId(deck.id)}
                                    onDoubleClick={() => openDeckViewerFromDeck(deck)}
                                    cardsCount={deckMetrics.get(deck.id)?.cards ?? 0}
                                    complete={deckMetrics.get(deck.id)?.complete ?? false}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* PRAWY PANEL */}
                <div className="deck-surface min-h-0 overflow-hidden rounded-[30px] flex flex-col">
                    {/* Górna część info */}
                    <div className="shrink-0 p-4 2xl:p-5">
                        <div
                            className="grid grid-cols-[64px_minmax(0,1fr)_86px] 2xl:grid-cols-[76px_minmax(0,1fr)_96px] gap-3 items-start">
                            <img
                                src={headerLogo}
                                onError={headerOnError}
                                alt="deck"
                                className="w-[64px] h-[64px] 2xl:w-[76px] 2xl:h-[76px] rounded-xl shadow object-cover"
                            />

                            <div className="min-w-0">
                                <div
                                    className="text-[clamp(1.15rem,1.45vw,2rem)] leading-tight font-extrabold app-text-primary break-words">
                                    {safeSelectedDeck.name}
                                </div>

                                <div className="app-text-secondary text-[clamp(0.88rem,0.95vw,1rem)] mt-1 leading-snug">
                                    Energie: {safeSelectedDeck.baseEnergy}
                                    {safeSelectedDeck.secondaryEnergy ? " / " + safeSelectedDeck.secondaryEnergy : ""}
                                </div>

                                <div className="mt-1 text-xs app-text-secondary">
                                    {isSharedDeck ? <>Właściciel decka: <b>{deckOwnerLabel}</b> • tryb widmowy / read-only</> : <>Właściciel decka: <b>{deckOwnerLabel}</b></>}
                                </div>

                                <div className="mt-1">
                    <span
                        className={`font-bold text-[clamp(0.95rem,1vw,1.05rem)] ${uiStatus === "COMPLETE" ? "text-green-700" : "text-orange-500"}`}>
                        {uiStatus === "COMPLETE" ? "Gotowa" : "W budowie"}
                    </span>
                                </div>
                            </div>

                            <div className="deck-card-box rounded-2xl px-2 py-3 text-center self-start">
                                <div className="text-[13px] font-bold leading-tight app-text-primary">Deck Power:</div>
                                <div
                                    className="text-[clamp(1.2rem,1.4vw,1.9rem)] mt-1 app-text-primary">{deckPower}</div>
                            </div>
                        </div>

                        {/* Wynik + checklista obok siebie */}
                        <div className="mt-3 grid grid-cols-2 gap-3 items-start">
                            <div className="deck-card-box rounded-2xl p-3 min-h-[180px]">
                                <div className="text-sm font-bold mb-2 app-text-primary">Wynik:</div>
                                <div className="text-[11px] app-text-secondary mb-2">
                                    {isSharedDeck ? "To są Twoje własne statystyki dla współdzielonego decka." : "To są statystyki właściciela decka."}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        className="deck-btn-success-soft px-2.5 py-1 rounded-lg text-sm leading-tight disabled:opacity-50"
                                        onClick={handleWin}
                                        disabled={savingResult}
                                    >
                                        Wygrana
                                    </button>

                                    <button
                                        className="deck-btn-danger-soft px-2.5 py-1 rounded-lg text-sm leading-tight disabled:opacity-50"
                                        onClick={handleLoss}
                                        disabled={savingResult}
                                    >
                                        Przegrana
                                    </button>

                                    <button
                                        className="deck-btn-muted px-2.5 py-1 rounded-lg text-sm leading-tight disabled:opacity-50"
                                        onClick={resetWinRatio}
                                        disabled={savingResult}
                                        title="Ustaw wins/losses na 0"
                                    >
                                        Reset wyniku
                                    </button>
                                </div>

                                <div className="mt-2 text-[12px] app-text-secondary leading-snug">
                                    Rozegrane: <b>{wins + losses}</b> | Wygrane: <b>{wins}</b> |
                                    Przegrane: <b>{losses}</b>
                                    <br/>
                                    Win Ratio:{" "}
                                    <b>{wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) + "%" : "-"}</b>
                                </div>
                            </div>

                            <div className="min-h-[180px]">
                                <DeckChecklist deck={safeSelectedDeck} compact/>
                            </div>
                        </div>

                        {/* Przyciski akcji */}
                        <div className="mt-3 grid grid-cols-4 gap-2">
                            <button
                                className="deck-btn-primary px-2 py-2 rounded-xl text-sm leading-tight min-h-[44px] disabled:opacity-40"
                                onClick={() => setShowEdit(true)}
                                disabled={isReadOnlyDeck || !selectedDeckId}
                                title={isReadOnlyDeck ? "Udostępniony deck jest tylko do podglądu" : "Edytuj deck"}
                            >
                                Edytuj Deck
                            </button>

                            <button className="deck-btn-muted px-2 py-2 rounded-xl text-sm leading-tight min-h-[44px] disabled:opacity-40" disabled>
                                Kopiuj
                            </button>

                            <button
                                className="deck-btn-muted px-2 py-2 rounded-xl text-sm leading-tight min-h-[44px] disabled:opacity-40"
                                disabled={isReadOnlyDeck || !selectedDeckId}
                                onClick={() => setShowExport(true)}
                                title={isReadOnlyDeck ? "Nie możesz eksportować cudzego decka" : "Udostępnij deck innemu użytkownikowi"}
                            >
                                Export
                            </button>

                            <button
                                className="deck-btn-danger px-2 py-2 rounded-xl text-sm leading-tight min-h-[44px] disabled:opacity-40"
                                onClick={handleDelete}
                                disabled={isReadOnlyDeck || !selectedDeckId}
                            >
                                Usuń
                            </button>
                        </div>
                    </div>

                    {/* Miniatury kart */}
                    <div className="min-h-0 flex-1 p-4 pt-0 2xl:p-5 2xl:pt-0 flex flex-col">
                        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap shrink-0">
                            <div className="text-sm font-bold app-text-primary">Karty w talii:</div>

                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[11px] app-text-secondary mr-1">Filtr:</span>

                                <button
                                    type="button"
                                    className={`text-[11px] px-2 py-1 rounded border transition ${
                                        thumbFilter === "ALL"
                                            ? "deck-chip-active text-[11px] px-2 py-1 rounded border transition"
                                            : "deck-chip text-[11px] px-2 py-1 rounded border transition"
                                    }`}
                                    onClick={() => setThumbFilter("ALL")}
                                >
                                    Wszystkie
                                </button>

                                <button
                                    type="button"
                                    className={`text-[11px] px-2 py-1 rounded border transition ${
                                        thumbFilter === "POKEMON"
                                            ? "deck-chip-active text-[11px] px-2 py-1 rounded border transition"
                                            : "deck-chip text-[11px] px-2 py-1 rounded border transition"
                                    }`}
                                    onClick={() => setThumbFilter("POKEMON")}
                                >
                                    Pokemony
                                </button>

                                <button
                                    type="button"
                                    className={`text-[11px] px-2 py-1 rounded border transition ${
                                        thumbFilter === "SUPPORTER"
                                            ? "deck-chip-active text-[11px] px-2 py-1 rounded border transition"
                                            : "deck-chip text-[11px] px-2 py-1 rounded border transition"
                                    }`}
                                    onClick={() => setThumbFilter("SUPPORTER")}
                                >
                                    Supportery
                                </button>
                            </div>
                        </div>

                        <div
                            className="deck-card-box deck-scrollbar min-h-0 flex-1 rounded-2xl p-2 overflow-y-auto overflow-x-hidden">
                            <div className="grid grid-cols-4 gap-2 pr-1 auto-rows-max">
                                {deckUniqueCardsFiltered.map(({card, qty}, idx) => (
                                    <button
                                        key={card.id}
                                        type="button"
                                        className="relative group flex flex-col items-center"
                                        onClick={() =>
                                            navigate(`/card/${card.id}`, {
                                                state: {
                                                    from: "deck",
                                                    view: isSharedDeck ? "shared-deck" : "deck",
                                                    deckId: selectedDeckId,
                                                    deckName: safeSelectedDeck.name,
                                                    deckCardIds,
                                                    idxInDeck: idx,
                                                    readOnlyDeck: isReadOnlyDeck,
                                                    ownerUsername: safeSelectedDeck.ownerUsername,
                                                },
                                            })
                                        }
                                        title={`${card.name || "Karta"} ×${qty}`}
                                    >
                                        <img
                                            src={card.imageUrlSmall || "/card_placeholder.png"}
                                            alt={card.name || "card"}
                                            className="w-full h-[76px] xl:h-[82px] 2xl:h-[90px] object-contain bg-transparent rounded-md transition-transform duration-200 group-hover:scale-[1.12]"
                                        />
                                        <span
                                            className="absolute -bottom-1 right-0 bg-black/70 text-white text-[10px] px-1.5 rounded pointer-events-none">
                            ×{qty}
                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showEdit && !isReadOnlyDeck && (
                <DeckEditModal
                    deck={safeSelectedDeck}
                    logos={AVAILABLE_LOGOS}
                    onSave={handleEditSave}
                    onClose={() => setShowEdit(false)}
                />
            )}

            {showExport && !isReadOnlyDeck && (
                <ExportDeckModal
                    deck={safeSelectedDeck}
                    onClose={() => setShowExport(false)}
                    onSuccess={handleExportSuccess}
                />
            )}

            {showCreate && (
                <NewDeckModal
                    logos={AVAILABLE_LOGOS}
                    onSave={handleCreateDeck}
                    onClose={() => setShowCreate(false)}
                />
            )}
        </div>
    );
}
