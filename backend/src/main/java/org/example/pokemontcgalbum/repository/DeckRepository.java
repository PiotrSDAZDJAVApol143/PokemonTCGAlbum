package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeckRepository extends JpaRepository<Deck, String> {
    List<Deck> findByUser(User user);
}
