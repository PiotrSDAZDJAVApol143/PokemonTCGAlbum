import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function PokedexUserView({ goBack }) {
    const { user } = useAuth();
    const [pokemonList, setPokemonList] = useState([]);
    const [userNumbers, setUserNumbers] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        axios.get("/api/pokedex").then(res => setPokemonList(res.data));
        if (user) {
            axios.get("/api/user/pokedex").then(res => setUserNumbers(res.data.map(e => e.pokedexNumber)));
        }
    }, [user]);

    function formatNumber(num) {
        return "# " + num.toString().padStart(4, "0");
    }

    function handleClick(pokemon) {
        // Klikalne tylko jeśli user posiada pokemona
        if (userNumbers.includes(pokemon.pokedexNumber)) {
            setSelected(pokemon);
        }
    }

    return (
        <div>
            <button className="mb-4 px-6 py-2 rounded bg-gray-200" onClick={goBack}>
                ← Powrót
            </button>
            <div className="flex gap-8 p-8">
                <div className="flex-1">
                    <div className="text-5xl font-extrabold mb-6">Mój Pokedex</div>
                    <div className="grid grid-cols-5 gap-4">
                        {pokemonList.map((pokemon) => {
                            const owned = userNumbers.includes(pokemon.pokedexNumber);
                            return (
                                <div
                                    key={pokemon.pokedexNumber}
                                    className={`border-4 rounded-lg p-2 flex flex-col items-center cursor-pointer
                    ${owned ? "border-purple-700" : "border-gray-400 opacity-40 grayscale pointer-events-none"}
                  `}
                                    onClick={() => handleClick(pokemon)}
                                >
                                    <img
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokedexNumber}.png`}
                                        alt={pokemon.name}
                                        className="w-24 h-24 object-contain mb-1"
                                    />
                                    <span className="font-bold text-xl">{pokemon.name}</span>
                                    <span className="font-bold">{formatNumber(pokemon.pokedexNumber)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Szczegóły */}
                <div className="w-[300px] min-h-[340px] border-2 rounded-lg bg-white flex flex-col items-center p-6 shadow-xl">
                    {selected ? (
                        <>
                            <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selected.pokedexNumber}.png`}
                                alt={selected.name}
                                className="w-60 h-60 object-contain mb-3"
                            />
                            <div className="font-bold text-2xl mb-2">{selected.name}</div>
                            <div className="text-lg mb-1"><b>Nr:</b> {formatNumber(selected.pokedexNumber)}</div>
                            <div className="text-lg mb-1"><b>Typ:</b> {selected.type}</div>
                        </>
                    ) : (
                        <div className="text-xl text-gray-500">Wybierz pokemona</div>
                    )}
                </div>
            </div>
        </div>
    );
}