import JSZip from "jszip";
import { saveDeckToOfflineSnapshot } from "./offlineSnapshotStore.js";
import { saveCardImageBlobToBrowserCache } from "../browserImageCacheService.js";

function normalizeEntryName(name) {
    return String(name || "")
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");
}

function isDangerousEntryName(name) {
    return (
        !name ||
        name.includes("..") ||
        name.startsWith("/") ||
        /^[a-zA-Z]:/.test(name)
    );
}

function asString(value) {
    if (value == null) return null;

    const text = String(value).trim();

    return text ? text : null;
}

function asInteger(value) {
    if (value == null) return null;

    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
    }

    const parsed = Number.parseInt(String(value), 10);

    return Number.isFinite(parsed) ? parsed : null;
}

function safeIdPart(value) {
    return String(value || "deck")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 80);
}

function buildImportedDeckId(originalDeckId) {
    return `offline_${safeIdPart(originalDeckId)}_${Date.now()}`;
}

async function readJson(zip, path, required = true) {
    const file = zip.file(path);

    if (!file) {
        if (required) {
            throw new Error(`Brak pliku ${path} w paczce ZIP.`);
        }

        return null;
    }

    const text = await file.async("string");

    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`Plik ${path} nie jest poprawnym JSON.`);
    }
}

function calculateTotalCards(deck) {
    const cards = Array.isArray(deck?.cards) ? deck.cards : [];

    return cards.reduce((sum, item) => {
        const qty = asInteger(item?.quantity) ?? 1;
        return sum + Math.max(1, qty);
    }, 0);
}

function calculateUniqueCards(deck) {
    const cards = Array.isArray(deck?.cards) ? deck.cards : [];
    const ids = new Set();

    for (const item of cards) {
        const cardId = item?.card?.id || item?.cardId;

        if (cardId) {
            ids.add(cardId);
        }
    }

    return ids.size;
}

function calculateImageStats(imagesManifest) {
    const entries = Array.isArray(imagesManifest) ? imagesManifest : [];

    let smallImages = 0;
    let largeImages = 0;
    let missingImages = 0;

    for (const entry of entries) {
        if (String(entry?.smallStatus).toLowerCase() === "ok" && entry?.small) {
            smallImages++;
        } else {
            missingImages++;
        }

        if (String(entry?.largeStatus).toLowerCase() === "ok" && entry?.large) {
            largeImages++;
        } else {
            missingImages++;
        }
    }

    return {
        imageFileCount: smallImages + largeImages,
        smallImages,
        largeImages,
        missingImages,
    };
}

function normalizeDeckForOfflineImport(deckJson, manifest) {
    const originalDeckId = deckJson?.id ?? manifest?.deckId ?? "unknown";
    const originalName = asString(deckJson?.name || manifest?.deckName) || "Deck offline";

    return {
        ...deckJson,
        id: buildImportedDeckId(originalDeckId),
        sourceDeckId: originalDeckId,
        name: `${originalName} (offline ZIP)`,
        baseEnergy: deckJson?.baseEnergy ?? manifest?.baseEnergy ?? null,
        secondaryEnergy: deckJson?.secondaryEnergy ?? manifest?.secondaryEnergy ?? null,
        cards: Array.isArray(deckJson?.cards) ? deckJson.cards : [],
        wins: 0,
        losses: 0,
        shared: false,
        readOnly: true,
        offlineSnapshot: true,
        offlineImported: true,
        ownerUsername: deckJson?.ownerUsername || "ZIP import",
    };
}

async function parsePackage(file) {
    if (!file) {
        throw new Error("Nie wybrano pliku ZIP.");
    }

    const zip = await JSZip.loadAsync(file);

    for (const entryName of Object.keys(zip.files)) {
        const normalized = normalizeEntryName(entryName);

        if (isDangerousEntryName(normalized)) {
            throw new Error(`Paczka zawiera niebezpieczną ścieżkę: ${entryName}`);
        }
    }

    const manifest = await readJson(zip, "manifest.json", true);
    const deck = await readJson(zip, "deck.json", true);
    const imagesManifest = await readJson(zip, "images/images-manifest.json", false);

    return {
        zip,
        manifest,
        deck,
        imagesManifest: Array.isArray(imagesManifest) ? imagesManifest : [],
    };
}

