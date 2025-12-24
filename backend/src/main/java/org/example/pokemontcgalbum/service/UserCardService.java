package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.*;
import org.example.pokemontcgalbum.mapper.CardSetMapper;
import org.example.pokemontcgalbum.mapper.UserCardInstanceListToUserCardDtoMapper;
import org.example.pokemontcgalbum.mapper.UserCardInstanceMapper;
import org.example.pokemontcgalbum.model.*;
import org.example.pokemontcgalbum.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserCardService {
    private final UserCardInstanceRepository userCardInstanceRepo;
    private final TcgCardRepository cardRepo;
    private final UserCardInstanceListToUserCardDtoMapper userCardDtoMapper;
    private final UserCardInstanceMapper userCardInstanceMapper;
    private final DeckRepository deckRepo;
    @Autowired
    private CardSetMapper cardSetMapper;



    // Szczegóły danej karty użytkownika
    public UserCardDetailsDto getCardDetailsForUser(String cardId, User user) {
        TcgCard card = cardRepo.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        List<UserCardInstance> instances = userCardInstanceRepo.findAllByUserAndCard(user, card);

        UserCardDetailsDto dto = new UserCardDetailsDto();
        dto.setCardId(card.getId());
        dto.setCardName(card.getName());
        dto.setImageUrlLarge(card.getImageUrlLarge());
        dto.setFlavorText(card.getFlavorText());
        dto.setFlavorTextPl(card.getFlavorTextPl());
        dto.setInstances(instances.stream().map(userCardInstanceMapper::toDto).toList());
        dto.setQuantity(instances.size());

        // Zbierz listę talii, w których występuje jakikolwiek egzemplarz tej karty
        List<String> deckNames = instances.stream()
                .filter(inst -> inst.getDeck() != null)
                .map(inst -> inst.getDeck().getName())
                .distinct()
                .toList();
        dto.setDeckNames(deckNames);

        // KONKRETNE MAPOWANIE: Attack → AttackDto
        dto.setAttacks(card.getAttacks() != null
                ? card.getAttacks().stream().map(attack -> {
            AttackDto a = new AttackDto();
            a.setId(attack.getId());
            a.setName(attack.getName());
            a.setNamePl(attack.getNamePl());
            a.setCost(attack.getCost());
            a.setDamage(attack.getDamage());
            a.setDescription(attack.getDescription());
            a.setDescriptionPl(attack.getDescriptionPl());
            a.setSpecial(attack.getSpecial());
            Long defId = (attack.getDef() != null ? attack.getDef().getId() : null);
            Integer defRating = (attack.getDef() != null ? attack.getDef().getRating() : null);
            a.setDefId(defId);
            a.setDefRating(defRating);
            return a;
        }).toList() : null);

        // KONKRETNE MAPOWANIE: Ability → AbilityDto
        dto.setAbilities(card.getAbilities() != null
                ? card.getAbilities().stream().map(ability -> {
            AbilityDto ab = new AbilityDto();
            ab.setId(ability.getId());
            ab.setDefId(ability.getDef() != null ? ability.getDef().getId() : null);
            ab.setName(ability.getName());
            ab.setNamePl(ability.getNamePl());
            ab.setDescription(ability.getDescription());
            ab.setDescriptionPl(ability.getDescriptionPl());
            ab.setRating(ability.getDef() != null ? ability.getDef().getRating() : null);
            return ab;
        }).toList() : null);

        return dto;
    }

    private long newestInstanceId(List<UserCardInstance> list) {
        return list.stream()
                .mapToLong(inst -> inst.getId() != null ? inst.getId() : 0L)
                .max()
                .orElse(0L);
    }
    // Przeszukiwanie kolekcji użytkownika (paging + filtr)
    public PageUserCardsDto searchUserCards(User user, int page, int size, String name, String setId, String sort, String show) {
        List<UserCardInstance> all = userCardInstanceRepo.findAllByUser(user);

        // Filtrowanie po setId, po nazwie
        List<UserCardInstance> filtered = all.stream()
                .filter(inst -> setId == null || setId.isBlank() || (inst.getCard().getSet() != null && setId.equals(inst.getCard().getSet().getId())))
                .filter(inst -> name == null || name.isBlank() || inst.getCard().getName().toLowerCase().contains(name.toLowerCase()))
                .toList();

        // Grupowanie po karcie
        Map<TcgCard, List<UserCardInstance>> grouped = filtered.stream()
                .collect(Collectors.groupingBy(UserCardInstance::getCard));

        // filtr WYŚWIETL
        String showNorm = (show == null ? "all" : show).toLowerCase();
        if (!"all".equals(showNorm)) {
            grouped.entrySet().removeIf(entry -> {
                List<UserCardInstance> list = entry.getValue();
                boolean anyAssigned = list.stream().anyMatch(i -> i.getDeck() != null);
                boolean anyFree     = list.stream().anyMatch(i -> i.getDeck() == null);

                return switch (showNorm) {
                    case "assigned"    -> !anyAssigned;   // usuń jeśli żadna nie jest przydzielona
                    case "unassigned"  -> !anyFree;       // usuń jeśli nie ma wolnej
                    default -> false;
                };
            });
        }
        // Tworzenie paginacji po unikalnych kartach (nie po instancjach!)
        List<Map.Entry<TcgCard, List<UserCardInstance>>> entries = new ArrayList<>(grouped.entrySet());

        Comparator<Map.Entry<TcgCard, List<UserCardInstance>>> byRecent =
                Comparator.comparingLong((Map.Entry<TcgCard, List<UserCardInstance>> e) ->
                        newestInstanceId(e.getValue())
                ).reversed();

        Comparator<Map.Entry<TcgCard, List<UserCardInstance>>> byOldest = byRecent.reversed();

        Comparator<Map.Entry<TcgCard, List<UserCardInstance>>> byNameAZ =
                Comparator.comparing((Map.Entry<TcgCard, List<UserCardInstance>> e) ->
                        e.getKey().getName(), String.CASE_INSENSITIVE_ORDER);

        Comparator<Map.Entry<TcgCard, List<UserCardInstance>>> byNameZA = byNameAZ.reversed();

        Comparator<Map.Entry<TcgCard, List<UserCardInstance>>> byPokedex =
                Comparator
                        .comparingInt((Map.Entry<TcgCard, List<UserCardInstance>> e) ->
                                e.getKey().getPokedexNumber() != null ? e.getKey().getPokedexNumber() : Integer.MAX_VALUE)
                        // przy tym samym pokedex: nowszy set pierwszy
                        .thenComparing((Map.Entry<TcgCard, List<UserCardInstance>> e) ->
                                        e.getKey().getSet() != null && e.getKey().getSet().getReleaseDate() != null
                                                ? e.getKey().getSet().getReleaseDate()
                                                : java.time.LocalDate.MIN,
                                Comparator.reverseOrder())
                        .thenComparing(e -> e.getKey().getName(), String.CASE_INSENSITIVE_ORDER);

        Comparator<Map.Entry<TcgCard, List<UserCardInstance>>> byPowerDesc =
                Comparator
                        // null → najmniej
                        .comparingInt((Map.Entry<TcgCard, List<UserCardInstance>> e) ->
                                e.getKey().getOverallRating() != null ? e.getKey().getOverallRating() : Integer.MIN_VALUE)
                        .reversed()
                        // sensowne tie-breakery:
                        .thenComparing((Map.Entry<TcgCard, List<UserCardInstance>> e) ->
                                        e.getKey().getSet() != null && e.getKey().getSet().getReleaseDate() != null
                                                ? e.getKey().getSet().getReleaseDate()
                                                : java.time.LocalDate.MIN,
                                Comparator.reverseOrder())
                        .thenComparing(e -> e.getKey().getName(), String.CASE_INSENSITIVE_ORDER);

        switch ((sort == null ? "recent" : sort).toLowerCase()) {
            case "oldest"  -> entries.sort(byOldest);
            case "name_az" -> entries.sort(byNameAZ);
            case "name_za" -> entries.sort(byNameZA);
            case "pokedex" -> entries.sort(byPokedex);
            case "overallrating" -> entries.sort(byPowerDesc);
            default        -> entries.sort(byRecent); // recent
        }
        // ------- /KOMPARATORY -------

        int totalUnique = entries.size();
        int totalInstances = filtered.size();
        int duplicates = totalInstances - totalUnique;

        int start = page * size;
        int end = Math.min(start + size, totalUnique);

        List<UserCardDto> content = entries
                .subList(Math.min(start, totalUnique), end).stream()
                .map(e -> userCardDtoMapper.toDto(e.getKey(), e.getValue()))
                .toList();

        PageUserCardsDto dto = new PageUserCardsDto();
        dto.setContent(content);
        dto.setTotalPages((int) Math.ceil((double) totalUnique / size));
        dto.setTotalElements(totalUnique);
        dto.setUnique(totalUnique);
        dto.setTotal(totalInstances);
        dto.setDuplicates(duplicates);
        return dto;
    }
    // Kolekcja zestawów użytkownika
    public List<CardSetDto> findSetsForUser(User user) {
        List<UserCardInstance> all = userCardInstanceRepo.findAllByUser(user);
        return all.stream()
                .map(inst -> inst.getCard().getSet())
                .filter(set -> set != null)
                .distinct()
                .map(cardSetMapper::toDto)
                .toList();
    }
    // Progres użytkownika w setach (unikalne karty per set)
    public List<UserSetProgressDto> findSetsForUserWithProgress(User user) {
        List<UserCardInstance> all = userCardInstanceRepo.findAllByUser(user);

        // Grupuj po secie
        Map<CardSet, List<UserCardInstance>> bySet = all.stream()
                .filter(inst -> inst.getCard().getSet() != null)
                .collect(Collectors.groupingBy(inst -> inst.getCard().getSet()));

        List<UserSetProgressDto> list = new ArrayList<>();
        for (Map.Entry<CardSet, List<UserCardInstance>> entry : bySet.entrySet()) {
            CardSet set = entry.getKey();
            // Ile różnych kart w tym secie?
            long unlocked = entry.getValue().stream().map(inst -> inst.getCard().getId()).distinct().count();

            UserSetProgressDto dto = new UserSetProgressDto();
            dto.setId(set.getId());
            dto.setName(set.getName());
            dto.setSeries(set.getSeries());
            dto.setLogoUrl(set.getLogoUrl());
            dto.setUnlocked((int) unlocked);
            dto.setTotal(set.getTotal() != null ? set.getTotal() : 0);
            dto.setReleaseDate(set.getReleaseDate() != null ? set.getReleaseDate().toString() : null);
            list.add(dto);
        }
        list.sort((a,b) -> {
            if (a.getReleaseDate() == null && b.getReleaseDate() == null) return 0;
            if (a.getReleaseDate() == null) return 1;
            if (b.getReleaseDate() == null) return -1;
            return b.getReleaseDate().compareTo(a.getReleaseDate());
        });
        return list;
    }

    // Dodanie n egzemplarzy danej karty
    public void addCardInstances(User user, String cardId, int quantity) {
        TcgCard card = cardRepo.findById(cardId).orElseThrow();
        for (int i = 0; i < quantity; i++) {
            UserCardInstance inst = new UserCardInstance();
            inst.setUser(user);
            inst.setCard(card);
            inst.setDeck(null);
            userCardInstanceRepo.save(inst);
        }
    }
    private String normalizeNumber(String number) {
        if (number == null) return null;
        try {
            return String.valueOf(Integer.parseInt(number.replaceFirst("^0+(?!$)", "")));
        } catch (NumberFormatException e) {
            return number;
        }
    }

    // Usunięcie konkretnej instancji
    public void removeCardInstance(User user, Long instanceId) {
        UserCardInstance inst = userCardInstanceRepo.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Instance not found"));
        if (!inst.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Nie jesteś właścicielem tej karty!");
        userCardInstanceRepo.delete(inst);
    }

    // Usuwanie X instancji (np. 3x Pikachu)
    public void removeCardInstances(User user, String cardId, int quantity) {
        TcgCard card = cardRepo.findById(cardId).orElseThrow();
        List<UserCardInstance> insts = userCardInstanceRepo.findAllByUserAndCard(user, card);
        for (int i = 0; i < quantity && i < insts.size(); i++) {
            userCardInstanceRepo.delete(insts.get(i));
        }
    }

    // Przypisanie instancji do decka
    public void assignInstanceToDeck(User user, Long instanceId, Long deckId) {
        UserCardInstance inst = userCardInstanceRepo.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Instance not found"));
        if (!inst.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Nie jesteś właścicielem tej karty!");
        Deck deck = deckRepo.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found"));
        inst.setDeck(deck);
        userCardInstanceRepo.save(inst);
    }

    public void removeInstanceFromDeck(User user, Long instanceId) {
        UserCardInstance inst = userCardInstanceRepo.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Instance not found"));
        if (!inst.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Nie jesteś właścicielem tej karty!");
        inst.setDeck(null);
        userCardInstanceRepo.save(inst);
    }

    public List<UserCardDto> findUserCardsByPokedex(User user, int dex) {
        // wszystkie instancje usera
        List<UserCardInstance> all = userCardInstanceRepo.findAllByUser(user);

        // tylko te z żądanym numerem pokedex
        List<UserCardInstance> filtered = all.stream()
                .filter(uci -> uci.getCard() != null
                        && uci.getCard().getPokedexNumber() != null
                        && uci.getCard().getPokedexNumber() == dex)
                .toList();

        // grupuj po karcie (unikalne karty)
        Map<TcgCard, List<UserCardInstance>> grouped = filtered.stream()
                .collect(Collectors.groupingBy(UserCardInstance::getCard));

        // zamapuj na UserCardDto (masz już mapper łączący listę instancji)
        return grouped.entrySet().stream()
                // opcjonalnie posortuj: nowsze instancje/alfabetycznie/etc.
                .sorted(Comparator.comparing(e -> e.getKey().getName(), String.CASE_INSENSITIVE_ORDER))
                .map(e -> userCardDtoMapper.toDto(e.getKey(), e.getValue()))
                .toList();
    }

}



