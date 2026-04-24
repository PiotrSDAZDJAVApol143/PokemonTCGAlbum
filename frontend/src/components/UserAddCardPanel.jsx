// src/components/UserAddCardPanel.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { AiOutlineSearch } from "react-icons/ai";
import { createPortal } from "react-dom";

export default function UserAddCardPanel({ onCardAdded, variant = "inline" }) {
    const [query, setQuery] = useState("");

    // WYNIKI
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // PAGINACJA
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // żeby paginacja działała na strzałkach nawet gdy input się zmieni
    const [lastQuery, setLastQuery] = useState("");

    // PREVIEW (portal)
    const [preview, setPreview] = useState({
        open: false,
        card: null,
        x: 0,
        y: 0,
    });

    // rozmiar tooltipa (dobrany pod Twoje miniatury)
    const TOOLTIP_W = 190;
    const TOOLTIP_H = 285;
    const GAP = 12;
    const PAD = 8;

    const effectiveQuery = useMemo(() => (lastQuery || query).trim(), [lastQuery, query]);

    const canPrev = page > 0 && !loading;
    const canNext = page + 1 < totalPages && !loading;

    function closePreview() {
        setPreview((p) => ({ ...p, open: false, card: null }));
    }

    function openPreview(e, card) {
        const rect = e.currentTarget.getBoundingClientRect();

        // preferuj lewą stronę ikony (żeby nie zasłaniać "dodaj")
        let x = rect.left - TOOLTIP_W - GAP;
        if (x < PAD) x = rect.right + GAP;

        // domyślnie równamy do góry ikony
        let y = rect.top;

        // dociśnij do dołu ekranu jeśli wychodzi
        const maxY = window.innerHeight - TOOLTIP_H - PAD;
        if (y > maxY) y = Math.max(PAD, maxY);

        setPreview({ open: true, card, x, y });
    }

    async function fetchPage({ q, p, s }) {
        const name = (q ?? "").trim();

        if (!name) {
            setResults([]);
            setTotalPages(0);
            setTotalElements(0);
            return;
        }

        setLoading(true);
        try {
            const res = await api.get("/cards/search", {
                params: { name, page: p, size: s },
            });

            const data = res.data ?? {};
            setResults(Array.isArray(data.content) ? data.content : []);
            setTotalPages(Number.isFinite(data.totalPages) ? data.totalPages : 0);

            // Spring Page zwykle ma totalElements
            const te =
                Number.isFinite(data.totalElements)
                    ? data.totalElements
                    : Number.isFinite(data.total)
                        ? data.total
                        : 0;
            setTotalElements(te);
        } finally {
            setLoading(false);
        }
    }

    async function handleSearch() {
        const q = query.trim();
        setLastQuery(q);

        const p = 0;
        setPage(p);
        await fetchPage({ q, p, s: size });
    }

    async function goPrev() {
        const next = Math.max(0, page - 1);
        if (next === page) return;
        setPage(next);
        await fetchPage({ q: effectiveQuery, p: next, s: size });
    }

    async function goNext() {
        const next = Math.min(Math.max(0, totalPages - 1), page + 1);
        if (next === page) return;
        setPage(next);
        await fetchPage({ q: effectiveQuery, p: next, s: size });
    }

    async function handleChangeSize(newSize) {
        const s = Number(newSize) || 20;
        setSize(s);

        const p = 0;
        setPage(p);

        // jeśli nie było wyszukania, nie odpalaj
        await fetchPage({ q: effectiveQuery, p, s });
    }

    async function handleAdd(card) {
        await api.post("/user-cards/add", { cardId: card.id, quantity: 1 });
        onCardAdded?.();

        // po dodaniu odśwież aktualną stronę wyników
        await fetchPage({ q: effectiveQuery, p: page, s: size });
    }

    // Zamknij tooltip na ESC
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") closePreview();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Wygląd dla inline vs normal
    const shellCls =
        variant === "inline"
            ? "rounded-xl border bg-white p-3"
            : "bg-white rounded-xl border p-3";

    return (
        <div className={shellCls}>
            {/* 1 LINIA: input + szukaj + page size + strzałki */}
            <div className="flex flex-wrap items-center gap-3">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                    }}
                    className="border px-3 py-2 rounded w-[260px]"
                    placeholder="Wpisz kod lub nazwę karty"
                />

                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-60"
                    disabled={loading}
                >
                    Szukaj w Bazie Danych
                </button>

                {/* Paginacja + informacja — spłaszczona w jednej linii */}
                <div className="flex items-center gap-3 ml-auto">
                    {(totalPages > 0 || totalElements > 0) && (
                        <>
                            <button
                                className="px-3 py-2 rounded border bg-gray-50 disabled:opacity-40"
                                onClick={goPrev}
                                disabled={!canPrev}
                                title="Poprzednia strona"
                            >
                                ←
                            </button>

                            <div className="text-sm text-gray-700 whitespace-nowrap">
                <span>
                  Strona <b>{totalPages === 0 ? 0 : page + 1}</b> / <b>{totalPages}</b>
                </span>
                                {totalElements > 0 && (
                                    <span className="text-gray-500">
                    {" "}
                                        • wyników: <b>{totalElements}</b>
                  </span>
                                )}
                            </div>

                            <button
                                className="px-3 py-2 rounded border bg-gray-50 disabled:opacity-40"
                                onClick={goNext}
                                disabled={!canNext}
                                title="Następna strona"
                            >
                                →
                            </button>
                        </>
                    )}

                    {/* Page size */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Na stronę:</span>
                        <select
                            className="border rounded px-2 py-2"
                            value={size}
                            onChange={(e) => handleChangeSize(e.target.value)}
                            disabled={loading}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* INFO */}
            {loading && <div className="text-sm text-gray-600 py-2">Ładowanie...</div>}

            {/* 2 BLOK: lista wyników (scroll) */}
            <div className="mt-3 max-h-[260px] overflow-y-auto rounded-lg border" onScroll={closePreview}>
                {!loading && results.length === 0 && effectiveQuery && (
                    <div className="p-3 text-sm text-gray-600">
                        Brak wyników dla: <b>{effectiveQuery}</b>
                    </div>
                )}

                {results.map((card) => (
                    <div
                        key={card.id}
                        className="flex items-center justify-between border-b px-3 py-2"
                    >
            <span className="text-sm">
              {card.numberInSet} / {card.set?.printedTotal ?? "?"} - {card.name}
                {card.hp ? ` HP${card.hp}` : ""} / {card.set?.series} - {card.set?.name}
            </span>

                        <div className="flex items-center gap-3">
                            {/* lupa + preview */}
                            <span
                                onMouseEnter={(e) => openPreview(e, card)}
                                onMouseLeave={closePreview}
                                className="cursor-pointer"
                                title="Szybki podgląd"
                            >
                <AiOutlineSearch size={22} />
              </span>

                            <button
                                className="bg-green-500 text-white px-3 py-1 rounded font-semibold hover:bg-green-600"
                                onClick={() => handleAdd(card)}
                            >
                                dodaj
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* TOOLTIP (PORTAL) — nie ucina się w scrollu */}
            {preview.open &&
                preview.card &&
                createPortal(
                    <div
                        className="fixed z-[9999] p-2 bg-white border rounded shadow-xl"
                        style={{
                            left: preview.x,
                            top: preview.y,
                            width: TOOLTIP_W,
                        }}
                        onMouseEnter={() => setPreview((p) => ({ ...p, open: true }))}
                        onMouseLeave={closePreview}
                    >
                        <img
                            src={preview.card.imageUrlSmall || preview.card.officialArtworkUrl}
                            alt={preview.card.name}
                            className="w-full h-[225px] object-contain"
                            style={{ background: "#fff", borderRadius: "8px" }}
                        />
                        <div className="text-center font-bold mt-2 text-sm">{preview.card.name}</div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
