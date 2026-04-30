import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getDeckById } from "../services/deckService.js";
import CardImage from "../components/CardImage.jsx";

function SpeakerButton({ onClick, title = "Odczytaj tekst" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="w-11 h-11 rounded-xl bg-white/90 hover:bg-white border border-white/70 shadow-md flex items-center justify-center text-xl transition"
        >
            🔊
        </button>
    );
}

function normalizeText(value) {
    return String(value ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function hasMeaningfulText(value) {
    const text = normalizeText(value).toLowerCase();
    return !!text && !["brak", "brak.", "brak opisu", "brak opisu.", "brak umiejętności", "brak umiejętności."].includes(text);
}

function sanitizeForSpeech(text) {
    return normalizeText(text);
}

function speakText(text) {
    const safeText = sanitizeForSpeech(text);
    if (!safeText || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(safeText);
    utterance.lang = "pl-PL";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const applyVoice = () => {
        const voices = window.speechSynthesis.getVoices?.() || [];
        const polishVoice =
            voices.find((v) => v.lang === "pl-PL") ||
            voices.find((v) => v.lang?.toLowerCase().startsWith("pl"));

        if (polishVoice) {
            utterance.voice = polishVoice;
        }

        window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices?.() || [];
    if (voices.length > 0) {
        applyVoice();
    } else {
        window.speechSynthesis.onvoiceschanged = () => {
            applyVoice();
            window.speechSynthesis.onvoiceschanged = null;
        };
    }
}

function getCardDisplayName(card) {
    return card?.namePl || card?.name || "Nieznana karta";
}

function getCardKind(card) {
    const supertype = normalizeText(card?.supertype).toLowerCase();
    const subtypes = Array.isArray(card?.subtypes)
        ? card.subtypes.join(" ")
        : normalizeText(card?.subtypes);
    const subtypesLower = subtypes.toLowerCase();

    const isPokemon = supertype.includes("pok");
    const isTrainer = supertype.includes("trainer") || supertype.includes("trener");
    const isEnergy = supertype.includes("energy") || supertype.includes("energ");
    const isSpecialEnergy =
        isEnergy && (subtypesLower.includes("special") || subtypesLower.includes("specjal"));

    return {
        isPokemon,
        isTrainer,
        isEnergy,
        isSpecialEnergy,
    };
}

function extractRuleTexts(card) {
    const collected = [];

    const pushValue = (value) => {
        if (!value) return;

        if (typeof value === "string") {
            if (hasMeaningfulText(value)) {
                collected.push(normalizeText(value));
            }
            return;
        }

        if (Array.isArray(value)) {
            value.forEach(pushValue);
            return;
        }

        if (typeof value === "object") {
            const text =
                value.descriptionPl ||
                value.description ||
                value.textPl ||
                value.text ||
                value.ruleTextPl ||
                value.ruleText ||
                value.effectPl ||
                value.effect ||
                "";

            if (hasMeaningfulText(text)) {
                collected.push(normalizeText(text));
            }
        }
    };

    pushValue(card?.rules);
    pushValue(card?.tcgRules);
    pushValue(card?.ruleTexts);
    pushValue(card?.ruleTextPl);
    pushValue(card?.ruleText);

    const unique = [];
    const seen = new Set();

    collected.forEach((text) => {
        const key = text.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(text);
        }
    });

    return unique;
}

function getAbilityText(ability) {
    if (!ability) return "Brak umiejętności.";

    return [
        ability.namePl || ability.name || "Umiejętność",
        ability.descriptionPl || ability.description || "",
    ]
        .filter(Boolean)
        .join(". ");
}

function getAttackText(attack, label) {
    if (!attack) return `${label}.`;

    return [
        label,
        attack.namePl || attack.name || "Atak",
        attack.damage ? `Obrażenia: ${attack.damage}.` : "",
        attack.descriptionPl || attack.description || "",
    ]
        .filter(Boolean)
        .join(" ");
}

function wrapIndex(index, total) {
    if (total <= 0) return 0;
    return ((index % total) + total) % total;
}

function getVisibleOffsetsAround(total, centerOffset = 0, maxVisible = 11) {
    if (total <= 0) return [];

    const visibleCount = Math.min(total, maxVisible);
    const half = Math.floor(visibleCount / 2);
    const start = centerOffset - half;

    return Array.from({ length: visibleCount }, (_, i) => start + i);
}

function InfoBlock({ title, children, speakerText }) {
    return (
        <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-4 items-start">
            <SpeakerButton onClick={() => speakText(speakerText)} />

            <div className="relative overflow-hidden rounded-2xl border border-white/60 shadow-[0_10px_26px_rgba(0,0,0,0.14)] min-h-[112px]">
                {/* warstwa glass */}
                <div className="absolute inset-0 bg-slate-200/18 backdrop-blur-md" />

                {/* delikatna mleczna / szarawa poświata */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/38 via-slate-100/20 to-slate-400/10" />

                {/* lekka wewnętrzna poświata / ramka */}
                <div className="absolute inset-[1px] rounded-2xl border border-white/20" />

                {/* treść */}
                <div className="relative z-10 px-4 py-3">
                    <div className="text-xl font-extrabold text-slate-950 mb-2 drop-shadow-[0_1px_0_rgba(255,255,255,0.18)]">
                        {title}
                    </div>

                    <div className="text-[15px] leading-relaxed text-slate-900 font-medium">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

function renderParagraphList(texts) {
    if (!texts || texts.length === 0) return null;

    if (texts.length === 1) {
        return <div>{texts[0]}</div>;
    }

    return (
        <div className="space-y-2">
            {texts.map((text, idx) => (
                <div key={idx}>{text}</div>
            ))}
        </div>
    );
}

function getMetaItems(card) {
    const items = [];

    const addItem = (label, value) => {
        if (value == null) return;

        const formatted = Array.isArray(value)
            ? value.filter(Boolean).join(", ")
            : normalizeText(value);

        if (!formatted || formatted === "-") return;

        items.push({ label, value: formatted });
    };

    addItem("Supertype", card?.supertype);
    addItem("Podtyp", Array.isArray(card?.subtypes) ? card.subtypes : card?.subtypes);
    addItem("Nr w Pokédex", card?.pokedexNumber);
    addItem("HP", card?.hp);
    addItem("Stage", card?.stage);
    addItem("Typ", Array.isArray(card?.types) ? card.types : card?.type);

    return items;
}
const CAROUSEL_CARD_WIDTH = 140;
const CAROUSEL_CARD_HEIGHT = 196;
const CAROUSEL_STEP_PX = 146;       // odstęp między środkami kart
const DRAG_SNAP_RATIO = 0.22;       // ile trzeba przesunąć, żeby przeskoczyć na następną kartę

const MAIN_SECTION_HEIGHT = "clamp(750px, 64vh, 850px)";
const LEFT_META_BOX_HEIGHT = "170px";
const CAROUSEL_PANEL_HEIGHT = "330px";

function getCarouselScale(distanceFromCenter) {
    return Math.max(0.8, 1 - distanceFromCenter * 0.05);
}

function getCarouselTranslateY(distanceFromCenter) {
    if (distanceFromCenter < 0.15) return -12; // środkowa lekko wyżej
    return Math.min(28, distanceFromCenter * 8);
}

function getCarouselOpacity(distanceFromCenter) {
    return Math.max(0.42, 1 - distanceFromCenter * 0.14);
}

export default function PokeGameDeckViewer() {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [currentIdx, setCurrentIdx] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [dragOffsetPx, setDragOffsetPx] = useState(0);

    const dragStartXRef = useRef(0);
    const suppressClickRef = useRef(false);

    const handleBack = () => {
        const from = location.state?.from;

        if (from === "deck") {
            navigate("/deck", {
                state: {
                    selectedDeckId: location.state?.selectedDeckId || deckId,
                },
            });
            return;
        }

        if (from === "poke-game-single") {
            navigate("/poke-game", {
                state: {
                    reopenSinglePlayer: true,
                    selectedDeckId: location.state?.selectedDeckId || deckId,
                },
            });
            return;
        }

        navigate("/poke-game");
    };

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setLoadError("");

        getDeckById(deckId)
            .then((loadedDeck) => {
                if (cancelled) return;
                setDeck(loadedDeck);
                setCurrentIdx(0);
            })
            .catch((e) => {
                if (cancelled) return;

                setDeck(null);
                setLoadError(
                    e?.response?.data?.message ||
                    e?.response?.data ||
                    e?.message ||
                    "Nie udało się wczytać talii."
                );
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [deckId]);

    const uniqueDeckCards = useMemo(() => deck?.cards || [], [deck]);

    const totalCardsInDeck = useMemo(() => {
        return uniqueDeckCards.reduce((sum, entry) => sum + (Number(entry?.quantity) || 1), 0);
    }, [uniqueDeckCards]);

    const activeDeckEntry =
        uniqueDeckCards.length > 0 ? uniqueDeckCards[wrapIndex(currentIdx, uniqueDeckCards.length)] : null;

    const activeCard = activeDeckEntry?.card || null;
    const isOfflineDeck = !!deck?.offlineSnapshot;
    const isReadOnlyDeck = !!deck?.readOnly || isOfflineDeck;

    const cardKind = useMemo(() => getCardKind(activeCard), [activeCard]);

    const normalAttacks = useMemo(
        () => (activeCard?.attacks || []).filter((a) => !a?.special),
        [activeCard]
    );

    const specialAttack = useMemo(
        () => (activeCard?.attacks || []).find((a) => a?.special) || null,
        [activeCard]
    );

    const abilities = activeCard?.abilities || [];

    const flavorDescription = useMemo(() => {
        const text = activeCard?.flavorTextPl || activeCard?.flavorText || "";
        return hasMeaningfulText(text) ? normalizeText(text) : "";
    }, [activeCard]);

    const ruleTexts = useMemo(() => extractRuleTexts(activeCard), [activeCard]);

    const metaItems = useMemo(() => getMetaItems(activeCard), [activeCard]);

    const infoSections = useMemo(() => {
        const sections = [];

        if (cardKind.isTrainer || cardKind.isSpecialEnergy || (!cardKind.isPokemon && ruleTexts.length > 0)) {
            if (ruleTexts.length > 0) {
                sections.push({
                    key: "rules-as-description",
                    title: "Opis",
                    speakerText: `${getCardDisplayName(activeCard)}. ${ruleTexts.join(" ")}`,
                    content: renderParagraphList(ruleTexts),
                });
            } else if (flavorDescription) {
                sections.push({
                    key: "description",
                    title: "Opis",
                    speakerText: `${getCardDisplayName(activeCard)}. ${flavorDescription}`,
                    content: <div>{flavorDescription}</div>,
                });
            }
        } else {
            if (flavorDescription) {
                sections.push({
                    key: "description",
                    title: "Opis",
                    speakerText: `${getCardDisplayName(activeCard)}. ${flavorDescription}`,
                    content: <div>{flavorDescription}</div>,
                });
            }

            if (ruleTexts.length > 0) {
                sections.push({
                    key: "rules",
                    title: "Zasada karty",
                    speakerText: ruleTexts.join(" "),
                    content: renderParagraphList(ruleTexts),
                });
            }
        }

        if (abilities.length > 0) {
            sections.push({
                key: "abilities",
                title: abilities.length === 1 ? "Umiejętność" : "Umiejętności",
                speakerText: abilities.map(getAbilityText).join(" "),
                content: (
                    <div className="space-y-3">
                        {abilities.map((ability, idx) => (
                            <div key={ability.id || idx}>
                                <div className="font-bold text-slate-900">
                                    {ability.namePl || ability.name || "Umiejętność"}
                                </div>
                                {(ability.descriptionPl || ability.description) && (
                                    <div className="text-sm text-slate-800 mt-1">
                                        {ability.descriptionPl || ability.description}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ),
            });
        }

        normalAttacks.forEach((attack, idx) => {
            sections.push({
                key: `attack-${idx}`,
                title: `Atak ${idx + 1}`,
                speakerText: getAttackText(attack, `Atak ${idx + 1}`),
                content: (
                    <div>
                        <div className="font-bold text-slate-900">
                            {attack.namePl || attack.name || `Atak ${idx + 1}`}
                        </div>

                        {(attack.descriptionPl || attack.description) && (
                            <div className="text-sm text-slate-800 mt-1">
                                {attack.descriptionPl || attack.description}
                            </div>
                        )}

                        {attack.damage && (
                            <div className="mt-1 font-semibold text-slate-900">
                                Obrażenia: {attack.damage}
                            </div>
                        )}
                    </div>
                ),
            });
        });

        if (specialAttack) {
            sections.push({
                key: "special-attack",
                title: "Atak specjalny",
                speakerText: getAttackText(specialAttack, "Atak specjalny"),
                content: (
                    <div>
                        <div className="font-bold text-slate-900">
                            {specialAttack.namePl || specialAttack.name || "Atak specjalny"}
                        </div>

                        {(specialAttack.descriptionPl || specialAttack.description) && (
                            <div className="text-sm text-slate-800 mt-1">
                                {specialAttack.descriptionPl || specialAttack.description}
                            </div>
                        )}

                        {specialAttack.damage && (
                            <div className="mt-1 font-semibold text-slate-900">
                                Obrażenia: {specialAttack.damage}
                            </div>
                        )}
                    </div>
                ),
            });
        }

        if (sections.length === 0) {
            sections.push({
                key: "no-data",
                title: "Informacje",
                speakerText: `Brak dodatkowych informacji o karcie ${getCardDisplayName(activeCard)}.`,
                content: <div>Brak dodatkowych informacji o tej karcie.</div>,
            });
        }

        return sections;
    }, [
        activeCard,
        abilities,
        cardKind.isPokemon,
        cardKind.isSpecialEnergy,
        cardKind.isTrainer,
        flavorDescription,
        normalAttacks,
        ruleTexts,
        specialAttack,
    ]);

    const dragProgress = dragOffsetPx / CAROUSEL_STEP_PX;

    const dragCenterOffset = dragging
        ? Math.round(-dragProgress)
        : 0;

    const visibleOffsets = useMemo(
        () => getVisibleOffsetsAround(uniqueDeckCards.length, dragCenterOffset, 11),
        [uniqueDeckCards.length, dragCenterOffset]
    );

    const prevCard = () => {
        if (uniqueDeckCards.length === 0) return;
        setCurrentIdx((prev) => wrapIndex(prev - 1, uniqueDeckCards.length));
    };

    const nextCard = () => {
        if (uniqueDeckCards.length === 0) return;
        setCurrentIdx((prev) => wrapIndex(prev + 1, uniqueDeckCards.length));
    };

    const onCarouselPointerDown = (e) => {
        if (uniqueDeckCards.length <= 1) return;

        suppressClickRef.current = false;
        setDragging(true);
        setDragOffsetPx(0);
        dragStartXRef.current = e.clientX;

        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const onCarouselPointerMove = (e) => {
        if (!dragging) return;

        const delta = e.clientX - dragStartXRef.current;
        setDragOffsetPx(delta);

        if (Math.abs(delta) > 6) {
            suppressClickRef.current = true;
        }
    };

    const finishCarouselDrag = () => {
        if (!dragging) return;

        const rawSteps = -dragOffsetPx / CAROUSEL_STEP_PX;

        let movedSteps = Math.trunc(rawSteps);
        const remainder = Math.abs(rawSteps - movedSteps);

        if (remainder >= DRAG_SNAP_RATIO) {
            movedSteps += rawSteps > 0 ? 1 : -1;
        }

        if (movedSteps !== 0) {
            setCurrentIdx((prev) => wrapIndex(prev + movedSteps, uniqueDeckCards.length));
        }

        setDragging(false);
        setDragOffsetPx(0);

        window.setTimeout(() => {
            suppressClickRef.current = false;
        }, 0);
    };

    const onCarouselPointerUp = (e) => {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        finishCarouselDrag();
    };

    const onCarouselPointerCancel = (e) => {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        finishCarouselDrag();
    };

    const bgStyle = {
        backgroundImage: "url('/tlo.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
    };

    if (loading) {
        return (
            <div className="min-h-[90vh] w-full flex items-center justify-center p-6" style={bgStyle}>
                <div className="rounded-3xl bg-white/78 backdrop-blur-xl border border-white/80 px-8 py-6 text-xl font-bold text-slate-900 shadow-2xl">
                    Ładowanie talii…
                </div>
            </div>
        );
    }

    if (!deck) {
        return (
            <div className="min-h-[90vh] w-full flex items-center justify-center p-6" style={bgStyle}>
                <div className="rounded-3xl bg-white/78 backdrop-blur-xl border border-white/80 px-8 py-6 shadow-2xl">
                    <div className="text-2xl font-extrabold text-slate-900 mb-4">
                        Nie udało się wczytać talii
                    </div>

                    {loadError && (
                        <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
                            {loadError}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleBack}
                        className="px-5 py-3 rounded-2xl bg-white/95 hover:bg-white border border-white/80 font-bold"
                    >
                        ← Wróć do PokeGame
                    </button>
                </div>
            </div>
        );
    }

    if (uniqueDeckCards.length === 0) {
        return (
            <div className="min-h-[90vh] w-full p-5 md:p-8" style={bgStyle}>
                <div className="w-full max-w-[1560px] mx-auto rounded-[34px] bg-white/42 backdrop-blur-xl border border-white/70 shadow-[0_20px_60px_rgba(0,0,0,0.28)] px-4 py-4 md:px-8 md:py-6">
                    <div className="flex items-center gap-4 md:gap-8">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="shrink-0 px-6 py-3 rounded-2xl bg-white/95 hover:bg-white border border-white/80 font-bold text-slate-900 shadow transition"
                        >
                            ← Wróć
                        </button>

                        <div className="flex-1 rounded-full bg-white/85 backdrop-blur-md border border-white/80 px-6 py-3 text-center shadow">
                            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{deck.name}</div>
                        </div>
                    </div>

                    <div className="mt-8 rounded-3xl bg-white/82 backdrop-blur-xl border border-white/80 p-8 text-center shadow-xl">
                        <div className="text-2xl font-extrabold text-slate-900">Ta talia nie zawiera kart.</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[90vh] w-full p-5 md:p-8" style={bgStyle}>
            <div className="w-full max-w-[1560px] mx-auto rounded-[34px] bg-white/42 backdrop-blur-xl border border-white/70 shadow-[0_20px_60px_rgba(0,0,0,0.28)] px-4 py-4 md:px-8 md:py-6">
                {/* Top bar */}
                <div className="flex items-center gap-4 md:gap-8">
                    {isOfflineDeck && (
                        <div className="mt-4 rounded-2xl bg-amber-50/92 border border-amber-200 px-5 py-3 shadow text-amber-900">
                            <div className="font-extrabold">Tryb offline</div>
                            <div className="text-sm mt-1">
                                Ta talia została wczytana z lokalnego snapshotu offline. Możesz ją przeglądać,
                                obracać karuzelę i czytać dane kart, ale zmiany decka wymagają uruchomionego backendu.
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleBack}
                        className="shrink-0 px-6 py-3 rounded-2xl bg-white/95 hover:bg-white border border-white/80 font-bold text-slate-900 shadow transition"
                    >
                        ← Wróć
                    </button>

                    <div className="flex-1 rounded-full bg-white/85 backdrop-blur-md border border-white/80 px-6 py-3 text-center shadow">
                        <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
                            {deck.name}
                        </div>
                    </div>

                    <div className="hidden xl:flex min-w-[220px] justify-end">
                        <div className="rounded-2xl bg-white/78 backdrop-blur-md border border-white/80 px-4 py-3 text-right shadow">
                            <div className="text-xs uppercase tracking-wide text-slate-700">Karty / unikalne</div>
                            <div className="text-2xl font-extrabold text-slate-900">
                                {totalCardsInDeck} / {uniqueDeckCards.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div
                    className="mt-6 grid grid-cols-1 xl:grid-cols-[430px_minmax(0,1fr)] gap-8 items-stretch overflow-hidden"
                    style={{height: MAIN_SECTION_HEIGHT}}
                >
                    {/* Left - duża karta */}
                    <div
                        className="rounded-[30px] bg-white/64 backdrop-blur-xl border border-white/75 shadow-xl p-5 md:p-6 h-full min-h-0 overflow-hidden flex flex-col">
                        <div className="w-full flex items-center justify-between mb-4 shrink-0">
                            <div className="text-sm font-semibold text-slate-800">
                                Karta {wrapIndex(currentIdx, uniqueDeckCards.length) + 1} z {uniqueDeckCards.length}
                            </div>

                            <div className="text-sm font-bold text-indigo-900">
                                W talii: x{Math.max(1, Number(activeDeckEntry?.quantity) || 1)}
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 flex items-center justify-center">
                            <div
                                className="w-full max-w-[320px] rounded-[24px] bg-white/92 border border-white/85 p-3 shadow-xl">
                                <CardImage
                                    card={activeCard}
                                    size="large"
                                    alt={getCardDisplayName(activeCard)}
                                    className="w-full h-auto object-contain rounded-[18px]"
                                    draggable={false}
                                />
                            </div>
                        </div>

                        <div
                            className="mt-5 w-full rounded-2xl bg-white/78 backdrop-blur-md border border-white/80 px-4 py-3 shadow shrink-0"
                            style={{minHeight: LEFT_META_BOX_HEIGHT}}
                        >
                            <div className="text-lg font-extrabold text-slate-900 text-center">
                                {getCardDisplayName(activeCard)}
                            </div>

                            {metaItems.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-900">
                                    {metaItems.map((item) => (
                                        <div key={item.label}>
                                            <span className="font-bold">{item.label}:</span> {item.value}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right - info */}
                    <div
                        className="relative overflow-hidden rounded-[30px] bg-slate-100/20 backdrop-blur-md border border-white/70 shadow-xl p-5 md:p-6 h-full min-h-0 flex flex-col"
                    >
                        <div
                            className="relative overflow-hidden rounded-[30px] bg-slate-100/20 backdrop-blur-md border border-white/70 shadow-xl p-5 md:p-6 h-full min-h-0 flex flex-col"
                        >
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-white/14 via-slate-200/10 to-slate-500/10 pointer-events-none"/>

                            <div className="relative z-10 text-3xl font-extrabold text-slate-900 mb-5 shrink-0">
                                {getCardDisplayName(activeCard)}
                            </div>

                            <div
                                className="relative z-10 grid grid-cols-1 gap-5 flex-1 min-h-0 overflow-y-auto pr-2"
                                style={{scrollbarGutter: "stable"}}
                            >
                                {infoSections.map((section) => (
                                    <InfoBlock
                                        key={section.key}
                                        title={section.title}
                                        speakerText={section.speakerText}
                                    >
                                        {section.content}
                                    </InfoBlock>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 flex-1 min-h-0 overflow-y-auto pr-2">
                            {infoSections.map((section) => (
                                <InfoBlock
                                    key={section.key}
                                    title={section.title}
                                    speakerText={section.speakerText}
                                >
                                    {section.content}
                                </InfoBlock>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom carousel */}
                <div
                    className="mt-8 rounded-[30px] bg-white/58 backdrop-blur-xl border border-white/75 px-4 py-6 shadow-xl flex-shrink-0"
                    style={{minHeight: CAROUSEL_PANEL_HEIGHT}}
                >
                    <div className="flex items-center justify-between gap-4 h-full">
                        <button
                            type="button"
                            onClick={prevCard}
                            className="w-16 h-16 rounded-2xl bg-white/92 hover:bg-white border border-white/85 shadow text-4xl font-bold text-slate-900 transition"
                        >
                            ‹
                        </button>

                        <div className="flex-1 overflow-hidden">
                            <div
                                className="relative h-[240px] cursor-grab active:cursor-grabbing"
                                style={{ touchAction: "none" }}
                                onPointerDown={onCarouselPointerDown}
                                onPointerMove={onCarouselPointerMove}
                                onPointerUp={onCarouselPointerUp}
                                onPointerCancel={onCarouselPointerCancel}
                            >
                                {visibleOffsets.map((offset) => {
                                    const index = wrapIndex(currentIdx + offset, uniqueDeckCards.length);
                                    const item = uniqueDeckCards[index];
                                    const card = item?.card;
                                    const quantity = Math.max(1, Number(item?.quantity) || 1);

                                    const visualOffset = offset + dragProgress;
                                    const distanceFromCenter = Math.abs(visualOffset);

                                    const scale = getCarouselScale(distanceFromCenter);
                                    const translateX = visualOffset * CAROUSEL_STEP_PX;
                                    const translateY = getCarouselTranslateY(distanceFromCenter);
                                    const opacity = getCarouselOpacity(distanceFromCenter);
                                    const zIndex = 1000 - Math.round(distanceFromCenter * 100);
                                    const isNearCenter = distanceFromCenter < 0.35;

                                    return (
                                        <button
                                            key={`${item?.card?.id || index}-${offset}`}
                                            type="button"
                                            onClick={() => {
                                                if (suppressClickRef.current) return;
                                                setCurrentIdx(index);
                                            }}
                                            className="absolute bottom-0"
                                            style={{
                                                left: "50%",
                                                width: `${CAROUSEL_CARD_WIDTH}px`,
                                                height: `${CAROUSEL_CARD_HEIGHT}px`,
                                                marginLeft: `-${CAROUSEL_CARD_WIDTH / 2}px`,
                                                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                                                opacity,
                                                zIndex,
                                                transition: dragging
                                                    ? "none"
                                                    : "transform 220ms ease, opacity 220ms ease, box-shadow 220ms ease",
                                            }}
                                            title={getCardDisplayName(card)}
                                        >
                                            <div
                                                className={`relative rounded-[18px] overflow-hidden border shadow-xl ${
                                                    isNearCenter
                                                        ? "bg-white border-white/90"
                                                        : "bg-white/90 border-white/70"
                                                }`}
                                            >
                                                <CardImage
                                                    card={card}
                                                    size="small"
                                                    alt={getCardDisplayName(card)}
                                                    className="w-[140px] h-[196px] object-contain"
                                                    draggable={false}
                                                />

                                                {quantity > 1 && (
                                                    <div className="absolute right-2 bottom-2 px-2 py-1 rounded-full bg-slate-900/88 text-white text-xs font-bold shadow-md">
                                                        x {quantity}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-3 text-center text-sm text-slate-900 font-semibold">
                                Możesz kliknąć kartę, użyć strzałek albo złapać karuzelę myszką / palcem i płynnie ją obrócić.
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={nextCard}
                            className="w-16 h-16 rounded-2xl bg-white/92 hover:bg-white border border-white/85 shadow text-4xl font-bold text-slate-900 transition"
                        >
                            ›
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
