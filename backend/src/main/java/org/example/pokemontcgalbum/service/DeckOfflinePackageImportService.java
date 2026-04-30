package org.example.pokemontcgalbum.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.DeckDto;
import org.example.pokemontcgalbum.dto.OfflineDeckPackageImportResultDto;
import org.example.pokemontcgalbum.dto.OfflineDeckPackagePreviewDto;
import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.model.UserCardInstance;
import org.example.pokemontcgalbum.repository.DeckRepository;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.example.pokemontcgalbum.repository.UserCardInstanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.example.pokemontcgalbum.model.CardSet;
import org.example.pokemontcgalbum.repository.CardSetRepository;
import java.time.LocalDate;

import org.example.pokemontcgalbum.model.Ability;
import org.example.pokemontcgalbum.model.AbilityDef;
import org.example.pokemontcgalbum.model.Attack;
import org.example.pokemontcgalbum.model.AttackDef;
import org.example.pokemontcgalbum.model.RuleDef;
import org.example.pokemontcgalbum.model.TcgRule;

import org.example.pokemontcgalbum.repository.AbilityDefRepository;
import org.example.pokemontcgalbum.repository.AttackDefRepository;
import org.example.pokemontcgalbum.repository.RuleDefRepository;

import org.springframework.transaction.interceptor.TransactionAspectSupport;




@Service
@RequiredArgsConstructor
public class DeckOfflinePackageImportService {

    private static final int MAX_JSON_BYTES = 10 * 1024 * 1024;
    private static final int MAX_IMAGE_BYTES = 20 * 1024 * 1024;

    private final ObjectMapper objectMapper;

    private final DeckRepository deckRepository;
    private final TcgCardRepository tcgCardRepository;
    private final CardSetRepository cardSetRepository;

    private final AttackDefRepository attackDefRepository;
    private final AbilityDefRepository abilityDefRepository;
    private final RuleDefRepository ruleDefRepository;

    private final UserCardInstanceRepository userCardInstanceRepository;
    private final CardImageCacheService cardImageCacheService;
    private final UserDeckService userDeckService;

