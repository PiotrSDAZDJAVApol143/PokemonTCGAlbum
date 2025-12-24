import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import UserAddCardPanel from "../components/UserAddCardPanel";

/** Uniwersalny suwak krokowy */
function Slider({
                    steps,          // string[] np. ["recent","oldest",...]
                    value,          // aktualna wartość z steps
                    onChange,       // (newVal) => void
                    width = 210,    // px
                    thumb = 24,     // px (średnica kółka)
                    trackClass = "bg-purple-500",
                    tickClass = "bg-white/50",
                }) {
    const idx = Math.max(0, steps.indexOf(value));
    const maxIdx = Math.max(steps.length - 1, 1);
    const stepPx = (width - thumb) / maxIdx;

    const posToIndex = (clientX, targetEl) => {
        const rect = targetEl.getBoundingClientRect();
        const x = clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        return Math.round(ratio * maxIdx);
    };

    const pick = (e) => {
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const newIdx = posToIndex(clientX, e.currentTarget);
        const newVal = steps[newIdx];
        if (newVal && newVal !== value) onChange(newVal);
    };

    const onKey = (e) => {
        const i = idx;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            const next = Math.max(0, i - 1);
            if (next !== i) onChange(steps[next]);
        }
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            const next = Math.min(maxIdx, i + 1);
            if (next !== i) onChange(steps[next]);
        }
    };

    return (
        <div
            className="relative select-none cursor-pointer"
            style={{ width, height: thumb + 8 }}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={maxIdx}
            aria-valuenow={idx}
            tabIndex={0}
            onKeyDown={onKey}
            onClick={pick}
            onTouchStart={pick}
        >
            {/* tor */}
            <div className={`absolute inset-0 rounded-full ${trackClass}`} />

            {/* kreski pozycji */}
            {steps.map((_, i) => (
                <div
                    key={i}
                    className={`absolute top-1/2 -translate-y-1/2 w-px h-4 ${tickClass}`}
                    style={{ left: `${maxIdx > 0 ? (i / maxIdx) * 100 : 0}%` }}
                />
            ))}

            {/* kółko */}
            <div
                className="absolute top-1 left-1 rounded-full bg-white shadow transition-transform duration-100"
                style={{
                    width: thumb,
                    height: thumb,
                    transform: `translateX(${idx * stepPx}px)`,
                }}
            />
        </div>
    );
}

/** Suwak „Wyświetl” z podpisem o stałej wysokości i stałą szerokością kolumny */
function DisplaySlider({ displayFilter, setDisplayFilter }) {
    const SHOW_STEPS = ["all", "assigned", "unassigned"];
    const MAX = SHOW_STEPS.length - 1;
    const labels = {
        all: "Wszystkie",
        assigned: "Przydzielone (mają coś w deckach)",
        unassigned: "Nieprzydzielone (mają wolne egzemplarze)",
    };

    const idx = SHOW_STEPS.indexOf(displayFilter);
    const trackW = 210;
    const knob = 28; // ~w-6 + marginesy

    const handleFromX = (clientX, rect) => {
        const x = clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        const i = Math.round(ratio * MAX);
        const val = SHOW_STEPS[i];
        if (val && val !== displayFilter) setDisplayFilter(val);
    };

    return (
        <div className="w-[280px] flex flex-col items-center">
            <div className="text-lg font-semibold mb-1">Wyświetl</div>

            <div
                className="relative select-none cursor-pointer"
                style={{ width: trackW, height: 32 }}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={MAX}
                aria-valuenow={idx}
                aria-label="Wyświetl"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                        const next = Math.max(0, idx - 1);
                        setDisplayFilter(SHOW_STEPS[next]);
                    }
                    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                        const next = Math.min(MAX, idx + 1);
                        setDisplayFilter(SHOW_STEPS[next]);
                    }
                }}
                onClick={(e) => handleFromX(e.clientX, e.currentTarget.getBoundingClientRect())}
                onTouchStart={(e) => handleFromX(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
            >
                <div className="absolute inset-0 rounded-full bg-indigo-600" />
                {Array.from({ length: SHOW_STEPS.length }, (_, i) => (
                    <div
                        key={i}
                        className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-white/50"
                        style={{ left: `${(i / MAX) * 100}%` }}
                    />
                ))}
                <div
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-100"
                    style={{ transform: `translateX(${idx * ((trackW - knob) / Math.max(1, MAX))}px)` }}
                />
            </div>

            {/* podpis – STAŁA wysokość */}
            <div className="mt-2 h-5 text-sm text-gray-800 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                {labels[displayFilter]}
            </div>
        </div>
    );
}

