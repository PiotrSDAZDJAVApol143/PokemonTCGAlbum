import { useEffect, useLayoutEffect, useRef, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import UserAddCardPanel from "../components/UserAddCardPanel";
import CardImage from "../components/CardImage.jsx";

/** Uniwersalny suwak krokowy (klik + drag) */
function Slider({
                    steps,
                    value,
                    onChange,
                    width = 210,
                    thumb = 24,
                    height = 32,
                    trackClass = "bg-purple-500",
                    tickClass = "bg-white/50",
                    thumbClass = "bg-white",
                    ariaLabel = "Slider",
                }) {
    const trackRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [measuredW, setMeasuredW] = useState(width);

    const idxRaw = steps.indexOf(value);
    const idx = idxRaw >= 0 ? idxRaw : 0;
    const maxIdx = Math.max(steps.length - 1, 1);

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    useLayoutEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        const measure = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width && Math.abs(rect.width - measuredW) > 0.5) {
                setMeasuredW(rect.width);
            }
        };

        measure();

        const ro = new ResizeObserver(() => measure());
        ro.observe(el);

        const t = setTimeout(measure, 0);

        return () => {
            clearTimeout(t);
            ro.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clientXToIndex = (clientX) => {
        const el = trackRef.current;
        if (!el) return idx;

        const rect = el.getBoundingClientRect();
        const raw = clientX - rect.left;

        const usable = Math.max(1, rect.width - thumb);
        const x = clamp(raw - thumb / 2, 0, usable);
        const ratio = x / usable;

        return Math.round(ratio * maxIdx);
    };

    const setFromClientX = (clientX) => {
        const newIdx = clientXToIndex(clientX);
        const newVal = steps[newIdx];
        if (newVal && newVal !== value) onChange(newVal);
    };

    const onPointerDown = (e) => {
        e.preventDefault();
        setDragging(true);
        trackRef.current?.setPointerCapture?.(e.pointerId);
        setFromClientX(e.clientX);
    };

    const onPointerMove = (e) => {
        if (!dragging) return;
        e.preventDefault();
        setFromClientX(e.clientX);
    };

    const stopDrag = (e) => {
        if (!dragging) return;
        e.preventDefault();
        setDragging(false);
        trackRef.current?.releasePointerCapture?.(e.pointerId);
    };

    const onKeyDown = (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            const next = Math.max(0, idx - 1);
            if (next !== idx) onChange(steps[next]);
        }
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            const next = Math.min(maxIdx, idx + 1);
            if (next !== idx) onChange(steps[next]);
        }
    };

    const usableW = Math.max(1, measuredW - thumb);
    const xPx = maxIdx > 0 ? (idx / maxIdx) * usableW : 0;

    return (
        <div
            ref={trackRef}
            className="relative select-none overflow-hidden rounded-full"
            style={{
                width,
                height,
                touchAction: "none",
            }}
            role="slider"
            aria-label={ariaLabel}
            aria-valuemin={0}
            aria-valuemax={maxIdx}
            aria-valuenow={idx}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
        >
            <div className={`absolute inset-0 ${trackClass}`} />

            {steps.map((_, i) => (
                <div
                    key={i}
                    className={`absolute top-1/2 -translate-y-1/2 w-px h-4 ${tickClass}`}
                    style={{ left: `${maxIdx > 0 ? (i / maxIdx) * 100 : 0}%` }}
                />
            ))}

            <div
                className={`absolute top-1/2 -translate-y-1/2 rounded-full shadow ${thumbClass} cursor-grab active:cursor-grabbing`}
                style={{
                    width: thumb,
                    height: thumb,
                    left: xPx,
                }}
            />
        </div>
    );
}

