import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    clearOfflineSnapshot,
    deleteDeckFromOfflineSnapshot,
    getOfflineDecks,
    getOfflineSnapshotInfo,
} from "../services/offline/offlineSnapshotStore.js";
import {
    clearBrowserCardImageCache,
    getBrowserCardImageCacheInfo,
} from "../services/browserImageCacheService.js";
import {
    importBrowserDeckPackage,
    previewBrowserDeckPackage,
} from "../services/offline/browserOfflinePackageImportService.js";

function formatDate(value) {
    if (!value) return "-";

    try {
        return new Date(value).toLocaleString("pl-PL");
    } catch {
        return value;
    }
}

function totalCardsInDeck(deck) {
    const cards = deck?.cards ?? [];
    return cards.reduce((sum, dc) => sum + (dc?.quantity ?? 1), 0);
}

export default function OfflineManager() {
    const navigate = useNavigate();

    const [snapshotInfo, setSnapshotInfo] = useState(null);
    const [cacheInfo, setCacheInfo] = useState(null);
    const [offlineDecks, setOfflineDecks] = useState([]);

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [importResult, setImportResult] = useState(null);

    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [message, setMessage] = useState("");

    const refreshLocalInfo = async () => {
        setLoading(true);

        try {
            const [snapshot, cache, decks] = await Promise.all([
                getOfflineSnapshotInfo(),
                getBrowserCardImageCacheInfo(),
                getOfflineDecks(),
            ]);

            setSnapshotInfo(snapshot);
            setCacheInfo(cache);
            setOfflineDecks(Array.isArray(decks) ? decks : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshLocalInfo();
    }, []);

    const handlePreview = async () => {
        if (!file) {
            alert("Najpierw wybierz plik ZIP.");
            return;
        }

        setWorking(true);
        setMessage("");
        setImportResult(null);

        try {
            const result = await previewBrowserDeckPackage(file);
            setPreview(result);
        } catch (e) {
            setPreview(null);
            setMessage(e?.message || "Nie udało się wykonać podglądu paczki.");
        } finally {
            setWorking(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            alert("Najpierw wybierz plik ZIP.");
            return;
        }

        const ok = window.confirm(
            "Zaimportować tę paczkę lokalnie do przeglądarki? Deck zostanie zapisany jako offline/read-only."
        );

        if (!ok) return;

        setWorking(true);
        setMessage("");
        setImportResult(null);

        try {
            const result = await importBrowserDeckPackage(file);

            setImportResult(result);
            setMessage(result.message || "Import zakończony.");
            await refreshLocalInfo();
        } catch (e) {
            setMessage(e?.message || "Nie udało się zaimportować paczki.");
        } finally {
            setWorking(false);
        }
    };

    const handleClearSnapshot = async () => {
        const ok = window.confirm(
            "Wyczyścić lokalny snapshot decków i kart? Obrazy w Cache API nie zostaną usunięte."
        );

        if (!ok) return;

        setWorking(true);

        try {
            await clearOfflineSnapshot();
            await refreshLocalInfo();
            setMessage("Lokalny snapshot został wyczyszczony.");
        } finally {
            setWorking(false);
        }
    };

    const handleClearImages = async () => {
        const ok = window.confirm("Wyczyścić lokalny cache obrazów kart?");

        if (!ok) return;

        setWorking(true);

        try {
            await clearBrowserCardImageCache();
            await refreshLocalInfo();
            setMessage("Cache obrazów został wyczyszczony.");
        } finally {
            setWorking(false);
        }
    };

    const handleDeleteOfflineDeck = async (deckId) => {
        const ok = window.confirm("Usunąć ten deck z lokalnego snapshotu offline?");

        if (!ok) return;

        setWorking(true);

        try {
            await deleteDeckFromOfflineSnapshot(deckId);
            await refreshLocalInfo();
            setMessage("Deck został usunięty z lokalnego snapshotu.");
        } finally {
            setWorking(false);
        }
    };

    return (
        <div className="min-h-[90vh] w-full p-6">
            <div className="max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold app-text-primary">
                            Centrum Offline
                        </h1>
                        <div className="text-sm app-text-secondary mt-1">
                            Import paczek ZIP bez backendu oraz zarządzanie lokalnym snapshotem.
                        </div>
                    </div>

                    <button
                        type="button"
                        className="deck-btn-muted px-4 py-2 rounded-xl"
                        onClick={() => navigate("/deck")}
                    >
                        ← Wróć do Decków
                    </button>
                </div>

                {message && (
                    <div className="mb-4 rounded-2xl border bg-white/80 px-4 py-3 text-sm font-semibold app-text-primary">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
                    <div className="space-y-6">
                        <div className="deck-card-box rounded-3xl p-5">
                            <div className="text-xl font-extrabold app-text-primary mb-3">
                                Lokalny snapshot
                            </div>

                            {loading ? (
                                <div className="app-text-secondary">Ładowanie…</div>
                            ) : (
                                <div className="space-y-2 text-sm app-text-secondary">
                                    <div>
                                        Decki offline:{" "}
                                        <b className="app-text-primary">{snapshotInfo?.deckCount ?? 0}</b>
                                    </div>
                                    <div>
                                        Karty offline:{" "}
                                        <b className="app-text-primary">{snapshotInfo?.cardCount ?? 0}</b>
                                    </div>
                                    <div>
                                        Zapisano:{" "}
                                        <b className="app-text-primary">
                                            {formatDate(snapshotInfo?.savedAt)}
                                        </b>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="deck-btn-muted px-3 py-2 rounded-xl text-sm disabled:opacity-40"
                                    onClick={refreshLocalInfo}
                                    disabled={working}
                                >
                                    Odśwież
                                </button>

                                <button
                                    type="button"
                                    className="deck-btn-danger px-3 py-2 rounded-xl text-sm disabled:opacity-40"
                                    onClick={handleClearSnapshot}
                                    disabled={working}
                                >
                                    Wyczyść snapshot
                                </button>
                            </div>
                        </div>

                        <div className="deck-card-box rounded-3xl p-5">
                            <div className="text-xl font-extrabold app-text-primary mb-3">
                                Cache obrazów kart
                            </div>

                            {loading ? (
                                <div className="app-text-secondary">Ładowanie…</div>
                            ) : (
                                <div className="space-y-2 text-sm app-text-secondary">
                                    <div>
                                        Cache API:{" "}
                                        <b className="app-text-primary">
                                            {cacheInfo?.supported ? "dostępne" : "niedostępne"}
                                        </b>
                                    </div>
                                    <div>
                                        Liczba obrazów:{" "}
                                        <b className="app-text-primary">{cacheInfo?.entryCount ?? 0}</b>
                                    </div>
                                    <div>
                                        Rozmiar:{" "}
                                        <b className="app-text-primary">{cacheInfo?.totalMb ?? 0} MB</b>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="deck-btn-danger px-3 py-2 rounded-xl text-sm disabled:opacity-40"
                                    onClick={handleClearImages}
                                    disabled={working}
                                >
                                    Wyczyść obrazy
                                </button>
                            </div>
                        </div>

                        <div className="deck-card-box rounded-3xl p-5">
                            <div className="text-xl font-extrabold app-text-primary mb-3">
                                Import ZIP offline
                            </div>

                            <input
                                type="file"
                                accept=".zip,application/zip"
                                className="deck-input rounded-xl px-3 py-2 w-full"
                                onChange={(e) => {
                                    const selected = e.target.files?.[0] || null;
                                    setFile(selected);
                                    setPreview(null);
                                    setImportResult(null);
                                    setMessage("");
                                }}
                            />

                            <div className="mt-3 text-sm app-text-secondary">
                                {file ? (
                                    <>
                                        Wybrano: <b>{file.name}</b>
                                    </>
                                ) : (
                                    "Wybierz paczkę ZIP wyeksportowaną z aplikacji."
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="deck-btn-muted px-3 py-2 rounded-xl text-sm disabled:opacity-40"
                                    onClick={handlePreview}
                                    disabled={!file || working}
                                >
                                    Podgląd paczki
                                </button>

                                <button
                                    type="button"
                                    className="deck-btn-primary px-3 py-2 rounded-xl text-sm disabled:opacity-40"
                                    onClick={handleImport}
                                    disabled={!file || working}
                                >
                                    Importuj lokalnie
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {preview && (
                            <div className="deck-card-box rounded-3xl p-5">
                                <div className="text-xl font-extrabold app-text-primary mb-3">
                                    Podgląd paczki
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm app-text-secondary">
                                    <div>
                                        Status:{" "}
                                        <b className={preview.valid ? "text-green-700" : "text-red-600"}>
                                            {preview.valid ? "poprawna" : "błędna"}
                                        </b>
                                    </div>
                                    <div>
                                        Deck: <b className="app-text-primary">{preview.deckName || "-"}</b>
                                    </div>
                                    <div>
                                        Karty unikalne:{" "}
                                        <b className="app-text-primary">{preview.uniqueCards}</b>
                                    </div>
                                    <div>
                                        Kart razem:{" "}
                                        <b className="app-text-primary">{preview.totalCards}</b>
                                    </div>
                                    <div>
                                        Obrazy small:{" "}
                                        <b className="app-text-primary">{preview.smallImages}</b>
                                    </div>
                                    <div>
                                        Obrazy large:{" "}
                                        <b className="app-text-primary">{preview.largeImages}</b>
                                    </div>
                                </div>

                                {preview.warnings?.length > 0 && (
                                    <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                                        <div className="font-bold mb-1">Ostrzeżenia:</div>
                                        <ul className="list-disc ml-5">
                                            {preview.warnings.map((warning, idx) => (
                                                <li key={idx}>{warning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-3 text-sm app-text-secondary">
                                    {preview.message}
                                </div>
                            </div>
                        )}

                        {importResult && (
                            <div className="deck-card-box rounded-3xl p-5">
                                <div className="text-xl font-extrabold app-text-primary mb-3">
                                    Wynik importu
                                </div>

                                <div className="space-y-2 text-sm app-text-secondary">
                                    <div>
                                        Deck: <b className="app-text-primary">{importResult.deckName}</b>
                                    </div>
                                    <div>
                                        Karty unikalne:{" "}
                                        <b className="app-text-primary">{importResult.importedUniqueCards}</b>
                                    </div>
                                    <div>
                                        Kart razem:{" "}
                                        <b className="app-text-primary">{importResult.importedTotalCardInstances}</b>
                                    </div>
                                    <div>
                                        Zaimportowane obrazy:{" "}
                                        <b className="app-text-primary">{importResult.importedImages}</b>
                                    </div>
                                    <div>
                                        Pominięte obrazy:{" "}
                                        <b className="app-text-primary">{importResult.skippedImages}</b>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="deck-btn-primary px-3 py-2 rounded-xl text-sm mt-4"
                                    onClick={() => navigate("/deck")}
                                >
                                    Przejdź do decków
                                </button>
                            </div>
                        )}

                        <div className="deck-card-box rounded-3xl p-5">
                            <div className="text-xl font-extrabold app-text-primary mb-3">
                                Decki zapisane offline
                            </div>

                            {offlineDecks.length === 0 ? (
                                <div className="text-sm app-text-secondary">
                                    Brak decków w lokalnym snapshotcie.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {offlineDecks.map((deck) => (
                                        <div
                                            key={deck.id}
                                            className="rounded-2xl border bg-white/70 px-4 py-3 flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="font-bold app-text-primary truncate">
                                                    {deck.name}
                                                </div>
                                                <div className="text-xs app-text-secondary">
                                                    ID: {deck.id} • karty: {totalCardsInDeck(deck)}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    className="deck-btn-muted px-3 py-2 rounded-xl text-xs"
                                                    onClick={() =>
                                                        navigate(`/poke-game/deck/${deck.id}`, {
                                                            state: {
                                                                from: "deck",
                                                                selectedDeckId: deck.id,
                                                            },
                                                        })
                                                    }
                                                >
                                                    Podgląd
                                                </button>

                                                <button
                                                    type="button"
                                                    className="deck-btn-danger px-3 py-2 rounded-xl text-xs disabled:opacity-40"
                                                    onClick={() => handleDeleteOfflineDeck(deck.id)}
                                                    disabled={working}
                                                >
                                                    Usuń
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}