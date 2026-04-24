import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import EvolutionDiagram from "../components/EvolutionDiagram";

const TYPE_TRANSLATIONS = {
    Grass: { label: "Trawiasty", spoken: "Trawiastego" },
    Fire: { label: "Ognisty", spoken: "Ognistego" },
    Water: { label: "Wodny", spoken: "Wodnego" },
    Lightning: { label: "Elektryczny", spoken: "Elektrycznego" },
    Psychic: { label: "Psychiczny", spoken: "Psychicznego" },
    Darkness: { label: "Mroczny", spoken: "Mrocznego" },
    Metal: { label: "Stalowy", spoken: "Stalowego" },
    Fighting: { label: "Bijący", spoken: "Bijącego" },
    Dragon: { label: "Smoczy", spoken: "Smoczego" },
    Colorless: { label: "Normalny", spoken: "Normalnego" },
    Fairy: { label: "Baśniowy", spoken: "Baśniowego" },
    Normal: { label: "Normalny", spoken: "Normalnego" },
};

function getTypeTranslation(type) {
    if (!type) {
        return { label: "Nieznany", spoken: "nieznanego" };
    }
    return TYPE_TRANSLATIONS[type] ?? { label: type, spoken: type.toLowerCase() };
}

function sortNormalEvolutionGroups(evolution) {
    if (!evolution?.groups?.length) return [];

    return [...evolution.groups]
        .filter((group) => group?.formCode === "NORMAL")
        .sort((a, b) => {
            if ((a.evolutionTier ?? 0) !== (b.evolutionTier ?? 0)) {
                return (a.evolutionTier ?? 0) - (b.evolutionTier ?? 0);
            }
            return (a.branchOrder ?? 0) - (b.branchOrder ?? 0);
        });
}

function normalizeSpeechText(text = "") {
    return String(text)
        .replace(/\s+/g, " ")
        .replace(/\.\./g, ".")
        .trim();
}

function buildEvolutionSpeech(evolution, selectedPokedexNumber) {
    const groups = sortNormalEvolutionGroups(evolution);
    if (!groups.length) return "";

    const idx = groups.findIndex((g) => g.pokedexNumber === selectedPokedexNumber);
    if (idx === -1) return "";

    const prev = idx > 0 ? groups[idx - 1] : null;
    const next = idx < groups.length - 1 ? groups[idx + 1] : null;
    const current = groups[idx];

    if (!current) return "";

    if (current.normalStage === "BASIC") {
        if (next) {
            return `Ewoluuje w ${next.pokemonName}.`;
        }
        return "Nie posiada dalszej ewolucji.";
    }

    if (current.normalStage === "STAGE1" || current.normalStage === "STAGE2") {
        if (prev) {
            return `Ewoluuje z ${prev.pokemonName}.`;
        }
    }

    return "";
}

