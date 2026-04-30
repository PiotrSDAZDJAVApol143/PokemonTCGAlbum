import { useState } from "react";
import {
    importDeckOfflinePackage,
    previewDeckOfflinePackage,
} from "../services/deckOfflinePackageService.js";

function formatDate(value) {
    if (!value) return "-";

    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function PreviewBox({ preview }) {
    if (!preview) return null;

    return (
        <div
            className={`mt-4 rounded-xl border p-4 text-sm ${
                preview.valid
                    ? "bg-green-50 border-green-200 text-green-950"
                    : "bg-red-50 border-red-200 text-red-950"
            }`}
        >
            <div className="font-extrabold mb-2">
                {preview.valid ? "Paczka poprawna" : "Paczka niepoprawna"}
            </div>

            <div className="space-y-1">
                <div>
                    Komunikat: <b>{preview.message || "-"}</b>
                </div>
                <div>
                    Deck: <b>{preview.deckName || "-"}</b>
                </div>
                <div>
                    Energia:{" "}
                    <b>
                        {preview.baseEnergy || "-"}
                        {preview.secondaryEnergy ? ` / ${preview.secondaryEnergy}` : ""}
                    </b>
                </div>
                <div>
                    Karty: <b>{preview.totalCards}</b> łącznie /{" "}
                    <b>{preview.uniqueCards}</b> unikalnych
                </div>
                <div>
                    Obrazy: <b>{preview.imageFileCount}</b> plików | small:{" "}
                    <b>{preview.smallImages}</b> | large: <b>{preview.largeImages}</b> |
                    brakujące: <b>{preview.missingImages}</b>
                </div>
                <div>
                    Utworzono: <b>{formatDate(preview.createdAt)}</b>
                </div>
            </div>

            {Array.isArray(preview.warnings) && preview.warnings.length > 0 && (
                <div className="mt-3">
                    <div className="font-bold mb-1">Ostrzeżenia:</div>
                    <ul className="list-disc ml-5 space-y-1">
                        {preview.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function ImportResultBox({ result }) {
    if (!result) return null;

    return (
        <div
            className={`mt-4 rounded-xl border p-4 text-sm ${
                result.success
                    ? "bg-blue-50 border-blue-200 text-blue-950"
                    : "bg-red-50 border-red-200 text-red-950"
            }`}
        >
            <div className="font-extrabold mb-2">
                {result.success ? "Import zakończony" : "Import nieudany"}
            </div>

            <div className="space-y-1">
                <div>
                    Komunikat: <b>{result.message || "-"}</b>
                </div>
                <div>
                    Deck: <b>{result.deckName || "-"}</b>
                </div>
                <div>
                    Zaimportowane karty: <b>{result.importedTotalCardInstances}</b>{" "}
                    łącznie / <b>{result.importedUniqueCards}</b> unikalnych
                </div>
                <div>
                    Obrazy zapisane do cache: <b>{result.importedImages}</b>
                </div>
                <div>
                    Pominięte karty: <b>{result.skippedCards}</b>
                </div>
            </div>

            {Array.isArray(result.warnings) && result.warnings.length > 0 && (
                <div className="mt-3">
                    <div className="font-bold mb-1">Ostrzeżenia:</div>
                    <ul className="list-disc ml-5 space-y-1">
                        {result.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default function ImportOfflineDeckModal({ onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = async (event) => {
        const selectedFile = event.target.files?.[0] || null;

        setFile(selectedFile);
        setPreview(null);
        setResult(null);
        setMessage("");

        if (!selectedFile) return;

        try {
            setLoadingPreview(true);
            const previewResult = await previewDeckOfflinePackage(selectedFile);
            setPreview(previewResult);
        } catch (e) {
            setMessage(
                "Nie udało się odczytać paczki: " +
                (e?.response?.data?.message || e?.response?.data || e.message)
            );
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setMessage("Najpierw wybierz plik ZIP.");
            return;
        }

        try {
            setImporting(true);
            setMessage("");

            const importResult = await importDeckOfflinePackage(file);
            setResult(importResult);

            if (importResult?.success) {
                onSuccess?.(importResult);
            }
        } catch (e) {
            setMessage(
                "Nie udało się zaimportować paczki: " +
                (e?.response?.data?.message || e?.response?.data || e.message)
            );
        } finally {
            setImporting(false);
        }
    };

    const canImport =
        !!file &&
        !!preview &&
        preview.valid &&
        !loadingPreview &&
        !importing &&
        !result?.success;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
            <div className="relative w-full max-w-[680px] rounded-2xl bg-white p-6 shadow-2xl">
                <button
                    type="button"
                    className="absolute right-3 top-2 text-2xl"
                    onClick={onClose}
                >
                    ×
                </button>

                <div className="text-xl font-extrabold mb-1">
                    Importuj paczkę offline
                </div>

                <div className="text-sm text-gray-600 mb-4">
                    Wybierz plik ZIP wyeksportowany z innego urządzenia. Aplikacja
                    odczyta deck, karty oraz obrazy i zapisze je lokalnie przez backend.
                </div>

                <label className="block text-sm font-semibold mb-1">
                    Plik ZIP
                </label>

                <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    className="block w-full rounded border px-3 py-2"
                    onChange={handleFileChange}
                    disabled={loadingPreview || importing}
                />

                {file && (
                    <div className="mt-2 text-xs text-gray-600">
                        Wybrany plik: <b>{file.name}</b>
                    </div>
                )}

                {loadingPreview && (
                    <div className="mt-4 rounded-xl bg-gray-100 p-3 text-sm text-gray-700">
                        Sprawdzam zawartość paczki…
                    </div>
                )}

                <PreviewBox preview={preview} />
                <ImportResultBox result={result} />

                {message && (
                    <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-900">
                        {message}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded bg-gray-200 px-4 py-2"
                        onClick={onClose}
                        disabled={importing}
                    >
                        Zamknij
                    </button>

                    <button
                        type="button"
                        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40"
                        onClick={handleImport}
                        disabled={!canImport}
                    >
                        {importing ? "Importuję…" : "Importuj deck"}
                    </button>
                </div>
            </div>
        </div>
    );
}