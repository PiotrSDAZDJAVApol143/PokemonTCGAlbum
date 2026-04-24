import React, { useMemo } from "react";

function getArtworkUrl(pokedexNumber) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokedexNumber}.png`;
}

function stageLabel(group) {
    if (group?.baby) return "Baby";
    if (group?.normalStage === "BASIC") return "Basic";
    if (group?.normalStage === "STAGE1") return "Stage 1";
    if (group?.normalStage === "STAGE2") return "Stage 2";
    return group?.normalStage || "";
}

export default function EvolutionDiagram({
                                             evolution,
                                             selectedPokedexNumber,
                                             userNumbers = [],
                                             formatNumber,
                                             onSelectPokemon,
                                         }) {
    const ownedSet = useMemo(() => new Set(userNumbers), [userNumbers]);

    const groups = useMemo(() => {
        if (!evolution?.groups?.length) return [];

        return [...evolution.groups]
            .sort((a, b) => {
                if ((a.evolutionTier ?? 0) !== (b.evolutionTier ?? 0)) {
                    return (a.evolutionTier ?? 0) - (b.evolutionTier ?? 0);
                }
                return (a.branchOrder ?? 0) - (b.branchOrder ?? 0);
            })
            // W Pokedexie pokazujemy tylko klasyczną linię ewolucji
            .filter((group) => group?.formCode === "NORMAL");
    }, [evolution]);

    if (!groups.length) {
        return <div className="text-sm text-gray-500 text-center">Brak danych o ewolucji.</div>;
    }

    return (
        <div className="w-full">
            <div className="text-[15px] xl:text-[16px] font-bold text-center mb-3">
                Ewolucja
            </div>

            <div className="flex items-center justify-center gap-3 xl:gap-4 flex-wrap">
                {groups.map((group, idx) => {
                    const owned = ownedSet.has(group.pokedexNumber);
                    const isCurrent = selectedPokedexNumber === group.pokedexNumber;
                    const clickable = owned && typeof onSelectPokemon === "function";

                    return (
                        <React.Fragment key={`${group.pokedexNumber}-${group.formCode}-${idx}`}>
                            <div className="flex flex-col items-center">
                                <div className="text-[12px] xl:text-[13px] font-bold text-slate-700 mb-1">
                                    {stageLabel(group)}
                                </div>

                                <button
                                    type="button"
                                    disabled={!clickable}
                                    onClick={() => clickable && onSelectPokemon(group.pokedexNumber)}
                                    className={[
                                        "w-[150px] xl:w-[160px] min-h-[138px] xl:min-h-[146px] rounded-2xl border-[3px] px-3 py-3",
                                        "flex flex-col items-center justify-center text-center transition",
                                        owned
                                            ? "border-purple-700 hover:scale-[1.02]"
                                            : "border-gray-300 grayscale opacity-45 cursor-not-allowed",
                                        isCurrent
                                            ? "bg-purple-100 shadow-[0_0_0_5px_rgba(168,85,247,0.18)]"
                                            : "bg-white",
                                        clickable ? "cursor-pointer" : "cursor-not-allowed",
                                    ].join(" ")}
                                    title={
                                        owned
                                            ? `Pokaż ${group.pokemonName}`
                                            : `${group.pokemonName} nie jest posiadany`
                                    }
                                >
                                    <img
                                        src={getArtworkUrl(group.pokedexNumber)}
                                        alt={group.pokemonName}
                                        className="w-14 h-14 xl:w-16 xl:h-16 object-contain mb-2"
                                    />

                                    <div className="font-extrabold text-[13px] xl:text-[14px] leading-tight">
                                        {group.pokemonName}
                                    </div>

                                    <div className="text-[11px] text-slate-600 mt-1">
                                        {formatNumber(group.pokedexNumber)}
                                    </div>
                                </button>
                            </div>

                            {idx < groups.length - 1 && (
                                <div className="text-3xl xl:text-4xl text-gray-400 font-light self-center mt-5">
                                    ›
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}