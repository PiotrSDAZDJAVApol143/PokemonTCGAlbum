package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.DeckCreateRequest;
import org.example.pokemontcgalbum.dto.DeckUpdateRequest;
import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.repository.DeckRepository;
import org.example.pokemontcgalbum.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserDeckService {
    private final DeckRepository deckRepository;
    private final UserRepository userRepository;

    public Deck createDeck(User user, DeckCreateRequest req) {
        System.out.println("Tworzenie decka dla usera: " + user.getId() + " - " + req.getName());
        Deck deck = Deck.builder()
                .name(req.getName())
                .baseEnergy(req.getBaseEnergy())
                .secondaryEnergy(req.getSecondaryEnergy())
                .logoUrl(req.getLogoUrl())
                .user(user)
                .build();
        return deckRepository.save(deck);
    }

    public List<Deck> getDecksForUser(User user) {
        return deckRepository.findByUser(user);
    }

    public void deleteDeck(Long id, User user) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));
        if (!deck.getUser().getId().equals(user.getId())) throw new RuntimeException("Forbidden");
        deckRepository.delete(deck);
    }

    @Transactional
    public Deck updateDeck(Long id, User user, DeckUpdateRequest req) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));
        if (!deck.getUser().getId().equals(user.getId())) throw new RuntimeException("Forbidden");
        deck.setName(req.getName());
        deck.setBaseEnergy(req.getBaseEnergy());
        deck.setSecondaryEnergy(req.getSecondaryEnergy());
        return deck;
    }

    public Deck getDeckById(Long id, User user) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));
        if (!deck.getUser().getId().equals(user.getId())) throw new RuntimeException("Forbidden");
        return deck;
    }

}