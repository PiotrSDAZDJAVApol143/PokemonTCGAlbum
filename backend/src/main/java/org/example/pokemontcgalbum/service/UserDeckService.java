package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.DeckCreateRequest;
import org.example.pokemontcgalbum.dto.DeckDto;
import org.example.pokemontcgalbum.dto.DeckUpdateRequest;
import org.example.pokemontcgalbum.dto.ShareDeckRequest;
import org.example.pokemontcgalbum.mapper.DeckMapper;
import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.DeckShare;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.repository.DeckRepository;
import org.example.pokemontcgalbum.repository.DeckShareRepository;
import org.example.pokemontcgalbum.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final DeckShareRepository deckShareRepository;
    private final DeckMapper deckMapper;

    public Deck createDeck(User user, DeckCreateRequest req) {
        System.out.println("Tworzenie decka dla usera: " + user.getId() + " - " + req.getName());

        Deck deck = Deck.builder()
                .name(req.getName())
                .baseEnergy(req.getBaseEnergy())
                .secondaryEnergy(req.getSecondaryEnergy())
                .logoUrl(req.getLogoUrl())
                .wins(0)
                .losses(0)
                .user(user)
                .build();

        return deckRepository.save(deck);
    }

    public List<Deck> getDecksForUser(User user) {
        return deckRepository.findByUser(user);
    }

    /**
     * DTO dla decka należącego do właściciela.
     */
    public DeckDto toOwnedDto(Deck deck) {
        DeckDto dto = deckMapper.toDto(deck);

        dto.setShared(false);
        dto.setReadOnly(false);
        dto.setOwnerUserId(deck.getUser() != null ? deck.getUser().getId() : null);
        dto.setOwnerUsername(deck.getUser() != null ? deck.getUser().getUsername() : null);

        if (dto.getWins() == null) dto.setWins(0);
        if (dto.getLosses() == null) dto.setLosses(0);

        return dto;
    }

    /**
     * DTO dla decka współdzielonego (widmowego / read-only).
     * Karty i dane decka bierzemy z decka właściciela,
     * ale wins/losses są z tabeli deck_share dla odbiorcy.
     */
    public DeckDto toSharedDto(DeckShare share) {
        Deck deck = share.getDeck();

        DeckDto dto = deckMapper.toDto(deck);

        dto.setShared(true);
        dto.setReadOnly(share.isReadOnly());
        dto.setOwnerUserId(deck.getUser() != null ? deck.getUser().getId() : null);
        dto.setOwnerUsername(deck.getUser() != null ? deck.getUser().getUsername() : null);

        dto.setWins(share.getWins());
        dto.setLosses(share.getLosses());

        return dto;
    }

    /**
     * Zwraca wszystkie decki dostępne dla usera:
     * - własne decki
     * - decki współdzielone przez innych
     */
    public List<DeckDto> getAccessibleDecksForUser(User user) {
        List<DeckDto> result = new ArrayList<>();

        List<Deck> ownDecks = deckRepository.findByUser(user);
        for (Deck deck : ownDecks) {
            result.add(toOwnedDto(deck));
        }

        List<DeckShare> sharedDecks = deckShareRepository.findByTargetUser(user);
        for (DeckShare share : sharedDecks) {
            result.add(toSharedDto(share));
        }

        return result;
    }

    public void deleteDeck(Long id, User user) {
        Deck deck = getOwnedDeckById(id, user);
        deckRepository.delete(deck);
    }

    @Transactional
    public Deck updateDeck(Long id, User user, DeckUpdateRequest req) {
        Deck deck = getOwnedDeckById(id, user);

        deck.setName(req.getName());
        deck.setBaseEnergy(req.getBaseEnergy());
        deck.setSecondaryEnergy(req.getSecondaryEnergy());
        deck.setLogoUrl(req.getLogoUrl());

        return deck;
    }

    /**
     * Zostawiam tę metodę dla zgodności z Twoim starym kodem,
     * ale semantycznie oznacza teraz: pobierz deck właściciela.
     */
    public Deck getDeckById(Long id, User user) {
        return getOwnedDeckById(id, user);
    }

    /**
     * Pobiera deck tylko jeśli zalogowany user jest właścicielem.
     * Używaj tej metody wszędzie tam, gdzie deck ma być edytowany.
     */
    public Deck getOwnedDeckById(Long id, User user) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        if (deck.getUser() == null || !deck.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Forbidden");
        }

        return deck;
    }

    /**
     * Zwraca DTO decka:
     * - owner dostaje normalny deck
     * - user współdzielony dostaje widmowy/shared dto
     */
    public DeckDto getDeckDtoById(Long id, User user) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        // właściciel
        if (deck.getUser() != null && deck.getUser().getId().equals(user.getId())) {
            return toOwnedDto(deck);
        }

        // współdzielony
        DeckShare share = deckShareRepository.findByDeckIdAndTargetUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Forbidden"));

        return toSharedDto(share);
    }

    @Transactional
    public Deck resetScore(Long deckId, User user) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        // owner resetuje swoje statystyki
        if (deck.getUser() != null && deck.getUser().getId().equals(user.getId())) {
            deck.setWins(0);
            deck.setLosses(0);
            return deck;
        }

        // user współdzielony resetuje swoje własne statystyki z deck_share
        DeckShare share = deckShareRepository.findByDeckIdAndTargetUserId(deckId, user.getId())
                .orElseThrow(() -> new RuntimeException("Forbidden"));

        share.setWins(0);
        share.setLosses(0);
        return share.getDeck();
    }

    @Transactional
    public Deck registerWin(Long deckId, User user) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        if (deck.getUser() != null && deck.getUser().getId().equals(user.getId())) {
            deck.setWins(deck.getWins() + 1);
            return deck;
        }

        DeckShare share = deckShareRepository.findByDeckIdAndTargetUserId(deckId, user.getId())
                .orElseThrow(() -> new RuntimeException("Forbidden"));

        share.setWins(share.getWins() + 1);
        return share.getDeck();
    }

    @Transactional
    public Deck registerLoss(Long deckId, User user) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        if (deck.getUser() != null && deck.getUser().getId().equals(user.getId())) {
            deck.setLosses(deck.getLosses() + 1);
            return deck;
        }

        DeckShare share = deckShareRepository.findByDeckIdAndTargetUserId(deckId, user.getId())
                .orElseThrow(() -> new RuntimeException("Forbidden"));

        share.setLosses(share.getLosses() + 1);
        return share.getDeck();
    }

    @Transactional
    public void shareDeck(Long deckId, User owner, ShareDeckRequest req) {
        if (req == null || req.getTargetUsername() == null || req.getTargetUsername().trim().isEmpty()) {
            throw new RuntimeException("Target username is required");
        }

        Deck deck = getOwnedDeckById(deckId, owner);

        User targetUser = userRepository.findByUsername(req.getTargetUsername().trim())
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (targetUser.getId().equals(owner.getId())) {
            throw new RuntimeException("Nie możesz udostępnić decka samemu sobie");
        }

        boolean exists = deckShareRepository.existsByDeckIdAndTargetUserId(deckId, targetUser.getId());
        if (exists) {
            return;
        }

        DeckShare share = DeckShare.builder()
                .deck(deck)
                .targetUser(targetUser)
                .readOnly(true)
                .wins(0)
                .losses(0)
                .build();

        deckShareRepository.save(share);
    }
}