    public OfflineDeckPackagePreviewDto previewDeckPackage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return invalid("Nie wybrano pliku ZIP.");
        }

        try {
            ZipReadResult zipReadResult = readZipPackage(file, false);

            if (zipReadResult.manifestBytes == null) {
                return invalid("Brak pliku manifest.json w paczce.");
            }

            if (zipReadResult.deckBytes == null) {
                return invalid("Brak pliku deck.json w paczce.");
            }

            Map<String, Object> manifest = readJsonMap(zipReadResult.manifestBytes);
            Map<String, Object> deck = readJsonMap(zipReadResult.deckBytes);

            List<Map<String, Object>> imagesManifest = List.of();

            if (zipReadResult.imagesManifestBytes != null) {
                imagesManifest = readJsonList(zipReadResult.imagesManifestBytes);
            } else {
                zipReadResult.warnings.add("Brak images/images-manifest.json. Obrazy mogą być niekompletne.");
            }

            String packageType = asString(manifest.get("packageType"));
            Integer packageVersion = asInteger(manifest.get("packageVersion"));
            String createdAt = asString(manifest.get("createdAt"));

            if (!"pokemon-tcg-deck-offline-package".equals(packageType)) {
                zipReadResult.warnings.add("Nieznany packageType: " + packageType);
            }

            if (packageVersion == null || packageVersion < 1) {
                zipReadResult.warnings.add("Nieznana lub nieobsługiwana wersja paczki.");
            }

            Long deckId = asLong(firstNonNull(deck.get("id"), manifest.get("deckId")));
            String deckName = asString(firstNonNull(deck.get("name"), manifest.get("deckName")));
            String baseEnergy = asString(firstNonNull(deck.get("baseEnergy"), manifest.get("baseEnergy")));
            String secondaryEnergy = asString(firstNonNull(deck.get("secondaryEnergy"), manifest.get("secondaryEnergy")));

            int totalCards = calculateTotalCards(deck);
            int uniqueCards = calculateUniqueCards(deck);

            ImageStats imageStats = calculateImageStats(imagesManifest, zipReadResult.imageFiles);

            if (uniqueCards == 0) {
                zipReadResult.warnings.add("Paczka nie zawiera kart albo nie udało się odczytać listy kart.");
            }

            if (imageStats.imageFileCount == 0) {
                zipReadResult.warnings.add("Paczka nie zawiera plików obrazów kart.");
            }

            return new OfflineDeckPackagePreviewDto(
                    true,
                    "Paczka offline została poprawnie odczytana.",
                    packageType,
                    packageVersion,
                    createdAt,
                    deckId,
                    deckName,
                    baseEnergy,
                    secondaryEnergy,
                    uniqueCards,
                    totalCards,
                    imageStats.imageFileCount,
                    imageStats.smallImages,
                    imageStats.largeImages,
                    imageStats.missingImages,
                    zipReadResult.warnings
            );
        } catch (Exception e) {
            return invalid("Nie udało się odczytać paczki ZIP: " + e.getMessage());
        }
    }

    @Transactional
    public OfflineDeckPackageImportResultDto importDeckPackage(MultipartFile file, User user) {
        if (file == null || file.isEmpty()) {
            return new OfflineDeckPackageImportResultDto(
                    false,
                    "Nie wybrano pliku ZIP.",
                    null,
                    null,
                    0,
                    0,
                    0,
                    0,
                    List.of(),
                    null
            );
        }

        try {
            ZipReadResult zipReadResult = readZipPackage(file, true);

            if (zipReadResult.manifestBytes == null) {
                throw new IllegalArgumentException("Brak pliku manifest.json w paczce.");
            }

            if (zipReadResult.deckBytes == null) {
                throw new IllegalArgumentException("Brak pliku deck.json w paczce.");
            }

            Map<String, Object> manifest = readJsonMap(zipReadResult.manifestBytes);
            Map<String, Object> deckMap = readJsonMap(zipReadResult.deckBytes);

            String packageType = asString(manifest.get("packageType"));
            Integer packageVersion = asInteger(manifest.get("packageVersion"));

            if (!"pokemon-tcg-deck-offline-package".equals(packageType)) {
                zipReadResult.warnings.add("Importowana paczka ma nietypowy packageType: " + packageType);
            }

            if (packageVersion == null || packageVersion < 1) {
                zipReadResult.warnings.add("Importowana paczka ma nieznaną wersję.");
            }

            String originalDeckName = asString(firstNonNull(deckMap.get("name"), manifest.get("deckName")));
            String baseEnergy = asString(firstNonNull(deckMap.get("baseEnergy"), manifest.get("baseEnergy")));
            String secondaryEnergy = asString(firstNonNull(deckMap.get("secondaryEnergy"), manifest.get("secondaryEnergy")));
            String logoUrl = asString(deckMap.get("logoUrl"));

            if (originalDeckName == null || originalDeckName.isBlank()) {
                originalDeckName = "Deck offline";
            }

            String importedDeckName = originalDeckName + " (import)";

            Deck deck = Deck.builder()
                    .name(importedDeckName)
                    .baseEnergy(baseEnergy)
                    .secondaryEnergy(secondaryEnergy)
                    .logoUrl(logoUrl)
                    .wins(0)
                    .losses(0)
                    .user(user)
                    .build();

            deck = deckRepository.save(deck);

            ImportCardStats cardStats = importCardInstances(deckMap, deck, user, zipReadResult.warnings);

            if (cardStats.importedTotalCardInstances == 0) {
                throw new IllegalArgumentException(
                        "Nie zaimportowano żadnej karty. Paczka może mieć niepoprawny deck.json albo brak danych kart."
                );
            }

            int importedImages = importImages(zipReadResult, zipReadResult.warnings);

            DeckDto importedDeckDto = userDeckService.getDeckDtoById(deck.getId(), user);

            return new OfflineDeckPackageImportResultDto(
                    true,
                    "Deck został zaimportowany jako: " + importedDeckName,
                    deck.getId(),
                    importedDeckName,
                    cardStats.importedUniqueCards,
                    cardStats.importedTotalCardInstances,
                    importedImages,
                    cardStats.skippedCards,
                    zipReadResult.warnings,
                    importedDeckDto
            );
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();

            return new OfflineDeckPackageImportResultDto(
                    false,
                    "Nie udało się zaimportować paczki: " + e.getMessage(),
                    null,
                    null,
                    0,
                    0,
                    0,
                    0,
                    List.of(),
                    null
            );
        }
    }

    private ImportCardStats importCardInstances(
            Map<String, Object> deckMap,
            Deck deck,
            User user,
            List<String> warnings
    ) {
        Object cardsObj = deckMap.get("cards");

        if (!(cardsObj instanceof List<?> cards)) {
            warnings.add("deck.json nie zawiera poprawnej listy cards.");
            return new ImportCardStats(0, 0, 0);
        }

        int importedUniqueCards = 0;
        int importedTotalCardInstances = 0;
        int skippedCards = 0;

        for (Object item : cards) {
            if (!(item instanceof Map<?, ?> deckCardMap)) {
                skippedCards++;
                continue;
            }

            int quantity = asInteger(deckCardMap.get("quantity")) != null
                    ? asInteger(deckCardMap.get("quantity"))
                    : 1;

            quantity = Math.max(1, quantity);

            String cardId = extractCardId(deckCardMap);

            if (cardId == null || cardId.isBlank()) {
                skippedCards++;
                warnings.add("Pominięto kartę bez ID.");
                continue;
            }

            Map<?, ?> cardMap = extractCardMap(deckCardMap);

            TcgCard card = findOrCreateCardFromPackage(cardId, cardMap, warnings);

            if (card == null) {
                skippedCards++;
                warnings.add("Nie udało się utworzyć ani odnaleźć karty: " + cardId);
                continue;
            }

            importedUniqueCards++;

            for (int i = 0; i < quantity; i++) {
                UserCardInstance instance = UserCardInstance.builder()
                        .user(user)
                        .card(card)
                        .deck(deck)
                        .build();

                userCardInstanceRepository.save(instance);
                importedTotalCardInstances++;
            }
        }

        return new ImportCardStats(
                importedUniqueCards,
                importedTotalCardInstances,
                skippedCards
        );
    }

    private String extractCardId(Map<?, ?> deckCardMap) {
        Object cardObj = deckCardMap.get("card");

        if (cardObj instanceof Map<?, ?> cardMap) {
            return asString(cardMap.get("id"));
        }

        return asString(deckCardMap.get("cardId"));
    }
    private Map<?, ?> extractCardMap(Map<?, ?> deckCardMap) {
        Object cardObj = deckCardMap.get("card");

        if (cardObj instanceof Map<?, ?> cardMap) {
            return cardMap;
        }

        return Map.of();
    }
    private TcgCard findOrCreateCardFromPackage(
            String cardId,
            Map<?, ?> cardMap,
            List<String> warnings
    ) {
        Optional<TcgCard> existingCard = tcgCardRepository.findById(cardId);

        if (existingCard.isPresent()) {
            return existingCard.get();
        }

        if (cardMap == null || cardMap.isEmpty()) {
            warnings.add("Brak danych karty w deck.json dla ID: " + cardId);
            return null;
        }

        try {
            CardSet cardSet = findOrCreateCardSetFromPackage(cardMap, warnings);

            TcgCard card = TcgCard.builder()
                    .id(cardId)
                    .name(asString(cardMap.get("name")))
                    .namePl(asString(cardMap.get("namePl")))
                    .supertype(asString(cardMap.get("supertype")))
                    .subtypes(asString(cardMap.get("subtypes")))
                    .stage(asString(cardMap.get("stage")))
                    .hp(asInteger(cardMap.get("hp")))
                    .type(asString(cardMap.get("type")))
                    .pokedexNumber(asInteger(cardMap.get("pokedexNumber")))
                    .set(cardSet)
                    .numberInSet(asString(cardMap.get("numberInSet")))
                    .rarity(asString(cardMap.get("rarity")))
                    .imageUrlSmall(asString(cardMap.get("imageUrlSmall")))
                    .imageUrlLarge(asString(cardMap.get("imageUrlLarge")))
                    .flavorText(asString(cardMap.get("flavorText")))
                    .flavorTextPl(asString(cardMap.get("flavorTextPl")))
                    .weakness(asString(cardMap.get("weakness")))
                    .resistance(asString(cardMap.get("resistance")))
                    .retreat(asInteger(cardMap.get("retreat")))
                    .overallRating(asInteger(cardMap.get("overallRating")))
                    .cardmarketUrl(asString(cardMap.get("cardmarketUrl")))
                    .cardmarketAvgSellPrice(asDouble(cardMap.get("cardmarketAvgSellPrice")))
                    .cardmarketLowPrice(asDouble(cardMap.get("cardmarketLowPrice")))
                    .build();

            card.setAttacks(buildAttacksFromPackage(cardMap, card, warnings));
            card.setAbilities(buildAbilitiesFromPackage(cardMap, card, warnings));
            card.setRules(buildRulesFromPackage(cardMap, card, warnings));

            TcgCard saved = tcgCardRepository.save(card);

            warnings.add("Dodano brakującą kartę do lokalnej bazy tcg_card: " + cardId);

            return saved;
        } catch (Exception e) {
            warnings.add("Nie udało się utworzyć karty " + cardId + ": " + e.getMessage());
            return null;
        }
    }
    private List<Attack> buildAttacksFromPackage(
            Map<?, ?> cardMap,
            TcgCard card,
            List<String> warnings
    ) {
        Object attacksObj = cardMap.get("attacks");

        if (!(attacksObj instanceof List<?> attacksList)) {
            return List.of();
        }

        List<Attack> attacks = new ArrayList<>();

        for (Object item : attacksList) {
            if (!(item instanceof Map<?, ?> attackMap)) {
                continue;
            }

            String name = asString(attackMap.get("name"));
            String namePl = asString(attackMap.get("namePl"));
            String cost = asString(attackMap.get("cost"));
            String damage = asString(attackMap.get("damage"));
            String description = asString(attackMap.get("description"));
            String descriptionPl = asString(attackMap.get("descriptionPl"));
            Boolean special = asBoolean(attackMap.get("special"));

            Integer rating = asInteger(attackMap.get("defRating"));

            AttackDef def = findOrCreateAttackDef(
                    name,
                    namePl,
                    cost,
                    damage,
                    description,
                    descriptionPl,
                    rating
            );

            Attack attack = Attack.builder()
                    .name(name)
                    .namePl(namePl)
                    .cost(cost)
                    .damage(damage)
                    .description(description)
                    .descriptionPl(descriptionPl)
                    .special(special != null ? special : false)
                    .card(card)
                    .def(def)
                    .build();

            attacks.add(attack);
        }

        if (!attacks.isEmpty()) {
            warnings.add("Zaimportowano ataki dla karty: " + card.getId() + " (" + attacks.size() + ")");
        }

        return attacks;
    }
    private List<Ability> buildAbilitiesFromPackage(
            Map<?, ?> cardMap,
            TcgCard card,
            List<String> warnings
    ) {
        Object abilitiesObj = cardMap.get("abilities");

        if (!(abilitiesObj instanceof List<?> abilitiesList)) {
            return List.of();
        }

        List<Ability> abilities = new ArrayList<>();

        for (Object item : abilitiesList) {
            if (!(item instanceof Map<?, ?> abilityMap)) {
                continue;
            }

            String name = asString(abilityMap.get("name"));
            String namePl = asString(abilityMap.get("namePl"));
            String description = asString(abilityMap.get("description"));
            String descriptionPl = asString(abilityMap.get("descriptionPl"));

            Integer rating = asInteger(abilityMap.get("rating"));

            AbilityDef def = findOrCreateAbilityDef(
                    name,
                    namePl,
                    description,
                    descriptionPl,
                    rating
            );

            Ability ability = Ability.builder()
                    .name(name)
                    .namePl(namePl)
                    .description(description)
                    .descriptionPl(descriptionPl)
                    .card(card)
                    .def(def)
                    .build();

            abilities.add(ability);
        }

        if (!abilities.isEmpty()) {
            warnings.add("Zaimportowano ability dla karty: " + card.getId() + " (" + abilities.size() + ")");
        }

        return abilities;
    }
    private List<TcgRule> buildRulesFromPackage(
            Map<?, ?> cardMap,
            TcgCard card,
            List<String> warnings
    ) {
        Object rulesObj = cardMap.get("rules");

        if (!(rulesObj instanceof List<?> rulesList)) {
            return List.of();
        }

        List<TcgRule> rules = new ArrayList<>();

        for (Object item : rulesList) {
            if (!(item instanceof Map<?, ?> ruleMap)) {
                continue;
            }

            String text = asString(ruleMap.get("text"));
            String textPl = asString(ruleMap.get("textPl"));

            if ((text == null || text.isBlank()) && (textPl == null || textPl.isBlank())) {
                continue;
            }

            Integer rating = asInteger(ruleMap.get("rating"));

            RuleDef def = findOrCreateRuleDef(text, textPl, rating);

            TcgRule rule = new TcgRule();
            rule.setText(text);
            rule.setTextPl(textPl);
            rule.setCard(card);
            rule.setDef(def);

            rules.add(rule);
        }

        if (!rules.isEmpty()) {
            warnings.add("Zaimportowano rules dla karty: " + card.getId() + " (" + rules.size() + ")");
        }

        return rules;
    }
    private AttackDef findOrCreateAttackDef(
            String name,
            String namePl,
            String cost,
            String damage,
            String description,
            String descriptionPl,
            Integer rating
    ) {
        String canonicalKey = canonicalKey(
                "attack",
                name,
                namePl,
                cost,
                damage,
                description,
                descriptionPl
        );

        return attackDefRepository.findByCanonicalKey(canonicalKey)
                .orElseGet(() -> {
                    AttackDef def = new AttackDef();
                    def.setName(firstText(name, namePl, "Unknown attack"));
                    def.setNamePl(namePl);
                    def.setDescription(description);
                    def.setDescriptionPl(descriptionPl);
                    def.setCanonicalKey(canonicalKey);
                    def.setDamageText(damage);
                    def.setRating(rating);

                    return attackDefRepository.save(def);
                });
    }
    private AbilityDef findOrCreateAbilityDef(
            String name,
            String namePl,
            String description,
            String descriptionPl,
            Integer rating
    ) {
        String canonicalKey = canonicalKey(
                "ability",
                name,
                namePl,
                description,
                descriptionPl
        );

        return abilityDefRepository.findByCanonicalKey(canonicalKey)
                .orElseGet(() -> {
                    AbilityDef def = new AbilityDef();
                    def.setName(firstText(name, namePl, "Unknown ability"));
                    def.setNamePl(namePl);
                    def.setDescription(description);
                    def.setDescriptionPl(descriptionPl);
                    def.setCanonicalKey(canonicalKey);
                    def.setRating(rating);

                    return abilityDefRepository.save(def);
                });
    }
    private RuleDef findOrCreateRuleDef(String text, String textPl, Integer rating) {
        String canonicalKey = canonicalKey(
                "rule",
                text,
                textPl
        );

        return ruleDefRepository.findByCanonicalKey(canonicalKey)
                .orElseGet(() -> {
                    RuleDef def = new RuleDef();
                    def.setName(firstText(text, textPl, "Rule"));
                    def.setNamePl(textPl);
                    def.setDescription(text);
                    def.setDescriptionPl(textPl);
                    def.setCanonicalKey(canonicalKey);
                    def.setRating(rating);

                    return ruleDefRepository.save(def);
                });
    }


    private CardSet findOrCreateCardSetFromPackage(
            Map<?, ?> cardMap,
            List<String> warnings
    ) {
        Object setObj = cardMap.get("set");

        if (!(setObj instanceof Map<?, ?> setMap)) {
            return null;
        }

        String setId = asString(setMap.get("id"));

        if (setId == null || setId.isBlank()) {
            return null;
        }

        Optional<CardSet> existingSet = cardSetRepository.findById(setId);

        if (existingSet.isPresent()) {
            return existingSet.get();
        }

        try {
            CardSet cardSet = CardSet.builder()
                    .id(setId)
                    .name(asString(setMap.get("name")))
                    .series(asString(setMap.get("series")))
                    .logoUrl(asString(setMap.get("logoUrl")))
                    .symbolUrl(asString(setMap.get("symbolUrl")))
                    .printedTotal(asInteger(setMap.get("printedTotal")))
                    .total(asInteger(setMap.get("total")))
                    .releaseDate(asLocalDate(setMap.get("releaseDate")))
                    .build();

            CardSet saved = cardSetRepository.save(cardSet);

            warnings.add("Dodano brakujący set do lokalnej bazy CardSet: " + setId);

            return saved;
        } catch (Exception e) {
            warnings.add("Nie udało się utworzyć setu karty: " + setId + " → " + e.getMessage());
            return null;
        }
    }

    private int importImages(ZipReadResult zipReadResult, List<String> warnings) {
        if (zipReadResult.imagesManifestBytes == null) {
            warnings.add("Brak images/images-manifest.json — obrazy nie zostały zaimportowane.");
            return 0;
        }

        try {
            List<Map<String, Object>> imagesManifest = readJsonList(zipReadResult.imagesManifestBytes);

            Map<String, ImageTarget> targetsByZipPath = new LinkedHashMap<>();

            for (Map<String, Object> entry : imagesManifest) {
                String cardId = asString(entry.get("cardId"));

                String smallPath = asString(entry.get("small"));
                String largePath = asString(entry.get("large"));

                if (cardId != null && smallPath != null) {
                    targetsByZipPath.put(normalizeEntryName(smallPath), new ImageTarget(cardId, "small"));
                }

                if (cardId != null && largePath != null) {
                    targetsByZipPath.put(normalizeEntryName(largePath), new ImageTarget(cardId, "large"));
                }
            }

            int importedImages = 0;

            for (Map.Entry<String, ImageTarget> entry : targetsByZipPath.entrySet()) {
                String zipPath = entry.getKey();
                ImageTarget imageTarget = entry.getValue();

                byte[] bytes = zipReadResult.imageBytesByEntryName.get(zipPath);

                if (bytes == null || bytes.length == 0) {
                    warnings.add("Brak obrazu w ZIP: " + zipPath);
                    continue;
                }

                try {
                    cardImageCacheService.saveImportedCardImage(
                            imageTarget.cardId,
                            imageTarget.size,
                            bytes
                    );

                    importedImages++;
                } catch (Exception e) {
                    warnings.add("Nie udało się zapisać obrazu " + zipPath + ": " + e.getMessage());
                }
            }

            return importedImages;
        } catch (Exception e) {
            warnings.add("Nie udało się zaimportować obrazów: " + e.getMessage());
            return 0;
        }
    }

    private ZipReadResult readZipPackage(MultipartFile file, boolean collectImageBytes) throws IOException {
        ZipReadResult result = new ZipReadResult();

        try (ZipInputStream zip = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;

            while ((entry = zip.getNextEntry()) != null) {
                try {
                    if (entry.isDirectory()) {
                        continue;
                    }

                    String entryName = normalizeEntryName(entry.getName());

                    if (isDangerousEntryName(entryName)) {
                        throw new IOException("Paczka ZIP zawiera niebezpieczną ścieżkę: " + entryName);
                    }

                    if ("manifest.json".equals(entryName)) {
                        result.manifestBytes = readEntryBytes(zip, MAX_JSON_BYTES);
                    } else if ("deck.json".equals(entryName)) {
                        result.deckBytes = readEntryBytes(zip, MAX_JSON_BYTES);
                    } else if ("images/images-manifest.json".equals(entryName)) {
                        result.imagesManifestBytes = readEntryBytes(zip, MAX_JSON_BYTES);
                    } else if (entryName.startsWith("images/cards/")) {
                        result.imageFiles.add(entryName);

                        if (collectImageBytes) {
                            result.imageBytesByEntryName.put(
                                    entryName,
                                    readEntryBytes(zip, MAX_IMAGE_BYTES)
                            );
                        } else {
                            drainEntry(zip);
                        }
                    } else {
                        drainEntry(zip);
                    }
                } finally {
                    zip.closeEntry();
                }
            }
        }

        return result;
    }

    private OfflineDeckPackagePreviewDto invalid(String message) {
        return new OfflineDeckPackagePreviewDto(
                false,
                message,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                0,
                0,
                0,
                0,
                0,
                0,
                List.of()
        );
    }

    private Map<String, Object> readJsonMap(byte[] bytes) throws IOException {
        return objectMapper.readValue(
                bytes,
                new TypeReference<>() {
                }
        );
    }

    private List<Map<String, Object>> readJsonList(byte[] bytes) throws IOException {
        return objectMapper.readValue(
                bytes,
                new TypeReference<>() {
                }
        );
    }

    private String normalizeEntryName(String name) {
        if (name == null) return "";
        return name.replace("\\", "/").replaceAll("^/+", "");
    }

    private boolean isDangerousEntryName(String name) {
        return name == null
                || name.isBlank()
                || name.contains("..")
                || name.startsWith("/")
                || name.matches("^[a-zA-Z]:.*");
    }

    private byte[] readEntryBytes(ZipInputStream zip, int maxBytes) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];

        int total = 0;
        int read;

        while ((read = zip.read(buffer)) != -1) {
            total += read;

            if (total > maxBytes) {
                throw new IOException("ZIP entry is too large");
            }

            out.write(buffer, 0, read);
        }

        return out.toByteArray();
    }

    private void drainEntry(ZipInputStream zip) throws IOException {
        byte[] buffer = new byte[8192];

        while (zip.read(buffer) != -1) {
            // tylko przewijamy entry
        }
    }

    private int calculateTotalCards(Map<String, Object> deck) {
        Object cardsObj = deck.get("cards");

        if (!(cardsObj instanceof List<?> cards)) {
            return 0;
        }

        int total = 0;

        for (Object item : cards) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }

            Object quantityObj = map.get("quantity");
            int quantity = asInteger(quantityObj) != null ? asInteger(quantityObj) : 1;

            total += Math.max(1, quantity);
        }

        return total;
    }

    private int calculateUniqueCards(Map<String, Object> deck) {
        Object cardsObj = deck.get("cards");

        if (!(cardsObj instanceof List<?> cards)) {
            return 0;
        }

        Set<String> ids = new LinkedHashSet<>();

        for (Object item : cards) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }

            String id = extractCardId(map);

            if (id != null && !id.isBlank()) {
                ids.add(id);
            }
        }

        return ids.size();
    }

    private ImageStats calculateImageStats(
            List<Map<String, Object>> imagesManifest,
            Set<String> imageFiles
    ) {
        int smallImages = 0;
        int largeImages = 0;
        int missingImages = 0;

        for (Map<String, Object> entry : imagesManifest) {
            String smallStatus = asString(entry.get("smallStatus"));
            String largeStatus = asString(entry.get("largeStatus"));

            if ("ok".equalsIgnoreCase(smallStatus)) {
                smallImages++;
            } else {
                missingImages++;
            }

            if ("ok".equalsIgnoreCase(largeStatus)) {
                largeImages++;
            } else {
                missingImages++;
            }
        }

        return new ImageStats(
                imageFiles.size(),
                smallImages,
                largeImages,
                missingImages
        );
    }

    private Object firstNonNull(Object a, Object b) {
        return a != null ? a : b;
    }

    private String asString(Object value) {
        if (value == null) return null;

        String text = String.valueOf(value);

        return text.isBlank() ? null : text;
    }

    private Integer asInteger(Object value) {
        if (value == null) return null;

        if (value instanceof Number number) {
            return number.intValue();
        }

        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long asLong(Object value) {
        if (value == null) return null;

        if (value instanceof Number number) {
            return number.longValue();
        }

        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
    private Double asDouble(Object value) {
        if (value == null) return null;

        if (value instanceof Number number) {
            return number.doubleValue();
        }

        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDate asLocalDate(Object value) {
        if (value == null) return null;

        String text = String.valueOf(value);

        if (text.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(text);
        } catch (Exception e) {
            return null;
        }
    }
    private Boolean asBoolean(Object value) {
        if (value == null) return null;

        if (value instanceof Boolean bool) {
            return bool;
        }

        String text = String.valueOf(value).trim().toLowerCase(Locale.ROOT);

        if ("true".equals(text)) return true;
        if ("false".equals(text)) return false;

        return null;
    }

    private String canonicalKey(String type, String... parts) {
        StringBuilder builder = new StringBuilder();

        builder.append(type == null ? "unknown" : type.trim().toLowerCase(Locale.ROOT));

        for (String part : parts) {
            builder.append("|");

            if (part == null) {
                builder.append("");
            } else {
                builder.append(part.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " "));
            }
        }

        String key = builder.toString();

        if (key.length() > 512) {
            return key.substring(0, 512);
        }

        return key;
    }

    private String firstText(String first, String second, String fallback) {
        if (first != null && !first.isBlank()) {
            return first;
        }

        if (second != null && !second.isBlank()) {
            return second;
        }

        return fallback;
    }

    private static class ZipReadResult {
        private byte[] manifestBytes;
        private byte[] deckBytes;
        private byte[] imagesManifestBytes;

        private final Set<String> imageFiles = new LinkedHashSet<>();
        private final Map<String, byte[]> imageBytesByEntryName = new LinkedHashMap<>();
        private final List<String> warnings = new ArrayList<>();
    }

    private record ImageStats(
            int imageFileCount,
            int smallImages,
            int largeImages,
            int missingImages
    ) {
    }

    private record ImageTarget(
            String cardId,
            String size
    ) {
    }

    private record ImportCardStats(
            int importedUniqueCards,
            int importedTotalCardInstances,
            int skippedCards
    ) {
    }
}