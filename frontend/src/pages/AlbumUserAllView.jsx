import {useState, useEffect, useRef} from "react";
import api from "../api";
import {useNavigate} from "react-router-dom";
import UserAddCardPanel from "../components/UserAddCardPanel";

export default function AlbumUserAllView({goBack, page = 0, setPage, search, setSearch}) {
    const [userCards, setUserCards] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState({total: 0, unique: 0, duplicates: 0});
    const [sortMode, setSortMode] = useState(() => {
           return localStorage.getItem("albumUserAll.sort") || "recent";
         });
    const navigate = useNavigate();
    const size = 10;
    const trackRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const SORT_STEPS = ["recent", "oldest", "name_az", "name_za", "pokedex", "overallRating"];
    const MAX_IDX = SORT_STEPS.length - 1;
    const sortLabels = {
        recent: "Ostatnio dodane",
        oldest: "Najstarsze",
        name_az: "Alfabetycznie A–Z",
        name_za: "Alfabetycznie Z–A",
        pokedex: "Pokedex (najnowsze wydanie najpierw)",
        overallRating: "Moc Pokémona (siła malejąco)"
    };
    const posToIndex = (clientX) => {
        const el = trackRef.current;
        if (!el || MAX_IDX <= 0) return 0;
        const rect = el.getBoundingClientRect();
        const x = clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        return Math.round(ratio * MAX_IDX);
    };

     useEffect(() => {
           localStorage.setItem("albumUserAll.sort", sortMode);
         }, [sortMode]);

    useEffect(() => {
        if (!dragging) return;
        const onMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const idx = posToIndex(clientX);
            const mode = SORT_STEPS[idx];
            if (mode && mode !== sortMode) {
                setSortMode(mode);
                setPage(0);
            }
        };
        const onUp = () => setDragging(false);

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onUp);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onUp);
        };
    }, [dragging, sortMode, setPage]);

    // Pobieranie kart usera
    useEffect(() => {
        api.get("/user-cards/search", {
            params: { page, size, name: search, sort: sortMode },
        }).then(res => {
            setUserCards(res.data.content);
            setTotalPages(res.data.totalPages);
            setSummary({
                total: res.data.total,
                unique: res.data.unique,
                duplicates: res.data.duplicates
            });
        });
    }, [page, search, sortMode]);

    // Funkcja do odświeżania po dodaniu karty
    const refresh = () => {
        api.get("/user-cards/search", {
            params: { page, size, name: search, sort: sortMode },
        }).then(res => {
            setUserCards(res.data.content);
            setTotalPages(res.data.totalPages);
            setSummary({
                total: res.data.total,
                unique: res.data.unique,
                duplicates: res.data.duplicates
            });
        });
    };

    return (
        <div className="px-5 pt-1">
            {/* --- Górny pasek --- */}
            <div className="flex items-center justify-between mb-5">
                <button className="px-6 py-2 rounded bg-gray-200 font-bold" onClick={goBack}>
                    ← Powrót
                </button>
                {/* Info o kolekcji */}
                <span className="ml-8 text-xl font-bold">
                    Informacje o Twojej kolekcji:&nbsp;
                    <span className="text-black">{summary.unique}</span> z {summary.total} kart
                    {summary.duplicates > 0 && (
                        <span className="text-gray-700">  (+ {summary.duplicates} duplikaty)</span>
                    )}
                </span>
                {/* Blok sortowania */}
                <div className="flex flex-col items-center w-[420px]">
                    <div className="text-lg font-semibold mb-1">Sortowanie</div>

                    <div
                        ref={trackRef}
                        className="relative select-none cursor-pointer"
                        style={{width: 210, height: 32}}
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={MAX_IDX}
                        aria-valuenow={SORT_STEPS.indexOf(sortMode)}
                        aria-label="Sortowanie"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            const i = SORT_STEPS.indexOf(sortMode);
                            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                                const next = Math.max(0, i - 1);
                                if (next !== i) {
                                    setSortMode(SORT_STEPS[next]);
                                    setPage(0);
                                }
                            }
                            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                                const next = Math.min(MAX_IDX, i + 1);
                                if (next !== i) {
                                    setSortMode(SORT_STEPS[next]);
                                    setPage(0);
                                }
                            }
                        }}
                        onClick={(e) => {                        // klik w tor — przeskocz
                            const idx = posToIndex(e.clientX);
                            const mode = SORT_STEPS[idx];
                            if (mode !== sortMode) {
                                setSortMode(mode);
                                setPage(0);
                            }
                        }}
                        onTouchStart={(e) => {                   // dotyk: start przeciągania
                            setDragging(true);
                            const idx = posToIndex(e.touches[0].clientX);
                            const mode = SORT_STEPS[idx];
                            if (mode !== sortMode) {
                                setSortMode(mode);
                                setPage(0);
                            }
                        }}
                    >
                        {/* tor */}
                        <div className="absolute inset-0 rounded-full bg-purple-500"/>

                        {/* kreski pozycji */}
                        {Array.from({length: SORT_STEPS.length}, (_, i) => (
                            <div
                                key={i}
                                className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-white/50"
                                style={{left: `${MAX_IDX > 0 ? (i / MAX_IDX) * 100 : 0}%`}}
                            />
                        ))}

                        {/* kółko (draggable) */}
                        <div
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-100
                  ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                            style={{
                                transform: `translateX(${(SORT_STEPS.indexOf(sortMode)) * ((210 - 32) / Math.max(1, MAX_IDX))}px)`
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}  // start drag (mysz)
                        />
                    </div>

                    <div className="mt-2 text-sm text-gray-800">
                        {sortLabels[sortMode]}
                    </div>
                </div>

                {/* --- Wyszukiwarka --- */}
                <input
                    className="border px-4 py-2 rounded w-80"
                    placeholder="Szukaj nazwę Pokemona..."
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                />
            </div>

            {/* Panel dodawania kart */}
            <div className="mb-6">
                <UserAddCardPanel onCardAdded={refresh}/>
            </div>

            {/* --- Miniatury kart --- */}
            <div className="grid grid-cols-5 gap-8 mb-6">
                {userCards.map((userCard, i) => (
                    <div
                        key={userCard.cardId}
                        className="flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-105"
                        onClick={() => navigate(`/card/${userCard.cardId}`, {
                            state: {
                                page, size, name: search,
                                idxOnPage: i, view: "user", sort: sortMode
                            }
                        })}
                        style={{minHeight: 260}}
                    >
                        <img
                            src={userCard.imageUrlSmall || userCard.officialArtworkUrl}
                            alt={userCard.cardName}
                            className="w-[220px] h-[310px] object-contain drop-shadow-lg"
                            style={{background: "#fff", borderRadius: "12px"}}
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
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                >Poprzednia
                </button>
                <span>{page + 1} / {totalPages}</span>
                <button
                    className="px-4 py-2 rounded border"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                >Następna
                </button>
            </div>
        </div>
    );
}
