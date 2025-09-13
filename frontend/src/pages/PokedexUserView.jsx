// src/pages/PokedexUserView.jsx
import {useEffect, useState} from "react";
import api from "../api";
import {useAuth} from "../context/AuthContext";

export default function PokedexUserView({goBack}) {
    const {user} = useAuth();
    const [pokemonList, setPokemonList] = useState([]);
    const [userNumbers, setUserNumbers] = useState([]);
    const [showOwnedOnly, setShowOwnedOnly] = useState(false);

    const [selected, setSelected] = useState(null);
    const [flavor, setFlavor] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [loadingFlavor, setLoadingFlavor] = useState(false);

    useEffect(() => {
        api.get("/pokedex").then(res => setPokemonList(res.data));
        if (user) {
            api.get("/user/pokedex")
                .then(res => setUserNumbers(res.data.map(e => e.pokedexNumber)));
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
    const pokedexSet = new Set(pokemonList.map(p => p.pokedexNumber)); // pewność, że istnieją w liście
    const ownedCount = userNumbers.filter(n => pokedexSet.has(n)).length;



    async function openDetails(pokemon) {
        // tylko posiadane
        if (!userNumbers.includes(pokemon.pokedexNumber)) return;
        setSelected(pokemon);
        setFlavor("");
        setOpenModal(true);
        setLoadingFlavor(true);
        try {
            const res = await api.get(`/pokedex/${pokemon.pokedexNumber}/random-flavor`);
            setFlavor(res.data?.text || "");
        } catch (_) {
            setFlavor("");
        } finally {
            setLoadingFlavor(false);
        }
    }

    return (
        <div className="p-6">
            {/* NAGŁÓWEK: [Powrót]   [Tytuł + licznik]   [Przełącznik] */}
            <div className="mb-6 grid grid-cols-[auto,1fr,auto] items-center gap-4">
                {/* lewa kolumna */}
                <button className="px-6 py-2 rounded bg-gray-200" onClick={goBack}>← Powrót</button>

                {/* środek: tytuł + licznik, wyrównane do lewej */}
                <div className="flex flex-col">
                    <div className="text-5xl font-extrabold leading-tight">Mój Pokedex</div>
                    <div className="mt-1 text-lg font-semibold text-gray-600">
                        Złapanych {ownedCount} z {totalCount} Pokémonów
                    </div>
                </div>

                {/* prawa kolumna: przełącznik widoku */}
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
           peer-checked:after:translate-x-6"></div>
                    </label>
                    <span className={showOwnedOnly ? "font-bold" : ""}>Pokaż posiadane</span>
                </div>
            </div>

            <div>
                {/* 6 kafelków w rzędzie */}
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
            </div>

            {/* Modal 70% ekranu */}
            {openModal && selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="relative bg-white rounded-2xl shadow-2xl w-[70vw] h-[70vh] p-6 overflow-auto">
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