export default function PokedexUserView({ goBack }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [pokemonList, setPokemonList] = useState([]);
    const [userNumbers, setUserNumbers] = useState([]);
    const [showOwnedOnly, setShowOwnedOnly] = useState(false);

    const [selected, setSelected] = useState(null);
    const [flavor, setFlavor] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [loadingFlavor, setLoadingFlavor] = useState(false);

    const [dexCards, setDexCards] = useState([]);
    const [loadingDexCards, setLoadingDexCards] = useState(false);

    const [evolution, setEvolution] = useState(null);
    const [loadingEvolution, setLoadingEvolution] = useState(false);

    const [speechEnabled, setSpeechEnabled] = useState(() => {
        const saved = localStorage.getItem("pokedexSpeechEnabled");
        return saved == null ? true : saved === "true";
    });

    const detailsRequestIdRef = useRef(0);

    const VISIBLE = 4;
    const THUMB_W = 102;
    const THUMB_H = 142;
    const GAP = 14;
    const VIEW_W = VISIBLE * THUMB_W + (VISIBLE - 1) * GAP;

    const [carouselIndex, setCarouselIndex] = useState(0);
    const canPrev = carouselIndex > 0;
    const canNext = carouselIndex + VISIBLE < dexCards.length;

    const slidePrev = () => setCarouselIndex((i) => Math.max(0, i - 1));
    const slideNext = () =>
        setCarouselIndex((i) => Math.min(Math.max(0, dexCards.length - VISIBLE), i + 1));

    useEffect(() => {
        api.get("/pokedex").then((res) => setPokemonList(res.data));
        if (user) {
            api.get("/user/pokedex").then((res) =>
                setUserNumbers(res.data.map((e) => e.pokedexNumber))
            );
        }
    }, [user]);

    useEffect(() => {
        return () => {
            stopSpeech();
        };
    }, []);

    const formatNumber = (num) => "# " + num.toString().padStart(4, "0");

    const visible = showOwnedOnly
        ? pokemonList.filter((p) => userNumbers.includes(p.pokedexNumber))
        : pokemonList;

    const totalCount = pokemonList.length;
    const pokedexSet = new Set(pokemonList.map((p) => p.pokedexNumber));
    const ownedCount = userNumbers.filter((n) => pokedexSet.has(n)).length;

    const selectedType = getTypeTranslation(selected?.type);

    const trackWidth = useMemo(() => {
        const n = dexCards.length;
        if (n === 0) return 0;
        return n * THUMB_W + (n - 1) * GAP;
    }, [dexCards.length]);

    function stopSpeech() {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    }

    function speakPokemonEntry(pokemon, flavorText, evolutionData) {
        if (!("speechSynthesis" in window)) return;

        stopSpeech();

        const typeInfo = getTypeTranslation(pokemon.type);
        const evolutionSentence = buildEvolutionSpeech(evolutionData, pokemon.pokedexNumber);

        const speechText = normalizeSpeechText(
            [
                `${pokemon.name}.`,
                `Pokémon typu ${typeInfo.spoken}.`,
                flavorText ? `${flavorText}.` : "",
                evolutionSentence,
            ]
                .filter(Boolean)
                .join(" ")
        );

        if (!speechText) return;

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = "pl-PL";
        utterance.rate = 0.96;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const polishVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("pl"));
        if (polishVoice) {
            utterance.voice = polishVoice;
        }

        window.speechSynthesis.speak(utterance);
    }

    async function openDetails(pokemon) {
        if (!userNumbers.includes(pokemon.pokedexNumber)) return;

        const requestId = ++detailsRequestIdRef.current;

        setSelected(pokemon);
        setFlavor("");
        setEvolution(null);
        setDexCards([]);
        setCarouselIndex(0);
        setOpenModal(true);

        setLoadingFlavor(true);
        setLoadingEvolution(true);
        setLoadingDexCards(true);

        try {
            const [flavorRes, evolutionRes, cardsRes] = await Promise.allSettled([
                api.get(`/pokedex/${pokemon.pokedexNumber}/random-flavor`),
                api.get(`/pokedex/${pokemon.pokedexNumber}/evolution-diagram`),
                api.get(`/user/pokedex/by-pokedex/${pokemon.pokedexNumber}`),
            ]);

            if (detailsRequestIdRef.current !== requestId) return;

            const flavorText =
                flavorRes.status === "fulfilled" ? flavorRes.value.data?.text || "" : "";

            const evolutionData =
                evolutionRes.status === "fulfilled" ? evolutionRes.value.data || null : null;

            const cardsData =
                cardsRes.status === "fulfilled" ? cardsRes.value.data || [] : [];

            setFlavor(flavorText);
            setEvolution(evolutionData);
            setDexCards(cardsData);
            setCarouselIndex(0);

            if (speechEnabled) {
                speakPokemonEntry(pokemon, flavorText, evolutionData);
            }
        } finally {
            if (detailsRequestIdRef.current === requestId) {
                setLoadingFlavor(false);
                setLoadingEvolution(false);
                setLoadingDexCards(false);
            }
        }
    }

    function closeModal() {
        stopSpeech();
        setOpenModal(false);
    }

    function toggleSpeech() {
        setSpeechEnabled((prev) => {
            const next = !prev;
            localStorage.setItem("pokedexSpeechEnabled", String(next));

            if (!next) {
                stopSpeech();
            } else if (selected && openModal && !loadingFlavor && !loadingEvolution) {
                speakPokemonEntry(selected, flavor, evolution);
            }

            return next;
        });
    }

    function handleEvolutionSelect(targetPokedexNumber) {
        const targetPokemon = pokemonList.find(
            (p) => p.pokedexNumber === targetPokedexNumber
        );

        if (!targetPokemon) return;
        if (!userNumbers.includes(targetPokemon.pokedexNumber)) return;

        openDetails(targetPokemon);
    }

    return (
        <div className="p-6">
            <div className="mb-6 grid grid-cols-[auto,1fr,auto] items-center gap-4">
                <button className="px-6 py-2 rounded bg-gray-200" onClick={goBack}>
                    ← Powrót
                </button>

                <div className="glass-panel p-10">
                    <div className="flex flex-col">
                        <div className="text-5xl font-extrabold leading-tight">Mój Pokedex</div>
                        <div className="mt-1 text-lg font-semibold text-gray-600">
                            Złapanych {ownedCount} z {totalCount} Pokémonów
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-10">
                    <div className="ml-auto flex items-center gap-2">
                        <span className={!showOwnedOnly ? "font-bold" : ""}>Pokaż wszystkie</span>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={showOwnedOnly}
                                onChange={(e) => setShowOwnedOnly(e.target.checked)}
                            />
                            <div
                                className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-purple-500
                                after:content-[''] after:absolute after:top-1 after:left-1 after:w-6 after:h-6
                                after:bg-white after:rounded-full after:transition-all
                                peer-checked:after:translate-x-6"
                            />
                        </label>

                        <span className={showOwnedOnly ? "font-bold" : ""}>Pokaż posiadane</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {visible.map((pokemon) => {
                    const owned = userNumbers.includes(pokemon.pokedexNumber);

                    return (
                        <div key={pokemon.pokedexNumber} className="glass-panel p-10">
                            <div
                                className={`border-4 rounded-lg p-2 flex flex-col items-center transition
                                ${
                                    owned
                                        ? "border-purple-700 hover:scale-[1.02] cursor-pointer"
                                        : "border-gray-300 opacity-40 grayscale cursor-not-allowed"
                                }`}
                                onClick={() => openDetails(pokemon)}
                            >
                                <img
                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokedexNumber}.png`}
                                    alt={pokemon.name}
                                    className="w-24 h-24 object-contain mb-1"
                                />
                                <span className="font-bold text-lg text-center">{pokemon.name}</span>
                                <span className="font-semibold">{formatNumber(pokemon.pokedexNumber)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {openModal && selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[1500px] h-[84vh] p-6 overflow-hidden">
                        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                            <button
                                type="button"
                                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                                onClick={toggleSpeech}
                                title={speechEnabled ? "Wycisz Pokedex" : "Włącz głos Pokedexu"}
                                aria-label={speechEnabled ? "Wycisz Pokedex" : "Włącz głos Pokedexu"}
                            >
                                {speechEnabled ? "🔊" : "🔇"}
                            </button>

                            <button
                                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                                onClick={closeModal}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="h-full grid grid-cols-1 xl:grid-cols-[34%_66%] gap-6">
                            <div className="h-full flex items-center justify-center">
                                <img
                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selected.pokedexNumber}.png`}
                                    alt={selected.name}
                                    className="max-w-full max-h-[58vh] object-contain"
                                />
                            </div>

                            <div className="min-w-0 h-full flex flex-col">
                                <div className="text-center">
                                    <div className="text-3xl xl:text-4xl font-extrabold mb-2">
                                        {selected.name}
                                    </div>
                                    <div className="text-lg mb-1">
                                        <b>Nr:</b> {formatNumber(selected.pokedexNumber)}
                                    </div>
                                    <div className="text-lg mb-4">
                                        <b>Typ:</b> {selectedType.label}
                                    </div>
                                </div>

                                <div className="text-center mb-4 px-4">
                                    <div className="text-xl font-bold mb-2">Opis</div>
                                    {loadingFlavor ? (
                                        <div className="text-gray-500">Ładowanie…</div>
                                    ) : flavor ? (
                                        <div className="text-sm xl:text-base leading-relaxed max-w-3xl mx-auto">
                                            {flavor}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500">Brak opisu w bazie.</div>
                                    )}
                                </div>

                                <div className="mb-5 flex justify-center">
                                    <div className="w-full max-w-4xl">
                                        {loadingEvolution ? (
                                            <div className="text-center text-gray-500 mt-4">
                                                Ładowanie ewolucji…
                                            </div>
                                        ) : (
                                            <EvolutionDiagram
                                                evolution={evolution}
                                                selectedPokedexNumber={selected.pokedexNumber}
                                                userNumbers={userNumbers}
                                                formatNumber={formatNumber}
                                                onSelectPokemon={handleEvolutionSelect}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto min-h-0">
                                    <div className="text-2xl font-bold text-center mb-3">
                                        Występuje w kartach:
                                    </div>

                                    {loadingDexCards ? (
                                        <div className="text-center text-gray-500">Ładowanie kart…</div>
                                    ) : dexCards.length === 0 ? (
                                        <div className="text-center text-gray-500">
                                            Brak posiadanych kart tego Pokémona.
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3">
                                            {dexCards.length > VISIBLE && (
                                                <button
                                                    className="px-3 py-2 rounded-full border hover:bg-gray-100 disabled:opacity-30"
                                                    onClick={slidePrev}
                                                    disabled={!canPrev}
                                                    aria-label="Poprzednia karta"
                                                >
                                                    ‹
                                                </button>
                                            )}

                                            <div
                                                className={`overflow-hidden ${dexCards.length < VISIBLE ? "mx-auto" : ""}`}
                                                style={{
                                                    width: Math.max(
                                                        Math.min(dexCards.length, VISIBLE) * THUMB_W +
                                                        (Math.min(dexCards.length, VISIBLE) - 1) * GAP,
                                                        Math.min(VIEW_W, trackWidth || VIEW_W)
                                                    ),
                                                }}
                                            >
                                                <div
                                                    className="flex items-stretch"
                                                    style={{
                                                        gap: `${GAP}px`,
                                                        width: trackWidth,
                                                        transform:
                                                            dexCards.length > VISIBLE
                                                                ? `translateX(-${carouselIndex * (THUMB_W + GAP)}px)`
                                                                : "translateX(0px)",
                                                        transition: "transform 300ms ease",
                                                        justifyContent:
                                                            dexCards.length < VISIBLE ? "center" : "flex-start",
                                                    }}
                                                >
                                                    {dexCards.map((c) => (
                                                        <button
                                                            key={c.cardId}
                                                            className="shrink-0 flex flex-col items-center hover:-translate-y-0.5 transition"
                                                            style={{ width: THUMB_W }}
                                                            onClick={() =>
                                                                navigate(`/card/${c.cardId}`, {
                                                                    state: { view: "user", from: "pokedex" },
                                                                })
                                                            }
                                                            title={c.cardName}
                                                        >
                                                            <img
                                                                src={c.imageUrlSmall}
                                                                alt={c.cardName}
                                                                className="object-contain"
                                                                style={{
                                                                    width: THUMB_W,
                                                                    height: THUMB_H,
                                                                    background: "#fff",
                                                                }}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {dexCards.length > VISIBLE && (
                                                <button
                                                    className="px-3 py-2 rounded-full border hover:bg-gray-100 disabled:opacity-30"
                                                    onClick={slideNext}
                                                    disabled={!canNext}
                                                    aria-label="Następna karta"
                                                >
                                                    ›
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}