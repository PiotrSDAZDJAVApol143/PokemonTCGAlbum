import {useLocation, useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";
import api from "../api";
import {useAuth} from "../context/AuthContext.jsx";
import DeckSelectModal from "../components/DeckSelectModal";

// JWT helpers
function parseJwt(token) {
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

function groupInstances(instances) {
    const perDeck = new Map(); // deckId -> { name, ids: [] }
    const unassigned = [];
    for (const inst of instances) {
        if (inst.deckId != null) {
            const g = perDeck.get(inst.deckId) ?? { name: inst.deckName, ids: [] };
            g.ids.push(inst.id);
            perDeck.set(inst.deckId, g);
        } else {
            unassigned.push(inst.id);
        }
    }
    return { perDeck, unassigned };
}

function getRoleFromToken(token) {
    const decoded = parseJwt(token);
    if (!decoded?.role) return "USER";
    if (decoded.role === "ROLE_DEV") return "DEV";
    if (decoded.role === "ROLE_USER") return "USER";
    return decoded.role;
}
function BulkDeckAssign({
                            instances,
                            onAssignMany,      // (ids[], deckId) => Promise<void>
                            onMoveMany,        // (ids[], toDeckId) => Promise<void>
                            onRemoveMany,      // (ids[]) => Promise<void>
                            fetchDecks,        // () => Promise<Array<{id,name}>>
                        }) {
    const { perDeck, unassigned } = groupInstances(instances);

    const [allDecks, setAllDecks] = useState([]);
    // Nieprzypisane – jeden zestaw sterowania
    const [addCount, setAddCount] = useState(0);
    const [addTarget, setAddTarget] = useState("");

    // Per-deck stany do kompaktowych akcji
    const [countsRemove, setCountsRemove] = useState({}); // deckId -> number
    const [countsMove, setCountsMove] = useState({});     // deckId -> number
    const [targets, setTargets] = useState({});           // deckId -> toDeckId

    // Pobierz talie (raz)
    useEffect(() => {
        let alive = true;
        fetchDecks()
            .then(d => { if (alive) setAllDecks(d); })
            .catch(() => setAllDecks([]));
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const deckOptions = allDecks.map(d => ({ value: d.id, label: d.name }));

    return (
        <div className="mt-4 p-4 rounded bg-white shadow space-y-4">
            <div className="font-bold text-lg">
                Karty w kolekcji: {instances.length}{" "}
                <span className="text-sm text-gray-500">(nieprzypisane: {unassigned.length})</span>
            </div>

            {/* ==== NIEPRZYPISANE – PROSTY WIERZCH ===== */}
            {unassigned.length > 0 && (
                <div className="p-3 rounded bg-gray-50 border">
                    <div className="font-semibold mb-2">Nieprzypisane</div>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="number"
                            className="w-20 border rounded px-2 py-1"
                            min={0}
                            max={unassigned.length}
                            value={addCount}
                            onChange={e => setAddCount(
                                Math.max(0, Math.min(unassigned.length, Number(e.target.value) || 0))
                            )}
                        />
                        <span className="text-sm">szt →</span>
                        <select
                            className="min-w-[200px] border rounded px-2 py-1"
                            value={addTarget}
                            onChange={e => setAddTarget(e.target.value)}
                        >
                            <option value="">Wybierz talię</option>
                            {deckOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <button
                            className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-40"
                            disabled={addCount === 0 || !addTarget}
                            onClick={async () => {
                                const ids = unassigned.slice(0, addCount);
                                await onAssignMany(ids, addTarget);
                                setAddCount(0);
                            }}
                        >
                            Przypisz
                        </button>
                    </div>
                </div>
            )}

            {/* ==== KAŻDA TALIA – KOMPAKTOWY WIERZCH ==== */}
            {[...perDeck.entries()].map(([deckId, info]) => {
                const current = info.ids.length;
                const toRemove = countsRemove[deckId] ?? 0;
                const toMove = countsMove[deckId] ?? 0;
                const targetDeck = targets[deckId] ?? "";

                return (
                    <div key={deckId} className="p-3 rounded bg-gray-50 border">
                        <div className="font-semibold mb-2">
                            Deck: <b>{info.name}</b>{" "}
                            <span className="text-sm text-gray-500">(w talii: {current})</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Usuń */}
                            <span className="whitespace-nowrap">Usuń:</span>
                            <input
                                type="number"
                                className="w-20 border rounded px-2 py-1"
                                min={0}
                                max={current}
                                value={toRemove}
                                onChange={e =>
                                    setCountsRemove(s => ({
                                        ...s,
                                        [deckId]: Math.max(0, Math.min(current, Number(e.target.value) || 0))
                                    }))
                                }
                            />
                            <span className="text-sm">szt</span>
                            <button
                                className="px-3 py-1 rounded bg-rose-500 text-white disabled:opacity-40"
                                disabled={toRemove === 0}
                                onClick={async () => {
                                    const ids = info.ids.slice(0, toRemove);
                                    await onRemoveMany(ids);
                                    setCountsRemove(s => ({ ...s, [deckId]: 0 }));
                                }}
                            >
                                Usuń z talii
                            </button>

                            {/* separator */}
                            <span className="mx-2 opacity-60">/</span>

                            {/* Przenieś */}
                            <span className="whitespace-nowrap">Przenieś:</span>
                            <input
                                type="number"
                                className="w-20 border rounded px-2 py-1"
                                min={0}
                                max={current}
                                value={toMove}
                                onChange={e =>
                                    setCountsMove(s => ({
                                        ...s,
                                        [deckId]: Math.max(0, Math.min(current, Number(e.target.value) || 0))
                                    }))
                                }
                            />
                            <span className="text-sm">szt →</span>
                            <select
                                className="min-w-[200px] border rounded px-2 py-1"
                                value={targetDeck}
                                onChange={e => setTargets(s => ({ ...s, [deckId]: e.target.value }))}
                            >
                                <option value="">Wybierz talię</option>
                                {deckOptions
                                    .filter(opt => String(opt.value) !== String(deckId))
                                    .map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                            </select>
                            <button
                                className="px-3 py-1 rounded bg-amber-500 text-white disabled:opacity-40"
                                disabled={toMove === 0 || !targetDeck}
                                onClick={async () => {
                                    const ids = info.ids.slice(0, toMove);
                                    await onMoveMany(ids, targetDeck);
                                    setCountsMove(s => ({ ...s, [deckId]: 0 }));
                                }}
                            >
                                Przenieś
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function CardDetails() {
    const {cardId} = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Params z poprzedniej strony (album/set/user etc.)
    const page = location.state?.page || 0;
    const size = location.state?.size || 10;
    const name = location.state?.name || "";
    const setId = location.state?.setId || "";
    const idxOnPage = location.state?.idxOnPage || 0;
    const view = location.state?.view || "all";
    const {accessToken} = useAuth();
    const userRole = getRoleFromToken(accessToken);

    // ---- STANY ----
    const [cards, setCards] = useState([]);
    const [card, setCard] = useState(null);
    const [totalPages, setTotalPages] = useState(1);

    const isUserView = view === "user" || view === "user-set";
    const isDevView = userRole === "DEV" || userRole === "ROLE_DEV";
    const [instances, setInstances] = useState([]);    // wszystkie kopie tej karty
    const [currentIdx, setCurrentIdx] = useState(0);   // która kopia aktualnie wyświetlana
    const [deckModalInstId, setDeckModalInstId] = useState(null); // do przypisania do talii
    const [editRatings, setEditRatings] = useState({
        overall: "",
        attacks: [],
        abilities: [],
    });

    // Pobierz listę kart na tej stronie (do nawigacji strzałkami)
    useEffect(() => {
        let url, params = {page, size};
        if (isUserView) {
            url = "/user-cards/search";
            if (name) params.name = name;
            if (setId) params.setId = setId;
        } else {
            url = "/api/cards/search";
            if (name) params.name = name;
            if (setId) params.setId = setId;
        }
        api.get(url, {params})
            .then(res => {
                setCards(res.data.content.map(c => ({
                    ...c,
                    id: c.id || c.cardId,
                    name: c.name || c.cardName,
                })));
                setTotalPages(res.data.totalPages);
            })
            .catch(() => {
                setCards([]);
                setTotalPages(1);
            });
    }, [page, size, name, setId, view]);

    // Pobierz szczegóły karty (wszystkie dane statyczne)
    useEffect(() => {
        if (!cardId) return;
        axios.get(`/api/cards/${cardId}`)
            .then(res => {
                setCard(res.data);
                const atkVals = (res.data.attacks || []).map(a => a?.defRating ?? "");
                const abVals = (res.data.abilities || []).map(a => a?.rating ?? "");
                const ruleVals = (res.data.rules || []).map(r => r?.rating ?? "");
                // zainicjuj input DEV aktualnym ratingiem
                setEditRatings({
                    overall: res.data.overallRating ?? "",
                    attacks: atkVals,
                    abilities: abVals,
                    rules: ruleVals,
                });
            });
    }, [cardId]);
    // helper do refetchu po zapisie
    const refreshCard = async () => {
        const res = await axios.get(`/api/cards/${cardId}`);
        setCard(res.data);
        const atkVals = (res.data.attacks || []).map(a => a?.defRating ?? "");
        const abVals = (res.data.abilities || []).map(a => a?.rating ?? "");
        const ruleVals = (res.data.rules || []).map(r => r?.rating ?? "");
        setEditRatings({
            overall: res.data.overallRating ?? "",
            attacks: atkVals,
            abilities: abVals,
            rules: ruleVals,
        });
    };

    // Pobierz instancje tej karty (każdy duplikat jako osobny obiekt)
    useEffect(() => {
        if (!cardId || !isUserView) {
            setInstances([]); // wyczyść jeśli nie user view
            return;
        }
        api.get(`/user-cards/details/${cardId}`)
            .then(res => {
                setInstances(res.data.instances || []);
                setCurrentIdx(0);
            });
    }, [cardId, isUserView]);

    // Po zmianie cardId zresetuj aktualną instancję (wyświetlaj pierwszą)
    useEffect(() => {
        setCurrentIdx(0);
    }, [cardId]);

    // ---- HANDLERY ----

    // Dodaj nową kopię
    const handleAdd = async () => {
        await api.post("/user-cards/add-instance", {cardId}); // POST na nowy endpoint!
        const res = await api.get(`/user-cards/details/${cardId}`);
        setInstances(res.data.instances || []);
        setCurrentIdx(res.data.instances.length - 1); // nowa jest ostatnia
    };
    // Usuń najwyżej numerowaną kopię
    const handleRemove = async () => {
        if (!instances.length) return;
        const instToRemove = instances[instances.length - 1];
        await api.delete(`/user-cards/instance/${instToRemove.id}`);
        const res = await api.get(`/user-cards/details/${cardId}`);
        setInstances(res.data.instances || []);
        setCurrentIdx(i => Math.max(0, i - 1));
    };

    const fetchDecks = async () => {
        const res = await api.get("/user/decks");
        // oczekuję tablicy {id, name}; jeśli masz inny kształt — zmapuj tutaj
        return (Array.isArray(res.data) ? res.data : (res.data.decks || res.data.content || []))
            .map(d => ({ id: d.id, name: d.name }));
    };

// dodaj N nieprzypisanych do decka
    const handleAssignMany = async (ids, deckId) => {
        for (const id of ids) {
            await api.post(`/user-cards/instance/${id}/assign-to-deck`, { deckId });
        }
        const res = await api.get(`/user-cards/details/${cardId}`);
        setInstances(res.data.instances || []);
    };

// przenieś N z decka A do B (po prostu assign nadpisuje deckId)
    const handleMoveMany = async (ids, toDeckId) => {
        for (const id of ids) {
            await api.post(`/user-cards/instance/${id}/assign-to-deck`, { deckId: toDeckId });
        }
        const res = await api.get(`/user-cards/details/${cardId}`);
        setInstances(res.data.instances || []);
    };

// usuń N z tej talii
    const handleRemoveMany = async (ids) => {
        for (const id of ids) {
            await api.post(`/user-cards/instance/${id}/remove-from-deck`);
        }
        const res = await api.get(`/user-cards/details/${cardId}`);
        setInstances(res.data.instances || []);
    };

    // Przypisz/przenieś do decka
    const handleAssignToDeck = async (deckId) => {
        if (!deckModalInstId) return;
        await api.post(`/user-cards/instance/${deckModalInstId}/assign-to-deck`, {deckId});
        const res = await api.get(`/user-cards/details/${cardId}`);
        setInstances(res.data.instances || []);
        setDeckModalInstId(null);
    };
    // Usuń kartę z talii
    const handleRemoveFromDeck = async (instanceId) => {
        await api.post(`/user-cards/instance/${instanceId}/remove-from-deck`);
        const res = await api.get(`/user-cards/details/${cardId}`);
        setInstances(res.data.instances || []);
    };
    // Przenieś do innej talii (otwórz modal)
    const handleMoveToOtherDeck = (instanceId) => {
        setDeckModalInstId(instanceId);
    };

    // Powrót do albumu (z pamięcią paginacji)
    const handleBack = () => {
        if (location.state?.from === "deck" || view === "deck") {
            navigate("/deck");
            return;
        }

        if (view === "user") {
            navigate("/album", {state: {step: "user-all", page, search: name}});
        } else if (view === "user-set") {
            navigate("/album", {state: {step: "user-set-cards", setId, page, search: name}});
        } else if (view === "set") {
            navigate("/album", {state: {step: "set-cards", setId, page, search: name}});
        } else {
            navigate("/album", {state: {step: "all", page, search: name}});
        }
    };

    // ---- PATCH HANDLERY dla dev/admin ----
    const saveOverallRating = () => {
        api.patch(`/dev/${cardId}/rating`, {rating: parseInt(editRatings.overall)})
            .then(async () => {
                await refreshCard();
                alert("Siła karty zapisana");
            })
            .catch(() => alert("Błąd zapisu"));
    };
    const saveAttackRating = (idx, defId) => {
        api.patch(`/dev/attack-defs/${defId}/rating`, {rating: parseInt(editRatings.attacks[idx])})
            .then(async () => {
                await refreshCard();
                alert("Ocena ataku zapisana");
            })
            .catch(() => alert("Błąd zapisu"));
    };

    const saveAbilityRating = (idx, defId) => {
        const val = parseInt(editRatings.abilities[idx], 10);
        if (!defId) {
            alert("Brak defId ability");
            return;
        }
        if (Number.isNaN(val)) {
            alert("Podaj liczbę 1–10");
            return;
        }

        api.patch(`/dev/ability-defs/${defId}/rating`, {rating: val})
            .then(async () => {
                await refreshCard();
                alert("Ocena ability zapisana");
            })
            .catch(() => alert("Błąd zapisu"));
    };
    const saveRuleRating = (idx, ruleId) => {
        const val = parseInt(editRatings.rules?.[idx], 10);

        if (ruleId == null) {
            alert("Brak ruleId");
            return;
        }
        if (Number.isNaN(val)) {
            alert("Podaj liczbę (może być ujemna)");
            return;
        }

        // Uwaga: używamy instancji `api` => bez /api w ścieżce
        api.patch(`/dev/rule/${ruleId}/rating`, { rating: val })
            .then(async () => {
                await refreshCard();
                alert("Ocena rule zapisana");
            })
            .catch(err => {
                const msg = err?.response?.data || err.message || "Błąd zapisu";
                alert(`Błąd zapisu: ${msg}`);
            });
    };

    // Strzałki nawigacji pomiędzy kartami
    const goToPrev = () => {
        if (idxOnPage > 0) {
            const prevCard = cards[idxOnPage - 1];
            navigate(`/card/${prevCard.id}`, {
                state: {page, size, name, setId, idxOnPage: idxOnPage - 1, view}
            });
        } else if (page > 0) {
            axios.get("/api/cards/search", {
                params: {page: page - 1, size, name, setId}
            }).then(res => {
                const lastIdx = res.data.content.length - 1;
                const prevCard = res.data.content[lastIdx];
                navigate(`/card/${prevCard.id}`, {
                    state: {page: page - 1, size, name, setId, idxOnPage: lastIdx, view}
                });
            });
        }
    };
    const goToNext = () => {
        if (idxOnPage < cards.length - 1) {
            const nextCard = cards[idxOnPage + 1];
            navigate(`/card/${nextCard.id}`, {
                state: {page, size, name, setId, idxOnPage: idxOnPage + 1, view}
            });
        } else if (page < totalPages - 1) {
            axios.get("/api/cards/search", {
                params: {page: page + 1, size, name, setId}
            }).then(res => {
                const nextCard = res.data.content[0];
                navigate(`/card/${nextCard.id}`, {
                    state: {page: page + 1, size, name, setId, idxOnPage: 0, view}
                });
            });
        }
    };

    // Główne renderowanie
    if (!card) return <div className="p-10">Ładowanie...</div>;

    // Wyświetlana instancja (kopia) karty
    const currentInstance = instances[currentIdx] || null;

    return (
        <div className="relative min-h-[90vh]">
            <button
                className="absolute left-10 top-10 px-6 py-2 rounded bg-gray-200 font-bold"
                onClick={handleBack}
            >← Powrót
            </button>
            <div className="flex w-full h-full min-h-[80vh] bg-[#f7f8fa]">
                {/* Lewa strzałka */}
                <div className="flex items-center justify-center" style={{width: '5%'}}>
                    <button
                        className="text-4xl p-3 hover:bg-gray-200 rounded-full disabled:opacity-30"
                        onClick={goToPrev}
                        disabled={page === 0 && idxOnPage === 0}
                    >←
                    </button>
                </div>
                {/* Obraz karty i panel egzemplarzy */}
                <div className="flex items-center justify-center" style={{width: '40%'}}>
                    <div className="flex flex-col items-center">
                        <img src={card.imageUrlLarge || card.imageUrlSmall} alt={card.name}
                             className="w-[440px] rounded-lg shadow-lg"/>
                        {isUserView && (
                            <div className="flex flex-col items-center gap-2 mt-4">
                                <div
                                    className="flex items-center gap-4 border rounded-2xl px-6 py-2 bg-white shadow-lg">
                                    <button className="text-3xl font-bold text-red-500 px-2"
                                            onClick={handleRemove} disabled={instances.length === 0}>-
                                    </button>
                                    <span className="text-2xl font-bold">
                                        {instances.length > 0 ? (currentIdx + 1) : 0} / {instances.length}
                                    </span>
                                    <button className="text-3xl font-bold text-green-600 px-2"
                                            onClick={handleAdd}>+
                                    </button>
                                </div>
                                {/* Przewijanie instancji */}
                                {instances.length > 1 && (
                                    <div className="flex gap-2 mt-2">
                                        <button className="px-3 py-1 rounded border"
                                                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                                                disabled={currentIdx === 0}>{"<"}</button>
                                        <button className="px-3 py-1 rounded border"
                                                onClick={() => setCurrentIdx(i => Math.min(instances.length - 1, i + 1))}
                                                disabled={currentIdx === instances.length - 1}>{">"}</button>
                                    </div>
                                )}
                            </div>
                        )}
                        {isUserView && (
                            <div className="mt-4">
                                <b>Twoja ocena karty:</b>
                                <div>[★★★★★]</div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Panel informacji */}
                <div className="flex flex-col justify-start" style={{width: '50%'}}>
                    <div className="text-5xl font-extrabold mb-4">{card.name}</div>
                    <div className="mb-1">Typ: {card.type} HP: {card.hp}</div>
                    <div className="mb-1 flex items-center gap-2">
                        Seria: {card.set?.series}
                        {card.set?.logoUrl && <img src={card.set.logoUrl} alt="logo" className="h-8 inline ml-2"/>}
                    </div>
                    <div className="mb-1">Set: {card.set?.name}</div>
                    <div className="mb-1">Pokedex numer: {card.pokedexNumber}</div>
                    <div className="mb-1">
                        Cena CardMarket:&nbsp;
                        <a href={card.cardmarketUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            {card.cardmarketLowPrice ? (
                                <>
                                    <span className="text-xl font-bold">{card.cardmarketLowPrice}€</span>
                                    {card.cardmarketAvgSellPrice && (
                                        <span className="ml-2 text-sm text-gray-600">
            (średnia: {card.cardmarketAvgSellPrice}€)
          </span>
                                    )}
                                </>
                            ) : card.cardmarketAvgSellPrice ? (
                                <span className="text-sm text-gray-600">
        (średnia: {card.cardmarketAvgSellPrice}€)
      </span>
                            ) : (
                                "-"
                            )}
                        </a>
                    </div>
                    {isDevView && (
                        <button
                            className="ml-2 px-3 py-1 rounded bg-indigo-600 text-white"
                            onClick={async () => {
                                await api.patch(`/dev/${cardId}/recalc-rating`);
                                await refreshCard();
                            }}
                        >
                            Przelicz SIŁĘ
                        </button>
                    )}
                    <div className="mb-1 font-semibold">
                        SIŁA karty: {card.overallRating ?? "-"}
                    </div>
                    {(card.flavorTextPl || card.flavorText) ? (
                        <div className="mb-2">Opis: {card.flavorTextPl || card.flavorText}</div>
                    ) : card.supertype !== "Pokémon" && Array.isArray(card.rules) && card.rules.length > 0 ? (
                        <div className="mb-2">
                            <b>Zasady karty:</b>
                            <ul className="list-disc ml-6">
                                {card.rules.map((rule, idx) => (
                                    <li
                                        key={rule.id || idx}
                                        className={idx === 0
                                            ? "font-bold text-lg mb-1"
                                            : "font-normal text-base"
                                        }
                                    >
                                        {rule.textPl || rule.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {/* Umiejętności */}
                    {card.abilities?.length > 0 && (
                        <div className="mt-4">
                            <b>Specjalne Umiejętności:</b>
                            {card.abilities.map((ability, idx) => (
                                <div key={ability.id || idx} className="mb-3">
                                    <span className="font-bold">{ability.namePl || ability.name}</span>
                                    <div>{ability.descriptionPl || ability.description}</div>
                                    {isDevView && (
                                        <span style={{marginLeft: '2em'}}>
                                            Ocena Administratora:&nbsp;
                                            <input
                                                className="border rounded px-2 py-1 w-16"
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={editRatings.abilities[idx] || ""}
                                                onChange={e => {
                                                    const newArr = [...editRatings.abilities];
                                                    newArr[idx] = e.target.value;
                                                    setEditRatings(r => ({...r, abilities: newArr}));
                                                }}
                                            />
                                            <button
                                                className="ml-2 px-2 py-1 bg-blue-400 text-white rounded"
                                                onClick={() => saveAbilityRating(idx, ability.defId)}
                                            >
                                                Zapisz
                                            </button>
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {card.attacks?.length > 0 && (
                        <div className="mt-4">
                            <b>Ataki:</b>
                            {card.attacks.map((at, idx) => (
                                <div key={at.id || at.attackId || idx} className="mb-3">
                                    <b>{at.namePl || at.name}</b>
                                    {at.damage && <> dmg {at.damage}</>}
                                    <div>{at.descriptionPl || at.description}</div>
                                    {isDevView && (
                                        <span style={{marginLeft: '2em'}}>
                                            Ocena Administratora:&nbsp;
                                            <input
                                                className="border rounded px-2 py-1 w-16"
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={editRatings.attacks[idx] || ""}
                                                onChange={e => {
                                                    const newArr = [...editRatings.attacks];
                                                    newArr[idx] = e.target.value;
                                                    setEditRatings(r => ({...r, attacks: newArr}));
                                                }}
                                            />
                                            <button className="ml-2 px-2 py-1 bg-blue-400 text-white rounded"
                                                    onClick={() => saveAttackRating(idx, at.defId)}>Zapisz</button>
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {card.rules?.length > 0 && (
                        <div className="mt-4">
                            <b>Zasady (rules):</b>
                            {card.rules.map((rule, idx) => (
                                <div key={rule.id || idx} className="mb-3">
                                    <span>{rule.textPl || rule.text}</span>
                                    {isDevView && (
                                        <span style={{marginLeft: '2em'}}>
                                            Ocena Administratora:&nbsp;
                                            <input
                                                className="border rounded px-2 py-1 w-16"
                                                type="number"
                                                value={editRatings.rules?.[idx] || ""}
                                                onChange={e => {
                                                    const newArr = [...(editRatings.rules || [])];
                                                    newArr[idx] = e.target.value;
                                                    setEditRatings(r => ({...r, rules: newArr}));
                                                }}
                                            />
                                            <button
                                                className="ml-2 px-2 py-1 bg-blue-400 text-white rounded"
                                                onClick={() => saveRuleRating(idx, rule.id)}
                                            >Zapisz</button>
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Decki/powtórki jeśli UserView */}
                    {isUserView && (
                        <div className="mt-6">
                            {instances.length >= 10 ? (
                                // TRYB AGREGOWANY
                                <BulkDeckAssign
                                    instances={instances}
                                    onAssignMany={handleAssignMany}
                                    onMoveMany={handleMoveMany}
                                    onRemoveMany={handleRemoveMany}
                                    fetchDecks={fetchDecks}
                                />
                            ) : (
                                // DOTYCHCZASOWA LISTA (do 9 szt.)
                                <div className="p-4 rounded bg-gray-100 shadow">
                                    <div><b>Karty w kolekcji: {instances.length}</b></div>
                                    <div className="mt-2">
                                        <b>Decki:</b>
                                        <ol className="ml-6 list-decimal">
                                            {instances.map((inst) => {
                                                const assigned = inst.deckId != null || inst.status === "in_deck";
                                                return (
                                                    <li key={inst.id} className="flex items-center gap-2">
                                                        {assigned ? (
                                                            <>
                                                                Deck: <b>{inst.deckName}</b>
                                                                <button className="ml-2 px-2 py-1 bg-gray-200 rounded" onClick={() => handleMoveToOtherDeck(inst.id)}>
                                                                    Przenieś
                                                                </button>
                                                                <button className="ml-2 px-2 py-1 bg-red-200 rounded" onClick={() => handleRemoveFromDeck(inst.id)}>
                                                                    Usuń z talii
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="italic">Nieprzypisana</span>
                                                                <button className="ml-2 px-2 py-1 bg-blue-200 rounded" onClick={() => setDeckModalInstId(inst.id)}>
                                                                    Dodaj do talii
                                                                </button>
                                                            </>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Panel dev do oceny ogólnej */}
                    {isDevView && (
                        <div className="mt-6 p-4 rounded bg-orange-100 shadow">
                            <label className="block mb-2 font-bold">Ocena ogólna karty (admin):</label>
                            <input
                                className="border rounded px-2 py-1 w-24"
                                type="number"
                                value={editRatings.overall}
                                onChange={e =>
                                    setEditRatings(r => ({...r, overall: e.target.value}))
                                }
                            />
                            <button
                                className="ml-2 px-4 py-1 bg-blue-600 text-white rounded"
                                onClick={saveOverallRating}
                            >Zapisz
                            </button>
                        </div>
                    )}
                </div>
                {/* Prawa strzałka */}
                <div className="flex items-center justify-center" style={{width: '5%'}}>
                    <button className="text-4xl p-3 hover:bg-gray-200 rounded-full disabled:opacity-30"
                            onClick={goToNext}
                            disabled={page === totalPages - 1 && idxOnPage === cards.length - 1}>→
                    </button>
                </div>
            </div>
            {/* MODAL wyboru decka */}
            {deckModalInstId && (
                <DeckSelectModal
                    onSelect={handleAssignToDeck}
                    onCancel={() => setDeckModalInstId(null)}
                />
            )}
        </div>
    );
}
