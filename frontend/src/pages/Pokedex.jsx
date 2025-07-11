import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import PokedexAllView from "./PokedexAllView.jsx";
import PokedexUserView from "./PokedexUserView.jsx";


export default function Pokedex() {
    const { user } = useAuth();
    const [view, setView] = useState(null);

    if (!view) {
        return (
            <div className="flex justify-center gap-20 p-16">
                {/* Wszystkie Pokemony */}
                <div className="flex-1 flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-2">Wszystkie Pokemony</h2>
                    <button
                        className="border-2 rounded-[20px] px-16 py-4 text-xl font-bold hover:bg-gray-100 mb-2"
                        onClick={() => setView("all")}
                    >
                        WYBIERZ
                    </button>
                    <span className="font-bold">opis: zobacz wszystkie dostępne Pokemony</span>
                </div>
                <div className="w-[2px] bg-gray-400"></div>
                {/* Mój Pokedex */}
                <div className="flex-1 flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-2">Mój Pokedex</h2>
                    <button
                        className="border-2 rounded-[20px] px-16 py-4 text-xl font-bold mb-2
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-gray-100"
                        disabled={!user}
                        onClick={() => user && setView("user")}
                    >
                        WYBIERZ
                    </button>
                    <span className="font-bold">
            opis: zobacz wszystkie posiadane pokemony
          </span>
                </div>
            </div>
        );
    }
    if (view === "all") return <PokedexAllView goBack={() => setView(null)} />;
    if (view === "user") return <PokedexUserView goBack={() => setView(null)} />;
}