export default function AlbumUserAllView({ goBack, page = 0, setPage, search, setSearch }) {
    const [userCards, setUserCards] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState({ total: 0, unique: 0, duplicates: 0 });

    // SORT
    const SORT_STEPS = ["recent", "oldest", "name_az", "name_za", "pokedex", "overallRating"];
    const sortLabels = {
        recent: "Ostatnio dodane",
        oldest: "Najstarsze",
        name_az: "Alfabetycznie A–Z",
        name_za: "Alfabetycznie Z–A",
        pokedex: "Pokedex (najnowsze wydanie najpierw)",
        overallRating: "Moc Pokémona (siła malejąco)",
    };
    const [sortMode, setSortMode] = useState(
        () => localStorage.getItem("albumUserAll.sort") || "recent"
    );
    useEffect(() => {
        localStorage.setItem("albumUserAll.sort", sortMode);
    }, [sortMode]);

    // WYŚWIETL (suwak 3-pozycyjny)
    const [displayFilter, setDisplayFilter] = useState(
        () => localStorage.getItem("albumUserAll.show") || "all"
    );
    useEffect(() => {
        localStorage.setItem("albumUserAll.show", displayFilter);
    }, [displayFilter]);

    const navigate = useNavigate();
    const size = 10;

    // POBIERANIE
    useEffect(() => {
        api
            .get("/user-cards/search", {
                params: { page, size, name: search, sort: sortMode, show: displayFilter },
            })
            .then((res) => {
                setUserCards(res.data.content);
                setTotalPages(res.data.totalPages);
                setSummary({
                    total: res.data.total,
                    unique: res.data.unique,
                    duplicates: res.data.duplicates,
                });
            });
    }, [page, search, sortMode, displayFilter]);

    // odśwież po dodaniu
    const refresh = () => {
        api
            .get("/user-cards/search", {
                params: { page, size, name: search, sort: sortMode, show: displayFilter },
            })
            .then((res) => {
                setUserCards(res.data.content);
                setTotalPages(res.data.totalPages);
                setSummary({
                    total: res.data.total,
                    unique: res.data.unique,
                    duplicates: res.data.duplicates,
                });
            });
    };

    return (
        <div className="px-5 pt-1">
            {/* --- Górny pasek (SZTYWNY UKŁAD) --- */}
            <div
                className="
          grid grid-cols-[auto,1fr,auto,auto]
          items-start gap-6 mb-5
        "
            >
                {/* 1) Powrót */}
                <button className="px-6 py-2 rounded bg-gray-200 font-bold" onClick={goBack}>
                    ← Powrót
                </button>

                {/* 2) Info o kolekcji – wypełnia wolne miejsce */}
                <span className="text-xl font-bold place-self-center">
          Informacje o Twojej kolekcji:&nbsp;
                    <span className="text-black">{summary.unique}</span> z {summary.total} kart
                    {summary.duplicates > 0 && (
                        <span className="text-gray-700">  (+ {summary.duplicates} duplikaty)</span>
                    )}
        </span>

                {/* 3) Blok sterowania: 2 kolumny o stałej szerokości */}
                <div className="grid grid-cols-2 gap-8">
                    {/* SORTOWANIE (stała szerokość kolumny) */}
                    <div className="w-[280px] flex flex-col items-center">
                        <div className="text-lg font-semibold mb-1">Sortowanie</div>
                        <Slider
                            steps={SORT_STEPS}
                            value={sortMode}
                            onChange={(v) => {
                                setSortMode(v);
                                setPage(0);
                            }}
                            width={210}
                            thumb={24}
                            trackClass="bg-purple-500"
                            tickClass="bg-white/50"
                        />
                        {/* podpis – stała wysokość */}
                        <div className="mt-2 h-5 text-sm text-gray-800 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                            {sortLabels[sortMode]}
                        </div>
                    </div>

                    {/* WYŚWIETL – slider 3-pozycyjny (stała szerokość kolumny) */}
                    <DisplaySlider
                        displayFilter={displayFilter}
                        setDisplayFilter={(v) => {
                            setDisplayFilter(v);
                            setPage(0);
                        }}
                    />
                </div>

                {/* 4) Wyszukiwarka */}
                <input
                    className="border px-4 py-2 rounded w-80"
                    placeholder="Szukaj nazwę Pokemona..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                />
            </div>

            {/* Panel dodawania kart */}
            <div className="mb-6">
                <UserAddCardPanel onCardAdded={refresh} />
            </div>

            {/* --- Miniatury kart --- */}
            <div className="grid grid-cols-5 gap-8 mb-6">
                {userCards.map((userCard, i) => (
                    <div
                        key={userCard.cardId}
                        className="flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-105"
                        onClick={() =>
                            navigate(`/card/${userCard.cardId}`, {
                                state: {
                                    page,
                                    size,
                                    name: search,
                                    idxOnPage: i,
                                    view: "user",
                                    sort: sortMode,
                                    show: displayFilter,
                                },
                            })
                        }
                        style={{ minHeight: 260 }}
                    >
                        <img
                            src={userCard.imageUrlSmall || userCard.officialArtworkUrl}
                            alt={userCard.cardName}
                            className="w-[220px] h-[310px] object-contain drop-shadow-lg"
                            style={{ background: "#fff", borderRadius: "12px" }}
                        />
                        <div className="font-bold mt-2">{userCard.cardName}</div>
                        {userCard.quantity > 1 && (
                            <span className="text-sm text-gray-500">x{userCard.quantity}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* --- Paginacja --- */}
            <div className="mt-8 flex justify-center items-center gap-4">
                <button
                    className="px-4 py-2 rounded border"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                >
                    Poprzednia
                </button>
                <span>{page + 1} / {totalPages}</span>
                <button
                    className="px-4 py-2 rounded border"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                >
                    Następna
                </button>
            </div>
        </div>
    );
}
