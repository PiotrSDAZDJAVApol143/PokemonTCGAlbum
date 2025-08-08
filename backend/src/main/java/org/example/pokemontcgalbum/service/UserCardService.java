package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.*;
import org.example.pokemontcgalbum.mapper.CardSetMapper;
import org.example.pokemontcgalbum.mapper.UserCardInstanceMapper;
import org.example.pokemontcgalbum.mapper.UserCardMapper;
import org.example.pokemontcgalbum.model.*;
import org.example.pokemontcgalbum.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserCardService {
    private final UserCardRepository userCardRepo;
    private final UserCardInstanceRepository userCardInstanceRepo;
    private final TcgCardRepository cardRepo;
    private final UserCardMapper userCardMapper;
    private final UserCardInstanceMapper userCardInstanceMapper;
    private final UserRepository userRepo;
    private final DeckRepository deckRepo;
    @Autowired
    private CardSetMapper cardSetMapper;



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
        dto.setQuantity(instances.size()); // <--- liczba posiadanych egzemplarzy

        dto.setInstances(instances.stream().map(userCardInstanceMapper::toDto).toList());
        dto.setQuantity(instances.size());

        return dto;
    }
    public PageUserCardsDto searchUserCards(User user, int page, int size, String name, String setId) {
        // Pobierz wszystkie karty usera
        List<UserCard> all = userCardRepo.findByUser(user);
        List<UserCard> filtered = all;

        // 1. Najpierw filtruj po setId jeśli podany
        if (setId != null && !setId.isBlank()) {
            filtered = filtered.stream()
                    .filter(uc -> uc.getCard().getSet() != null && setId.equals(uc.getCard().getSet().getId()))
                    .collect(Collectors.toList());
        }

        // 2. Potem filtruj po nazwie lub numerze jeśli podane
        if (name != null && name.matches("\\d{1,3}/\\d{1,3}")) {
            String[] parts = name.split("/");
            String searchNum = normalizeNumber(parts[0]);
            String searchTotal = normalizeNumber(parts[1]);
            filtered = filtered.stream()
                    .filter(uc ->
                            searchNum.equals(normalizeNumber(uc.getCard().getNumberInSet())) &&
                                    uc.getCard().getSet() != null &&
                                    searchTotal.equals(normalizeNumber(String.valueOf(uc.getCard().getSet().getPrintedTotal())))
                    )
                    .collect(Collectors.toList());
        } else if (name != null && !name.isBlank()) {
            filtered = filtered.stream()
                    .filter(uc -> uc.getCard().getName().toLowerCase().contains(name.toLowerCase()))
                    .collect(Collectors.toList());
        }
        // 3. Jeśli nic nie podano, zostają karty z wybranego setu (lub wszystkie jeśli setId puste)

        // 4. Paginacja
        int start = page * size;
        int end = Math.min(start + size, filtered.size());
        List<UserCardDto> pageContent = filtered.subList(Math.min(start, filtered.size()), end)
                .stream().map(userCardMapper::toDto).collect(Collectors.toList());

        // 5. Statystyki
        int unique = filtered.size();
        int total = filtered.stream().mapToInt(UserCard::getQuantity).sum();
        int duplicates = filtered.stream()
                .mapToInt(uc -> Math.max(uc.getQuantity() - 1, 0))
                .sum();

        // 6. Zwróć DTO
        PageUserCardsDto dto = new PageUserCardsDto();
        dto.setContent(pageContent);
        dto.setTotalPages((int) Math.ceil((double) filtered.size() / size));
        dto.setTotalElements(filtered.size());
        dto.setUnique(unique);
        dto.setTotal(total);
        dto.setDuplicates(duplicates);

        return dto;
    }
    public List<CardSetDto> findSetsForUser(User user) {
        List<CardSet> sets = userCardRepo.findDistinctSetsByUser(user);
        return sets.stream().map(cardSetMapper::toDto).toList();
    }
    public List<UserSetProgressDto> findSetsForUserWithProgress(User user) {
        // Wszystkie UserCardy usera
        List<UserCard> userCards = userCardRepo.findByUser(user);

        // Grupuj po CardSet.id
        Map<String, List<UserCard>> bySet = userCards.stream()
                .filter(uc -> uc.getCard().getSet() != null)
                .collect(Collectors.groupingBy(uc -> uc.getCard().getSet().getId()));

        // Stwórz DTO dla każdego setu
        List<UserSetProgressDto> list = new ArrayList<>();
        for (Map.Entry<String, List<UserCard>> entry : bySet.entrySet()) {
            CardSet set = entry.getValue().get(0).getCard().getSet(); // każdy UserCard w tej liście ma ten sam set
            UserSetProgressDto dto = new UserSetProgressDto();
            dto.setId(set.getId());
            dto.setName(set.getName());
            dto.setSeries(set.getSeries());
            dto.setLogoUrl(set.getLogoUrl());
            dto.setUnlocked(entry.getValue().size()); // unikalne UserCardy = ile różnych kart usera w secie
            dto.setTotal(set.getTotal() != null ? set.getTotal() : 0); // tu użyj właściwego pola z CardSet, NIE printedTotal!
            list.add(dto);
        }
        return list;
    }

    public void addCardToUser(User user, String cardId, int quantity) {
        TcgCard card = cardRepo.findById(cardId).orElseThrow();
        UserCard uc = userCardRepo.findByUserAndCard(user, card).orElse(null);
        if (uc == null && quantity > 0) {
            uc = new UserCard();
            uc.setUser(user);
            uc.setCard(card);
            uc.setQuantity(quantity);
            userCardRepo.save(uc);
        } else if (uc != null) {
            int newQty = uc.getQuantity() + quantity;
            if (newQty > 0) {
                uc.setQuantity(newQty);
                userCardRepo.save(uc);
            } else {
                // Usuń kartę z kolekcji użytkownika, bo już nie ma żadnej
                userCardRepo.delete(uc);
            }
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

    public void addCardInstance(User user, String cardId) {
        TcgCard card = cardRepo.findById(cardId).orElseThrow(() -> new RuntimeException("Card not found"));
        UserCardInstance inst = new UserCardInstance();
        inst.setUser(user);
        inst.setCard(card);
        inst.setDeck(null); // nieprzypisana
        userCardInstanceRepo.save(inst);
    }

    public void removeCardInstance(User user, Long instanceId) {
        UserCardInstance inst = userCardInstanceRepo.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Instance not found"));
        if (!inst.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Nie jesteś właścicielem tej karty!");
        userCardInstanceRepo.delete(inst);
    }

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



}
