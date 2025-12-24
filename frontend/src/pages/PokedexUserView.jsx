// src/pages/PokedexUserView.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PokedexUserView({ goBack }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [pokemonList, setPokemonList] = useState([]);
    const [userNumbers, setUserNumbers] = useState([]);
    const [showOwnedOnly, setShowOwnedOnly] = useState(false);

    // modal
    const [selected, setSelected] = useState(null);
    const [flavor, setFlavor] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [loadingFlavor, setLoadingFlavor] = useState(false);

    // karty użytkownika dla danego pokedexNumber
    const [dexCards, setDexCards] = useState([]);
    const [loadingDexCards, setLoadingDexCards] = useState(false);

    // === KARUZELA (przesuwanie o 1) ===
    const VISIBLE = 4;
    const THUMB_W = 126;   // 180 * 0.7
    const THUMB_H = 176;   // 252 * 0.7
    const GAP = 16;        // odpowiada Tailwindowemu gap-4
    const VIEW_W = VISIBLE * THUMB_W + (VISIBLE - 1) * GAP;

    const [carouselIndex, setCarouselIndex] = useState(0);
    const canPrev = carouselIndex > 0;
    const canNext = carouselIndex + VISIBLE < dexCards.length;

    const slidePrev = () => setCarouselIndex(i => Math.max(0, i - 1));
    const slideNext = () =>
        setCarouselIndex(i => Math.min(Math.max(0, dexCards.length - VISIBLE), i + 1));

    useEffect(() => {
        api.get("/pokedex").then(res => setPokemonList(res.data));
        if (user) {
            api.get("/user/pokedex").then(res => setUserNumbers(res.data.map(e => e.pokedexNumber)));
        }
    }, [user]);

    useEffect(() => {
        if (!pokemonList.length) return;
        const nums = new Set(pokemonList.map(p => p.pokedexNumber));
        const max = Math.max(...nums);
        const missing = Array.from({ length: max }, (_, i) => i + 1).filter(n => !nums.has(n));
        console.log("Brakujące numery w /pokedex:", missing);
    }, [pokemonList]);

    const formatNumber = (num) => "# " + num.toString().padStart(4, "0");
    const visible = showOwnedOnly
        ? pokemonList.filter(p => userNumbers.includes(p.pokedexNumber))
        : pokemonList;

    const totalCount = pokemonList.length;
    const pokedexSet = new Set(pokemonList.map(p => p.pokedexNumber));
    const ownedCount = userNumbers.filter(n => pokedexSet.has(n)).length;

    async function openDetails(pokemon) {
        if (!userNumbers.includes(pokemon.pokedexNumber)) return;

        setSelected(pokemon);
        setFlavor("");
        setOpenModal(true);

        // opis
        setLoadingFlavor(true);
        try {
            const res = await api.get(`/pokedex/${pokemon.pokedexNumber}/random-flavor`);
            setFlavor(res.data?.text || "");
        } catch {
            setFlavor("");
        } finally {
            setLoadingFlavor(false);
        }

        // karty usera z danym numerem pokedex
        setLoadingDexCards(true);
        try {
            const res = await api.get(`/user/pokedex/by-pokedex/${pokemon.pokedexNumber}`);
            setDexCards(res.data || []);
            setCarouselIndex(0); // reset karuzeli
        } catch {
            setDexCards([]);
            setCarouselIndex(0);
        } finally {
            setLoadingDexCards(false);
        }
    }

    // Szerokość całego tracka (żeby uniknąć łamań w flexie)
    const trackWidth = useMemo(() => {
        const n = dexCards.length;
        if (n === 0) return 0;
        return n * THUMB_W + (n - 1) * GAP;
    }, [dexCards.length]);

    return (
        <div className="p-6">
            {/* NAGŁÓWEK */}
            <div className="mb-6 grid grid-cols-[auto,1fr,auto] items-center gap-4">
                <button className="px-6 py-2 rounded bg-gray-200" onClick={goBack}>← Powrót</button>

                <div className="flex flex-col">
                    <div className="text-5xl font-extrabold leading-tight">Mój Pokedex</div>
                    <div className="mt-1 text-lg font-semibold text-gray-600">
                        Złapanych {ownedCount} z {totalCount} Pokémonów
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <span className={!showOwnedOnly ? "font-bold" : ""}>Pokaż wszystkie</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={showOwnedOnly}
                            onChange={e => setShowOwnedOnly(e.target.checked)}
                        />
                        <div className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-purple-500
                 after:content-[''] after:absolute after:top-1 after:left-1 after:w-6 after:h-6
                 after:bg-white after:rounded-full after:transition-all
                 peer-checked:after:translate-x-6"/>
                    </label>
                    <span className={showOwnedOnly ? "font-bold" : ""}>Pokaż posiadane</span>
                </div>
            </div>

            {/* LISTA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {visible.map((pokemon) => {
                    const owned = userNumbers.includes(pokemon.pokedexNumber);
                    return (
                        <div
                            key={pokemon.pokedexNumber}
                            className={`border-4 rounded-lg p-2 flex flex-col items-center transition
                          ${owned ? "border-purple-700 hover:scale-[1.02] cursor-pointer"
                                : "border-gray-300 opacity-40 grayscale cursor-not-allowed"}`}
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
                    );
                })}
            </div>

            {/* MODAL */}
            {openModal && selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    {/* WYŻSZE OKNO: 84vh */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-[70vw] h-[84vh] p-6 overflow-auto">
                        <button
                            className="absolute top-3 right-3 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                            onClick={() => setOpenModal(false)}
                        >
                            ✕
                        </button>

                        <div className="flex flex-col items-center">
                            <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selected.pokedexNumber}.png`}
                                alt={selected.name}
                                className="w-60 h-60 object-contain mb-4"
                            />
                            <div className="text-3xl font-extrabold mb-2">{selected.name}</div>
                            <div className="text-lg mb-1"><b>Nr:</b> {formatNumber(selected.pokedexNumber)}</div>
                            <div className="text-lg mb-4"><b>Typ:</b> {selected.type}</div>

                            <div className="w-full max-w-3xl text-center">
                                <div className="text-xl font-bold mb-2">Opis</div>
                                {loadingFlavor ? (
                                    <div className="text-gray-500">Ładowanie…</div>
                                ) : flavor ? (
                                    <div className="text-base">{flavor}</div>
                                ) : (
                                    <div className="text-gray-500">Brak opisu w bazie.</div>
                                )}
                            </div>

                            {/* === KARUZELA POSIADANYCH KART (z przesuwaniem o 1) === */}
                            <div className="w-full max-w-5xl mt-8">
                                <div className="text-2xl font-bold text-center mb-4">Występuje w kartach:</div>

                                {loadingDexCards ? (
                                    <div className="text-center text-gray-500">Ładowanie kart…</div>
                                ) : dexCards.length === 0 ? (
                                    <div className="text-center text-gray-500">Brak posiadanych kart tego Pokémona.</div>
                                ) : (
                                    <div className="flex items-center justify-center gap-3">
                                        {/* strzałka lewo */}
                                        <button
                                            className="px-3 py-2 rounded-full border hover:bg-gray-100 disabled:opacity-30"
                                            onClick={slidePrev}
                                            disabled={!canPrev}
                                            aria-label="Poprzednia karta"
                                        >
                                            ‹
                                        </button>

                                        {/* viewport */}
                                        <div
                                            className={`overflow-hidden ${dexCards.length < VISIBLE ? "mx-auto" : ""}`}
                                            style={{ width: Math.max(VIEW_W, dexCards.length * THUMB_W + (Math.min(dexCards.length, VISIBLE) - 1) * GAP) }}
                                        >
                                            {/* tor/track */}
                                            <div
                                                className="flex items-stretch"
                                                style={{
                                                    gap: `${GAP}px`,
                                                    width: trackWidth,
                                                    transform: `translateX(-${carouselIndex * (THUMB_W + GAP)}px)`,
                                                    transition: "transform 300ms ease"
                                                }}
                                            >
                                                {dexCards.map((c) => (
                                                    <button
                                                        key={c.cardId}
                                                        className="shrink-0 flex flex-col items-center hover:-translate-y-0.5 transition"
                                                        style={{ width: THUMB_W }}
                                                        onClick={() =>
                                                            navigate(`/card/${c.cardId}`, {
                                                                state: { view: "user", from: "pokedex" }
                                                            })
                                                        }
                                                        title={c.cardName}
                                                    >
                                                        <img
                                                            src={c.imageUrlSmall}
                                                            alt={c.cardName}
                                                            className="object-contain"
                                                            style={{ width: THUMB_W, height: THUMB_H, background: "#fff" }}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* strzałka prawo */}
                                        <button
                                            className="px-3 py-2 rounded-full border hover:bg-gray-100 disabled:opacity-30"
                                            onClick={slideNext}
                                            disabled={!canNext}
                                            aria-label="Następna karta"
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
