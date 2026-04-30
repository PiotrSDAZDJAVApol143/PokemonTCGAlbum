import { useState } from "react";
import {
    importDeckOfflinePackage,
    previewDeckOfflinePackage,
} from "../services/offlinePackageImportService.js";

function formatValid(value) {
    return value ? "Poprawna" : "Niepoprawna";
}

export default function OfflinePackageImportPanel() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0] || null;

        setFile(selected);
        setPreview(null);
        setImportResult(null);
        setMessage("");
    };

    const handlePreview = async () => {
        if (!file) {
            setMessage("Wybierz plik ZIP.");
            return;
        }

        try {
            setLoading(true);
            setImportResult(null);
            setMessage("Odczytuję paczkę offline...");

            const result = await previewDeckOfflinePackage(file);

            setPreview(result);
            setMessage(result?.message || "Paczka została odczytana.");
        } catch (e) {
            setPreview(null);
            setMessage(
                "Błąd odczytu paczki: " +
                (e?.response?.data?.message || e?.response?.data || e.message)
            );
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setMessage("Wybierz plik ZIP.");
            return;
        }

        const ok = window.confirm(
            "Czy zaimportować tę paczkę jako nowy deck na Twoim koncie?"
        );

        if (!ok) return;

        try {
            setImporting(true);
            setImportResult(null);
            setMessage("Importuję deck z paczki offline...");

            const result = await importDeckOfflinePackage(file);

            setImportResult(result);
            setMessage(result?.message || "Import zakończony.");
        } catch (e) {
            setImportResult(null);
            setMessage(
                "Błąd importu paczki: " +
                (e?.response?.data?.message || e?.response?.data || e.message)
            );
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
            <div className="text-xl font-bold mb-4">Import paczki offline</div>

            <div className="text-sm text-gray-600 mb-4">
                Wybierz plik ZIP wygenerowany przez funkcję <b>Eksportuj paczkę offline</b>.
                Najpierw sprawdź paczkę, a potem możesz zaimportować ją jako nowy deck.
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="file"
                    accept=".zip,application/zip"
                    className="border rounded px-3 py-2 bg-white"
                    onChange={handleFileChange}
                />

                <button
                    className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    onClick={handlePreview}
                    disabled={!file || loading || importing}
                >
                    {loading ? "Sprawdzam..." : "Sprawdź paczkę"}
                </button>

                <button
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    onClick={handleImport}
                    disabled={!file || !preview?.valid || loading || importing}
                >
                    {importing ? "Importuję..." : "Importuj jako mój deck"}
                </button>
            </div>

            {file && (
                <div className="mt-3 text-sm text-gray-700">
                    Wybrany plik: <b>{file.name}</b> — {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
            )}

            {message && (
                <div
                    className={`mt-4 p-3 rounded-lg text-sm ${
                        preview?.valid === false || importResult?.success === false
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                >
                    {message}
                </div>
            )}

            {preview && (
                <div className="mt-5 border rounded-2xl overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 font-bold">
                        Podgląd paczki
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <Info label="Status" value={formatValid(preview.valid)} />
                        <Info label="Typ paczki" value={preview.packageType || "-"} />
                        <Info label="Wersja paczki" value={preview.packageVersion ?? "-"} />
                        <Info label="Utworzono" value={preview.createdAt || "-"} />
                        <Info label="Deck" value={preview.deckName || "-"} />
                        <Info
                            label="Energie"
                            value={`${preview.baseEnergy || "-"}${
                                preview.secondaryEnergy ? ` / ${preview.secondaryEnergy}` : ""
                            }`}
                        />
                        <Info
                            label="Karty unikalne / łącznie"
                            value={`${preview.uniqueCards} / ${preview.totalCards}`}
                        />
                        <Info label="Pliki obrazów" value={preview.imageFileCount} />
                        <Info
                            label="Obrazy small / large"
                            value={`${preview.smallImages} / ${preview.largeImages}`}
                        />
                        <Info label="Brakujące obrazy" value={preview.missingImages} />
                    </div>

                    {preview.warnings?.length > 0 && (
                        <Warnings title="Ostrzeżenia podglądu" warnings={preview.warnings} />
                    )}
                </div>
            )}

            {importResult && (
                <div
                    className={`mt-5 border rounded-2xl overflow-hidden ${
                        importResult.success ? "border-green-300" : "border-red-300"
                    }`}
                >
                    <div
                        className={`px-4 py-3 font-bold ${
                            importResult.success
                                ? "bg-green-100 text-green-900"
                                : "bg-red-100 text-red-900"
                        }`}
                    >
                        Wynik importu
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <Info
                            label="Status"
                            value={importResult.success ? "Zaimportowano" : "Błąd importu"}
                        />
                        <Info label="Nowy deck" value={importResult.deckName || "-"} />
                        <Info label="ID decka" value={importResult.deckId ?? "-"} />
                        <Info
                            label="Zaimportowane karty unikalne"
                            value={importResult.importedUniqueCards}
                        />
                        <Info
                            label="Zaimportowane instancje kart"
                            value={importResult.importedTotalCardInstances}
                        />
                        <Info label="Zaimportowane obrazy" value={importResult.importedImages} />
                        <Info label="Pominięte karty" value={importResult.skippedCards} />
                    </div>

                    {importResult.warnings?.length > 0 && (
                        <Warnings title="Ostrzeżenia importu" warnings={importResult.warnings} />
                    )}

                    {importResult.success && (
                        <div className="border-t p-4 bg-green-50 text-sm text-green-900">
                            Deck został dodany do Twojej listy talii. Przejdź do zakładki
                            <b> Deck</b>, aby go zobaczyć.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div>
            <div className="text-gray-500">{label}</div>
            <div className="font-bold">{value}</div>
        </div>
    );
}

function Warnings({ title, warnings }) {
    return (
        <div className="border-t p-4 bg-amber-50">
            <div className="font-bold text-amber-800 mb-2">{title}</div>
            <ul className="list-disc ml-5 text-sm text-amber-900">
                {warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                ))}
            </ul>
        </div>
    );
}