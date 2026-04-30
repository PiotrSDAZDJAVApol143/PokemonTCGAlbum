package org.example.pokemontcgalbum.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.DeckCardDto;
import org.example.pokemontcgalbum.dto.DeckDto;
import org.example.pokemontcgalbum.model.User;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
public class DeckOfflinePackageService {

    private final UserDeckService userDeckService;
    private final CardImageCacheService cardImageCacheService;
    private final ObjectMapper objectMapper;

    public byte[] buildDeckOfflinePackage(Long deckId, User user) {
        try {
            DeckDto deckDto = userDeckService.getDeckDtoById(deckId, user);

            List<String> cardIds = extractCardIds(deckDto);

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();

            try (ZipOutputStream zip = new ZipOutputStream(byteArrayOutputStream)) {
                writeJson(zip, "manifest.json", buildManifest(deckDto, cardIds));
                writeJson(zip, "deck.json", deckDto);

                List<Map<String, Object>> imageManifest = new ArrayList<>();
                Set<String> writtenZipEntries = new HashSet<>();

                for (String cardId : cardIds) {
                    Map<String, Object> imageEntry = new LinkedHashMap<>();
                    imageEntry.put("cardId", cardId);

                    addImageIfPossible(
                            zip,
                            writtenZipEntries,
                            imageEntry,
                            cardId,
                            "small"
                    );

                    addImageIfPossible(
                            zip,
                            writtenZipEntries,
                            imageEntry,
                            cardId,
                            "large"
                    );

                    imageManifest.add(imageEntry);
                }

                writeJson(zip, "images/images-manifest.json", imageManifest);
            }

            return byteArrayOutputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Cannot build offline deck package: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> buildManifest(DeckDto deckDto, List<String> cardIds) {
        Map<String, Object> manifest = new LinkedHashMap<>();

        manifest.put("packageType", "pokemon-tcg-deck-offline-package");
        manifest.put("packageVersion", 1);
        manifest.put("createdAt", Instant.now().toString());

        manifest.put("deckId", deckDto.getId());
        manifest.put("deckName", deckDto.getName());
        manifest.put("baseEnergy", deckDto.getBaseEnergy());
        manifest.put("secondaryEnergy", deckDto.getSecondaryEnergy());

        manifest.put("uniqueCards", cardIds.size());
        manifest.put("containsImages", true);
        manifest.put("imageFormat", "jpg");

        return manifest;
    }

    private List<String> extractCardIds(DeckDto deckDto) {
        if (deckDto == null || deckDto.getCards() == null) {
            return List.of();
        }

        LinkedHashSet<String> ids = new LinkedHashSet<>();

        for (DeckCardDto deckCardDto : deckDto.getCards()) {
            if (deckCardDto == null || deckCardDto.getCard() == null) {
                continue;
            }

            String cardId = deckCardDto.getCard().getId();

            if (cardId != null && !cardId.isBlank()) {
                ids.add(cardId);
            }
        }

        return new ArrayList<>(ids);
    }

    private void addImageIfPossible(
            ZipOutputStream zip,
            Set<String> writtenZipEntries,
            Map<String, Object> imageEntry,
            String cardId,
            String size
    ) throws IOException {
        Optional<CardImageCacheService.CachedCardImage> imageOpt =
                cardImageCacheService.getCardImage(cardId, size);

        if (imageOpt.isEmpty()) {
            imageEntry.put(size, null);
            imageEntry.put(size + "Status", "missing");
            return;
        }

        Path imagePath = imageOpt.get().getPath();

        if (!Files.exists(imagePath) || !Files.isRegularFile(imagePath)) {
            imageEntry.put(size, null);
            imageEntry.put(size + "Status", "missing");
            return;
        }

        String fileName = imagePath.getFileName().toString();
        String zipPath = "images/cards/" + fileName;

        if (!writtenZipEntries.contains(zipPath)) {
            writeFile(zip, zipPath, imagePath);
            writtenZipEntries.add(zipPath);
        }

        imageEntry.put(size, zipPath);
        imageEntry.put(size + "Status", "ok");
    }

    private void writeJson(ZipOutputStream zip, String path, Object value) throws IOException {
        ZipEntry entry = new ZipEntry(path);
        zip.putNextEntry(entry);

        byte[] json = objectMapper
                .writerWithDefaultPrettyPrinter()
                .writeValueAsBytes(value);

        zip.write(json);
        zip.closeEntry();
    }

    private void writeFile(ZipOutputStream zip, String path, Path source) throws IOException {
        ZipEntry entry = new ZipEntry(path);
        zip.putNextEntry(entry);

        Files.copy(source, zip);

        zip.closeEntry();
    }
}