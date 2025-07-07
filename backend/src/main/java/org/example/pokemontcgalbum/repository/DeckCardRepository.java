package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.DeckCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeckCardRepository extends JpaRepository<DeckCard, String> {
    List<DeckCard> findByDeck(Deck deck);
}
