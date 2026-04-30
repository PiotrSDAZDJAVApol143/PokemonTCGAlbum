import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getEditableDecks } from "../services/deckService.js";
import {
    getCardById,
    searchPublicCards,
} from "../services/cardService.js";
import {
    addCardInstance,
    assignInstanceToDeck,
    assignManyInstancesToDeck,
    deleteCardInstance,
    getUserCardDetails,
    removeInstanceFromDeck,
    removeManyInstancesFromDeck,
    searchUserCards,
} from "../services/userCardService.js";
import {
    recalcCardRating,
    saveAbilityRating as saveAbilityRatingRequest,
    saveAttackRating as saveAttackRatingRequest,
    saveOverallRating as saveOverallRatingRequest,
    saveRuleRating as saveRuleRatingRequest,
} from "../services/devCardService.js";
import { useAuth } from "../context/AuthContext.jsx";
import DeckSelectModal from "../components/DeckSelectModal";
import CardImage from "../components/CardImage.jsx";

// JWT helpers
function parseJwt(token) {
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split(".")[1]));
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
                            onAssignMany,
                            onMoveMany,
                            onRemoveMany,
                            fetchDecks,
                        }) {
    const { perDeck, unassigned } = groupInstances(instances);

    const [allDecks, setAllDecks] = useState([]);
    const [addCount, setAddCount] = useState(0);
    const [addTarget, setAddTarget] = useState("");

    const [countsRemove, setCountsRemove] = useState({});
    const [countsMove, setCountsMove] = useState({});
    const [targets, setTargets] = useState({});

    useEffect(() => {
        let alive = true;

        fetchDecks()
            .then((d) => {
                if (alive) setAllDecks(d);
            })
            .catch(() => setAllDecks([]));

        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const deckOptions = allDecks.map((d) => ({ value: d.id, label: d.name }));

    return (
        <div className="mt-4 p-4 rounded bg-white shadow space-y-4">
            <div className="font-bold text-lg">
                Karty w kolekcji: {instances.length}{" "}
                <span className="text-sm text-gray-500">
                    (nieprzypisane: {unassigned.length})
                </span>
            </div>

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
                            onChange={(e) =>
                                setAddCount(
                                    Math.max(
                                        0,
                                        Math.min(unassigned.length, Number(e.target.value) || 0)
                                    )
                                )
                            }
                        />
                        <span className="text-sm">szt →</span>
                        <select
                            className="min-w-[200px] border rounded px-2 py-1"
                            value={addTarget}
                            onChange={(e) => setAddTarget(e.target.value)}
                        >
                            <option value="">Wybierz talię</option>
                            {deckOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
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
                            <span className="whitespace-nowrap">Usuń:</span>
                            <input
                                type="number"
                                className="w-20 border rounded px-2 py-1"
                                min={0}
                                max={current}
                                value={toRemove}
                                onChange={(e) =>
                                    setCountsRemove((s) => ({
                                        ...s,
                                        [deckId]: Math.max(
                                            0,
                                            Math.min(current, Number(e.target.value) || 0)
                                        ),
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
                                    setCountsRemove((s) => ({ ...s, [deckId]: 0 }));
                                }}
                            >
                                Usuń z talii
                            </button>

                            <span className="mx-2 opacity-60">/</span>

                            <span className="whitespace-nowrap">Przenieś:</span>
                            <input
                                type="number"
                                className="w-20 border rounded px-2 py-1"
                                min={0}
                                max={current}
                                value={toMove}
                                onChange={(e) =>
                                    setCountsMove((s) => ({
                                        ...s,
                                        [deckId]: Math.max(
                                            0,
                                            Math.min(current, Number(e.target.value) || 0)
                                        ),
                                    }))
                                }
                            />
                            <span className="text-sm">szt →</span>
                            <select
                                className="min-w-[200px] border rounded px-2 py-1"
                                value={targetDeck}
                                onChange={(e) =>
                                    setTargets((s) => ({ ...s, [deckId]: e.target.value }))
                                }
                            >
                                <option value="">Wybierz talię</option>
                                {deckOptions
                                    .filter((opt) => String(opt.value) !== String(deckId))
                                    .map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                            </select>
                            <button
                                className="px-3 py-1 rounded bg-amber-500 text-white disabled:opacity-40"
                                disabled={toMove === 0 || !targetDeck}
                                onClick={async () => {
                                    const ids = info.ids.slice(0, toMove);
                                    await onMoveMany(ids, targetDeck);
                                    setCountsMove((s) => ({ ...s, [deckId]: 0 }));
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

function buildEditRatingsFromCard(card) {
    const atkVals = (card?.attacks || []).map((a) => a?.defRating ?? "");
    const abVals = (card?.abilities || []).map((a) => a?.rating ?? "");
    const ruleVals = (card?.rules || []).map((r) => r?.rating ?? "");

    return {
        overall: card?.overallRating ?? "",
        attacks: atkVals,
        abilities: abVals,
        rules: ruleVals,
    };
}
export default function CardDetails() {
    const { cardId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const page = location.state?.page || 0;
    const size = location.state?.size || 10;
    const name = location.state?.name || "";
    const setId = location.state?.setId || "";
    const idxOnPage = location.state?.idxOnPage || 0;

    const fromDeck = location.state?.from === "deck";
    const deckCardIds = Array.isArray(location.state?.deckCardIds)
        ? location.state.deckCardIds
        : [];
    const idxInDeck = Number.isFinite(location.state?.idxInDeck)
        ? location.state.idxInDeck
        : 0;
    const deckId = location.state?.deckId ?? null;
    const deckName = location.state?.deckName ?? "";
    const ownerUsername = location.state?.ownerUsername ?? "";

    const view = location.state?.view || (fromDeck ? "deck" : "all");
    const isSharedDeckView =
        view === "shared-deck" || location.state?.readOnlyDeck === true;
    const isDeckLikeView = view === "deck" || view === "shared-deck" || fromDeck;

    const { accessToken } = useAuth();
    const userRole = getRoleFromToken(accessToken);

    const isUserView =
        view === "user" ||
        view === "user-set" ||
        (view === "deck" && !isSharedDeckView);

    const isDevView = userRole === "DEV" || userRole === "ROLE_DEV";

    const [cards, setCards] = useState([]);
    const [card, setCard] = useState(null);
    const [cardLoadError, setCardLoadError] = useState("");
    const [totalPages, setTotalPages] = useState(1);

    const [instances, setInstances] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [deckModalInstId, setDeckModalInstId] = useState(null);

    const [editRatings, setEditRatings] = useState({
        overall: "",
        attacks: [],
        abilities: [],
        rules: [],
    });

    useEffect(() => {
        if ((view === "deck" || view === "shared-deck") && deckCardIds.length > 0) {
            setCards(deckCardIds.map((id) => ({ id })));
            setTotalPages(1);
            return;
        }

        let cancelled = false;

        const loadCards = async () => {
            try {
                const result = isUserView
                    ? await searchUserCards({ page, size, name, setId })
                    : await searchPublicCards({ page, size, name, setId });

                if (cancelled) return;

                setCards(result.content || []);
                setTotalPages(result.totalPages || 1);
            } catch {
                if (cancelled) return;

                setCards([]);
                setTotalPages(1);
            }
        };

        loadCards();

        return () => {
            cancelled = true;
        };
    }, [page, size, name, setId, view, isUserView, deckCardIds]);

    useEffect(() => {
        if (!cardId) return;

        let cancelled = false;

        setCard(null);
        setCardLoadError("");

        getCardById(cardId)
            .then((loadedCard) => {
                if (cancelled) return;

                setCard(loadedCard);
                setEditRatings(buildEditRatingsFromCard(loadedCard));
            })
            .catch((e) => {
                if (cancelled) return;

                setCard(null);
                setCardLoadError(
                    e?.response?.data?.message ||
                    e?.response?.data ||
                    e?.message ||
                    "Nie udało się wczytać karty."
                );
            });

        return () => {
            cancelled = true;
        };
    }, [cardId]);

    const refreshCard = async () => {
        const loadedCard = await getCardById(cardId);

        setCard(loadedCard);
        setEditRatings(buildEditRatingsFromCard(loadedCard));
    };

    useEffect(() => {
        if (!cardId || !isUserView) {
            setInstances([]);
            return;
        }

        let cancelled = false;

        getUserCardDetails(cardId)
            .then((details) => {
                if (cancelled) return;

                setInstances(details.instances || []);
                setCurrentIdx(0);
            })
            .catch(() => {
                if (cancelled) return;

                setInstances([]);
                setCurrentIdx(0);
            });

        return () => {
            cancelled = true;
        };
    }, [cardId, isUserView]);

    const handleAdd = async () => {
        const details = await addCardInstance(cardId);
        const nextInstances = details.instances || [];

        setInstances(nextInstances);
        setCurrentIdx(Math.max(0, nextInstances.length - 1));
    };

    const handleRemove = async () => {
        if (!instances.length) return;

        const instToRemove = instances[instances.length - 1];

        await deleteCardInstance(instToRemove.id);

        const details = await getUserCardDetails(cardId);
        const nextInstances = details.instances || [];

        setInstances(nextInstances);
        setCurrentIdx((i) => Math.max(0, Math.min(i, nextInstances.length - 1)));
    };

    const fetchDecks = async () => {
        const decks = await getEditableDecks();
        return decks.map((d) => ({ id: d.id, name: d.name }));
    };

    const handleAssignMany = async (ids, targetDeckId) => {
        await assignManyInstancesToDeck(ids, targetDeckId);

        const details = await getUserCardDetails(cardId);
        setInstances(details.instances || []);
    };

    const handleMoveMany = async (ids, toDeckId) => {
        await assignManyInstancesToDeck(ids, toDeckId);

        const details = await getUserCardDetails(cardId);
        setInstances(details.instances || []);
    };

    const handleRemoveMany = async (ids) => {
        await removeManyInstancesFromDeck(ids);

        const details = await getUserCardDetails(cardId);
        setInstances(details.instances || []);
    };

    const handleAssignToDeck = async (targetDeckId) => {
        if (!deckModalInstId) return;

        await assignInstanceToDeck(deckModalInstId, targetDeckId);

        const details = await getUserCardDetails(cardId);

        setInstances(details.instances || []);
        setDeckModalInstId(null);
    };

    const handleRemoveFromDeck = async (instanceId) => {
        await removeInstanceFromDeck(instanceId);

        const details = await getUserCardDetails(cardId);
        setInstances(details.instances || []);
    };

    const handleMoveToOtherDeck = (instanceId) => {
        setDeckModalInstId(instanceId);
    };

    const handleBack = () => {
        if (location.state?.from === "deck" || view === "deck" || view === "shared-deck") {
            navigate("/deck", { state: { selectedDeckId: deckId } });
            return;
        }

        if (view === "user") {
            navigate("/album", { state: { step: "user-all", page, search: name } });
        } else if (view === "user-set") {
            navigate("/album", {
                state: { step: "user-set-cards", setId, page, search: name },
            });
        } else if (view === "set") {
            navigate("/album", {
                state: { step: "set-cards", setId, page, search: name },
            });
        } else {
            navigate("/album", { state: { step: "all", page, search: name } });
        }
    };

    const saveOverallRating = () => {
        const rating = parseInt(editRatings.overall, 10);

        saveOverallRatingRequest(cardId, rating)
            .then(async () => {
                await refreshCard();
                alert("Siła karty zapisana");
            })
            .catch(() => alert("Błąd zapisu"));
    };

    const saveAttackRating = (idx, defId) => {
        const rating = parseInt(editRatings.attacks[idx], 10);

        saveAttackRatingRequest(defId, rating)
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

        saveAbilityRatingRequest(defId, val)
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

        saveRuleRatingRequest(ruleId, val)
            .then(async () => {
                await refreshCard();
                alert("Ocena rule zapisana");
            })
            .catch((err) => {
                const msg = err?.response?.data || err.message || "Błąd zapisu";
                alert(`Błąd zapisu: ${msg}`);
            });
    };

    const goToPrev = () => {
        if ((view === "deck" || view === "shared-deck") && deckCardIds.length > 0) {
            if (idxInDeck <= 0) return;

            const prevId = deckCardIds[idxInDeck - 1];

            navigate(`/card/${prevId}`, {
                state: {
                    ...(location.state || {}),
                    idxInDeck: idxInDeck - 1,
                },
            });
            return;
        }

        if (idxOnPage > 0) {
            const prevCard = cards[idxOnPage - 1];

            navigate(`/card/${prevCard.id}`, {
                state: { page, size, name, setId, idxOnPage: idxOnPage - 1, view },
            });
            return;
        }

        if (page > 0) {
            const loadPrevPage = isUserView ? searchUserCards : searchPublicCards;

            loadPrevPage({ page: page - 1, size, name, setId }).then((result) => {
                const content = result.content || [];
                const lastIdx = Math.max(0, content.length - 1);
                const prevCard = content[lastIdx];
                const prevId = prevCard?.id || prevCard?.cardId;

                if (!prevId) return;

                navigate(`/card/${prevId}`, {
                    state: {
                        page: page - 1,
                        size,
                        name,
                        setId,
                        idxOnPage: lastIdx,
                        view,
                    },
                });
            });
        }
    };

    const goToNext = () => {
        if ((view === "deck" || view === "shared-deck") && deckCardIds.length > 0) {
            if (idxInDeck >= deckCardIds.length - 1) return;

            const nextId = deckCardIds[idxInDeck + 1];

            navigate(`/card/${nextId}`, {
                state: {
                    ...(location.state || {}),
                    idxInDeck: idxInDeck + 1,
                },
            });
            return;
        }

        if (idxOnPage < cards.length - 1) {
            const nextCard = cards[idxOnPage + 1];

            navigate(`/card/${nextCard.id}`, {
                state: { page, size, name, setId, idxOnPage: idxOnPage + 1, view },
            });
            return;
        }

        if (page < totalPages - 1) {
            const loadNextPage = isUserView ? searchUserCards : searchPublicCards;

            loadNextPage({ page: page + 1, size, name, setId }).then((result) => {
                const content = result.content || [];
                const first = content[0];
                const nextId = first?.id || first?.cardId;

                if (!nextId) return;

                navigate(`/card/${nextId}`, {
                    state: {
                        page: page + 1,
                        size,
                        name,
                        setId,
                        idxOnPage: 0,
                        view,
                    },
                });
            });
        }
    };

    if (!card) {
        return (
            <div className="p-10">
                {cardLoadError ? (
                    <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700 font-semibold">
                        {cardLoadError}
                    </div>
                ) : (
                    "Ładowanie..."
                )}
            </div>
        );
    }

    const isOfflineCard = !!card.offlineSnapshot;
    const canEditUserCollection = isUserView && !isOfflineCard;
    const canUseDevTools = isDevView && !isOfflineCard;

    const prevDisabled = isDeckLikeView
        ? idxInDeck <= 0
        : cards.length === 0 || (page === 0 && idxOnPage === 0);

    const nextDisabled = isDeckLikeView
        ? deckCardIds.length === 0 || idxInDeck >= deckCardIds.length - 1
        : cards.length === 0 || (page === totalPages - 1 && idxOnPage >= cards.length - 1);

    return (
        <div className="relative min-h-[90vh]">
            <button
                className="absolute left-10 top-10 px-6 py-2 rounded bg-gray-200 font-bold"
                onClick={handleBack}
            >
                ← Powrót
            </button>

            <div className="flex w-full h-[90vh] bg-[#f7f8fa] overflow-hidden">
                <div className="flex items-center justify-center" style={{ width: "5%" }}>
                    <button
                        className="text-4xl p-3 hover:bg-gray-200 rounded-full disabled:opacity-30"
                        onClick={goToPrev}
                        disabled={prevDisabled}
                    >
                        ←
                    </button>
                </div>

                <div className="flex items-center justify-center" style={{ width: "40%" }}>
                    <div className="flex flex-col items-center">
                        <CardImage
                            card={card}
                            size="large"
                            alt={card.name}
                            className="w-[440px] h-[615px] object-contain rounded-lg shadow-lg"
                        />

                        {canEditUserCollection && (
                            <div className="flex flex-col items-center gap-2 mt-4">
                                <div className="flex items-center gap-4 border rounded-2xl px-6 py-2 bg-white shadow-lg">
                                    <button
                                        className="text-3xl font-bold text-red-500 px-2"
                                        onClick={handleRemove}
                                        disabled={instances.length === 0}
                                    >
                                        -
                                    </button>
                                    <span className="text-2xl font-bold">
                                        {instances.length > 0 ? currentIdx + 1 : 0} / {instances.length}
                                    </span>
                                    <button
                                        className="text-3xl font-bold text-green-600 px-2"
                                        onClick={handleAdd}
                                    >
                                        +
                                    </button>
                                </div>

                                {instances.length > 1 && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            className="px-3 py-1 rounded border"
                                            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                                            disabled={currentIdx === 0}
                                        >
                                            {"<"}
                                        </button>
                                        <button
                                            className="px-3 py-1 rounded border"
                                            onClick={() =>
                                                setCurrentIdx((i) =>
                                                    Math.min(instances.length - 1, i + 1)
                                                )
                                            }
                                            disabled={currentIdx === instances.length - 1}
                                        >
                                            {">"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {canEditUserCollection && (
                            <div className="mt-4">
                                <b>Twoja ocena karty:</b>
                                <div>[★★★★★]</div>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="flex flex-col justify-start overflow-y-auto min-h-0 pr-4"
                    style={{ width: "50%" }}
                >
                    {isOfflineCard && (
                        <div className="mt-12 mb-4 p-4 rounded bg-amber-50 border border-amber-200 shadow">
                            <div className="font-bold text-lg">Tryb offline</div>
                            <div className="mt-2 text-sm">
                                Ta karta została wczytana z lokalnego snapshotu offline.
                                Możesz ją przeglądać, ale dodawanie kopii, przenoszenie między deckami
                                i zapisy DEV wymagają uruchomionego backendu.
                            </div>
                        </div>
                    )}
                    {isSharedDeckView && (
                        <div
                            className={`${isOfflineCard ? "mt-2" : "mt-12"} mb-4 p-4 rounded bg-blue-50 border border-blue-200 shadow`}>
                            <div className="font-bold text-lg">Tryb widmowy / read-only</div>
                            <div className="mt-2 text-sm">
                                To jest współdzielona talia użytkownika{" "}
                                <b>{ownerUsername || "innego gracza"}</b>.
                                <br/>
                                Deck: <b>{deckName || "-"}</b>
                                <br/>
                                Nie możesz tutaj dodawać, usuwać ani przenosić kart między taliami.
                            </div>
                        </div>
                    )}

                    <div className="text-5xl font-extrabold mb-4">{card.name}</div>
                    <div className="mb-1">
                        Typ: {card.type} HP: {card.hp}
                    </div>
                    <div className="mb-1 flex items-center gap-2">
                        Seria: {card.set?.series}
                        {card.set?.logoUrl && (
                            <img src={card.set.logoUrl} alt="logo" className="h-8 inline ml-2" />
                        )}
                    </div>
                    <div className="mb-1">Set: {card.set?.name}</div>
                    <div className="mb-1">Pokedex numer: {card.pokedexNumber}</div>

                    <div className="mb-1">
                        Cena CardMarket:&nbsp;
                        <a
                            href={card.cardmarketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                        >
                            {card.cardmarketLowPrice ? (
                                <>
                                    <span className="text-xl font-bold">
                                        {card.cardmarketLowPrice}€
                                    </span>
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

                    {canUseDevTools && (
                        <button
                            className="ml-2 px-3 py-1 rounded bg-indigo-600 text-white"
                            onClick={async () => {
                                await recalcCardRating(cardId);
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
                    ) : card.supertype !== "Pokémon" &&
                    Array.isArray(card.rules) &&
                    card.rules.length > 0 ? (
                        <div className="mb-2">
                            <b>Zasady karty:</b>
                            <ul className="list-disc ml-6">
                                {card.rules.map((rule, idx) => (
                                    <li
                                        key={rule.id || idx}
                                        className={
                                            idx === 0
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

                    {card.abilities?.length > 0 && (
                        <div className="mt-4">
                            <b>Specjalne Umiejętności:</b>
                            {card.abilities.map((ability, idx) => (
                                <div key={ability.id || idx} className="mb-3">
                                    <span className="font-bold">
                                        {ability.namePl || ability.name}
                                    </span>
                                    <div>{ability.descriptionPl || ability.description}</div>

                                    {canUseDevTools && (
                                        <span style={{ marginLeft: "2em" }}>
                                            Ocena Administratora:&nbsp;
                                            <input
                                                className="border rounded px-2 py-1 w-16"
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={editRatings.abilities[idx] || ""}
                                                onChange={(e) => {
                                                    const newArr = [...editRatings.abilities];
                                                    newArr[idx] = e.target.value;
                                                    setEditRatings((r) => ({
                                                        ...r,
                                                        abilities: newArr,
                                                    }));
                                                }}
                                            />
                                            <button
                                                className="ml-2 px-2 py-1 bg-blue-400 text-white rounded"
                                                onClick={() =>
                                                    saveAbilityRating(idx, ability.defId)
                                                }
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

                                    {canUseDevTools && (
                                        <span style={{ marginLeft: "2em" }}>
                                            Ocena Administratora:&nbsp;
                                            <input
                                                className="border rounded px-2 py-1 w-16"
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={editRatings.attacks[idx] || ""}
                                                onChange={(e) => {
                                                    const newArr = [...editRatings.attacks];
                                                    newArr[idx] = e.target.value;
                                                    setEditRatings((r) => ({
                                                        ...r,
                                                        attacks: newArr,
                                                    }));
                                                }}
                                            />
                                            <button
                                                className="ml-2 px-2 py-1 bg-blue-400 text-white rounded"
                                                onClick={() => saveAttackRating(idx, at.defId)}
                                            >
                                                Zapisz
                                            </button>
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

                                    {canUseDevTools && (
                                        <span style={{ marginLeft: "2em" }}>
                                            Ocena Administratora:&nbsp;
                                            <input
                                                className="border rounded px-2 py-1 w-16"
                                                type="number"
                                                value={editRatings.rules?.[idx] || ""}
                                                onChange={(e) => {
                                                    const newArr = [...(editRatings.rules || [])];
                                                    newArr[idx] = e.target.value;
                                                    setEditRatings((r) => ({
                                                        ...r,
                                                        rules: newArr,
                                                    }));
                                                }}
                                            />
                                            <button
                                                className="ml-2 px-2 py-1 bg-blue-400 text-white rounded"
                                                onClick={() => saveRuleRating(idx, rule.id)}
                                            >
                                                Zapisz
                                            </button>
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {canEditUserCollection && (
                        <div className="mt-6">
                            {instances.length >= 10 ? (
                                <BulkDeckAssign
                                    instances={instances}
                                    onAssignMany={handleAssignMany}
                                    onMoveMany={handleMoveMany}
                                    onRemoveMany={handleRemoveMany}
                                    fetchDecks={fetchDecks}
                                />
                            ) : (
                                <div className="p-4 rounded bg-gray-100 shadow">
                                    <div>
                                        <b>Karty w kolekcji: {instances.length}</b>
                                    </div>
                                    <div className="mt-2">
                                        <b>Decki:</b>
                                        <ol className="ml-6 list-decimal">
                                            {instances.map((inst) => {
                                                const assigned =
                                                    inst.deckId != null || inst.status === "in_deck";

                                                return (
                                                    <li key={inst.id} className="flex items-center gap-2">
                                                        {assigned ? (
                                                            <>
                                                                Deck: <b>{inst.deckName}</b>
                                                                <button
                                                                    className="ml-2 px-2 py-1 bg-gray-200 rounded"
                                                                    onClick={() =>
                                                                        handleMoveToOtherDeck(inst.id)
                                                                    }
                                                                >
                                                                    Przenieś
                                                                </button>
                                                                <button
                                                                    className="ml-2 px-2 py-1 bg-red-200 rounded"
                                                                    onClick={() =>
                                                                        handleRemoveFromDeck(inst.id)
                                                                    }
                                                                >
                                                                    Usuń z talii
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="italic">
                                                                    Nieprzypisana
                                                                </span>
                                                                <button
                                                                    className="ml-2 px-2 py-1 bg-blue-200 rounded"
                                                                    onClick={() =>
                                                                        setDeckModalInstId(inst.id)
                                                                    }
                                                                >
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

                    {canUseDevTools && (
                        <div className="mt-6 p-4 rounded bg-orange-100 shadow">
                            <label className="block mb-2 font-bold">
                                Ocena ogólna karty (admin):
                            </label>
                            <input
                                className="border rounded px-2 py-1 w-24"
                                type="number"
                                value={editRatings.overall}
                                onChange={(e) =>
                                    setEditRatings((r) => ({ ...r, overall: e.target.value }))
                                }
                            />
                            <button
                                className="ml-2 px-4 py-1 bg-blue-600 text-white rounded"
                                onClick={saveOverallRating}
                            >
                                Zapisz
                            </button>
                        </div>
                    )}
                </div>

                <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: "5%" }}
                >
                    <button
                        className="text-4xl p-3 hover:bg-gray-200 rounded-full disabled:opacity-30"
                        onClick={goToNext}
                        disabled={nextDisabled}
                    >
                        →
                    </button>
                </div>
            </div>

            {deckModalInstId && (
                <DeckSelectModal
                    onSelect={handleAssignToDeck}
                    onCancel={() => setDeckModalInstId(null)}
                />
            )}
        </div>
    );
}