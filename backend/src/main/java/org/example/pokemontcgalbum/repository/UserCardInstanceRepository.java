package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.model.UserCardInstance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCardInstanceRepository extends JpaRepository<UserCardInstance, Long> {
    List<UserCardInstance> findAllByUserAndCard(User user, TcgCard card);
    List<UserCardInstance> findByUserAndCardId(User user, String cardId);
    List<UserCardInstance> findByUserAndDeck(User user, Deck deck);
    List<UserCardInstance> findByUser(User user);
}
