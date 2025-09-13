package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.model.UserCardInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserCardInstanceRepository extends JpaRepository<UserCardInstance, Long> {
    List<UserCardInstance> findAllByUserAndCard(User user, TcgCard card);
    List<UserCardInstance> findByUserAndCardId(User user, String cardId);
    List<UserCardInstance> findByUserAndDeck(User user, Deck deck);
    List<UserCardInstance> findAllByUser(User user);
    long countByUserAndCard(User user, TcgCard card);
    List<UserCardInstance> findAllByDeck(Deck deck);
    long countByDeckAndCard(Deck deck, TcgCard card);

    @Query("SELECT DISTINCT c.pokedexNumber FROM UserCardInstance uci " +
            "JOIN uci.card c " +
            "WHERE uci.user = :user AND c.pokedexNumber IS NOT NULL")
    List<Integer> findOwnedPokedexNumbersByUser(User user);
}