export default function AlbumUserAllView({ goBack, page = 0, setPage, search, setSearch }) {
    const [userCards, setUserCards] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState({ total: 0, unique: 0, duplicates: 0 });
    const [addOpen, setAddOpen] = useState(false);

    const SORT_STEPS = ["recent", "oldest", "name_az", "name_za", "pokedex", "overallRating"];
    const sortLabels = {
        recent: "Ostatnio dodane",
        oldest: "Najstarsze",
        name_az: "A–Z",
        name_za: "Z–A",
        pokedex: "Pokedex",
        overallRating: "Moc (malejąco)",
    };

    const [sortMode, setSortMode] = useState(() => localStorage.getItem("albumUserAll.sort") || "recent");
    useEffect(() => localStorage.setItem("albumUserAll.sort", sortMode), [sortMode]);

    const SHOW_STEPS = ["all", "assigned", "unassigned"];
    const showLabels = {
        all: "Wszystkie",
        assigned: "Przydzielone",
        unassigned: "Nieprzydzielone",
    };

    const [displayFilter, setDisplayFilter] = useState(() => localStorage.getItem("albumUserAll.show") || "all");
    useEffect(() => localStorage.setItem("albumUserAll.show", displayFilter), [displayFilter]);

    const navigate = useNavigate();
    const size = 10;

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
        <div className="px-5 pt-0">
            <div className="bg-white rounded-2xl border p-4 mb-2">
                <div className="flex items-center gap-6">
                    <button className="px-6 h-11 rounded bg-gray-200 font-bold" onClick={goBack}>
                        ← Powrót
                    </button>

                    <div className="text-lg font-bold whitespace-nowrap">
                        Informacje o Twojej kolekcji:&nbsp;
                        <span className="text-black">{summary.unique}</span> z {summary.total} kart
                        {summary.duplicates > 0 && (
                            <span className="text-gray-700"> (+ {summary.duplicates} duplikaty)</span>
                        )}
                    </div>

                    <div className="ml-auto flex items-center gap-8">
                        <div className="w-[360px] flex items-center gap-3">
                            <div className="text-base font-semibold whitespace-nowrap">Sortowanie</div>
                            <Slider
                                steps={SORT_STEPS}
                                value={sortMode}
                                onChange={(v) => {
                                    setSortMode(v);
                                    setPage(0);
                                }}
                                width={210}
                                thumb={24}
                                height={32}
                                trackClass="bg-purple-500"
                                tickClass="bg-white/50"
                                ariaLabel="Sortowanie"
                            />
                            <div className="text-sm text-gray-700 whitespace-nowrap w-[130px]">
                                {sortLabels[sortMode]}
                            </div>
                        </div>

                        <div className="w-[280px] flex items-center gap-3">
                            <div className="text-base font-semibold whitespace-nowrap">Wyświetl</div>
                            <Slider
                                steps={SHOW_STEPS}
                                value={displayFilter}
                                onChange={(v) => {
                                    setDisplayFilter(v);
                                    setPage(0);
                                }}
                                width={210}
                                thumb={24}
                                height={32}
                                trackClass="bg-indigo-600"
                                tickClass="bg-white/50"
                                ariaLabel="Wyświetl"
                            />
                            <div className="text-sm text-gray-700 whitespace-nowrap w-[120px]">
                                {showLabels[displayFilter]}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            className="h-11 px-5 rounded-xl bg-blue-600 text-white font-bold border border-black/20 shadow hover:brightness-110"
                            onClick={() => setAddOpen((o) => !o)}
                        >
                            Dodaj kartę do albumu
                        </button>
                        <div className="text-sm text-gray-600 hidden lg:block">
                            Wyszukuj w bazie i dodawaj 1 kliknięciem (podgląd lupą).
                        </div>
                    </div>

                    <input
                        className="h-11 border px-4 rounded w-80"
                        placeholder="Szukaj nazwę Pokemona..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                    />
                </div>

                {addOpen && (
                    <div className="mt-3">
                        <UserAddCardPanel onCardAdded={refresh} variant="inline" />
                    </div>
                )}
            </div>

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
                        <CardImage
                            card={userCard}
                            size="small"
                            alt={userCard.cardName || userCard.name}
                            className="w-[220px] h-[310px] object-contain drop-shadow-lg"
                        />

                        <div className="w-[220px] mt-3 px-3 py-2 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 shadow-lg">
                            <div className="text-center font-bold text-[18px] leading-tight text-slate-900 drop-shadow-sm">
                                {userCard.cardName}
                            </div>

                            {userCard.quantity > 1 && (
                                <div className="mt-1 text-center text-sm font-semibold text-slate-700">
                                    x{userCard.quantity}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex justify-center">
                <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 shadow-lg">
                <button
                    className="px-4 py-2 rounded-xl bg-white/70 hover:bg-white text-slate-800 font-semibold border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                >
                    Poprzednia
                </button>
                <div className="min-w-[90px] text-center font-bold text-slate-900">
                    {page + 1} / {totalPages}
                </div>
                    <button
                        className="px-4 py-2 rounded-xl bg-white/70 hover:bg-white text-slate-800 font-semibold border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                    >
                        Następna
                    </button>
            </div>
            </div>
        </div>
    );
}