import { useState, useEffect } from "react";
import api from "../api";

export default function AlbumUserSetListView({ goBack, onSelectSet }) {
    const [sets, setSets] = useState([]);

    useEffect(() => {
        api.get("/user-cards/sets").then((res) => setSets(res.data));
    }, []);

    return (
        <div className="px-5 pt-2 pb-6">
            {/* Góra widoku */}
            <div className="mb-6 flex flex-col items-start gap-4">
                <button
                    className="px-6 py-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/40 shadow-md text-slate-800 font-semibold hover:bg-white transition"
                    onClick={goBack}
                >
                    ← Powrót
                </button>

                <div className="px-6 py-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/35 shadow-lg">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Wybierz serię/set spośród swoich kart
                    </h1>
                </div>
            </div>

            {/* Kafelki setów */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {sets.map((set) => {
                    const unlocked = set.unlocked ?? 0;
                    const total = set.total ?? 0;
                    const percent =
                        total > 0 ? ((unlocked / total) * 100).toFixed(2) : "0.00";

                    return (
                        <div
                            key={set.id}
                            className="group cursor-pointer"
                            onClick={() => onSelectSet(set.id)}
                        >
                            <div
                                className="
                                    h-full min-h-[240px]
                                    flex flex-col items-center justify-start
                                    rounded-2xl px-4 py-4
                                    bg-white/20 backdrop-blur-md
                                    border border-white/35
                                    shadow-lg
                                    transition-all duration-200
                                    hover:bg-white
                                    hover:shadow-2xl
                                    hover:scale-[1.02]
                                "
                            >
                                {/* Logo */}
                                <div className="h-[72px] mb-3 flex items-center justify-center">
                                    <img
                                        src={set.logoUrl}
                                        alt={set.name}
                                        className="max-h-16 max-w-full object-contain drop-shadow-md"
                                    />
                                </div>

                                {/* Nazwa seta */}
                                <div className="text-center font-bold text-sm leading-tight text-slate-900">
                                    {set.name}
                                </div>

                                {/* Seria */}
                                <div className="mt-1 text-center text-xs text-slate-700">
                                    {set.series}
                                </div>

                                {/* Liczba kart */}
                                <div className="mt-3 text-base font-bold text-indigo-800">
                                    {unlocked} / {total || "?"}
                                </div>

                                {/* Procent */}
                                <div className="mt-1 text-xs font-medium text-slate-700">
                                    ({percent} %)
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}