export async function previewBrowserDeckPackage(file) {
    try {
        const { manifest, deck, imagesManifest } = await parsePackage(file);

        const packageType = asString(manifest?.packageType);
        const packageVersion = asInteger(manifest?.packageVersion);
        const createdAt = asString(manifest?.createdAt);

        const warnings = [];

        if (packageType !== "pokemon-tcg-deck-offline-package") {
            warnings.push(`Nietypowy packageType: ${packageType || "-"}`);
        }

        if (!packageVersion || packageVersion < 1) {
            warnings.push("Nieznana albo nieobsługiwana wersja paczki.");
        }

        const imageStats = calculateImageStats(imagesManifest);

        if (imageStats.imageFileCount === 0) {
            warnings.push("Paczka nie zawiera obrazów kart albo manifest obrazów jest pusty.");
        }

        const uniqueCards = calculateUniqueCards(deck);
        const totalCards = calculateTotalCards(deck);

        if (uniqueCards === 0) {
            warnings.push("Paczka nie zawiera poprawnej listy kart.");
        }

        return {
            valid: true,
            message: "Paczka ZIP została poprawnie odczytana w przeglądarce.",
            packageType,
            packageVersion,
            createdAt,
            deckId: deck?.id ?? manifest?.deckId ?? null,
            deckName: deck?.name ?? manifest?.deckName ?? null,
            baseEnergy: deck?.baseEnergy ?? manifest?.baseEnergy ?? null,
            secondaryEnergy: deck?.secondaryEnergy ?? manifest?.secondaryEnergy ?? null,
            uniqueCards,
            totalCards,
            ...imageStats,
            warnings,
        };
    } catch (e) {
        return {
            valid: false,
            message: e?.message || "Nie udało się odczytać paczki ZIP.",
            packageType: null,
            packageVersion: null,
            createdAt: null,
            deckId: null,
            deckName: null,
            baseEnergy: null,
            secondaryEnergy: null,
            uniqueCards: 0,
            totalCards: 0,
            imageFileCount: 0,
            smallImages: 0,
            largeImages: 0,
            missingImages: 0,
            warnings: [],
        };
    }
}

export async function importBrowserDeckPackage(file) {
    const { zip, manifest, deck, imagesManifest } = await parsePackage(file);

    const importedDeck = normalizeDeckForOfflineImport(deck, manifest);

    await saveDeckToOfflineSnapshot(importedDeck);

    let importedImages = 0;
    let skippedImages = 0;
    const warnings = [];

    for (const entry of imagesManifest) {
        const cardId = asString(entry?.cardId);

        if (!cardId) {
            skippedImages++;
            warnings.push("Pominięto obraz bez cardId w images-manifest.json.");
            continue;
        }

        const imageTargets = [
            {
                size: "small",
                path: asString(entry?.small),
                status: asString(entry?.smallStatus),
            },
            {
                size: "large",
                path: asString(entry?.large),
                status: asString(entry?.largeStatus),
            },
        ];

        for (const target of imageTargets) {
            if (String(target.status).toLowerCase() !== "ok" || !target.path) {
                skippedImages++;
                continue;
            }

            const normalizedPath = normalizeEntryName(target.path);
            const imageFile = zip.file(normalizedPath);

            if (!imageFile) {
                skippedImages++;
                warnings.push(`Brak pliku obrazu w ZIP: ${normalizedPath}`);
                continue;
            }

            try {
                const blob = await imageFile.async("blob");

                await saveCardImageBlobToBrowserCache(cardId, target.size, blob);

                importedImages++;
            } catch (e) {
                skippedImages++;
                warnings.push(
                    `Nie udało się zaimportować obrazu ${normalizedPath}: ${e?.message || "błąd"}`
                );
            }
        }
    }

    return {
        success: true,
        message: `Deck został zaimportowany lokalnie jako: ${importedDeck.name}`,
        deckId: importedDeck.id,
        deckName: importedDeck.name,
        importedUniqueCards: calculateUniqueCards(importedDeck),
        importedTotalCardInstances: calculateTotalCards(importedDeck),
        importedImages,
        skippedImages,
        warnings,
        deck: importedDeck,
    };
}