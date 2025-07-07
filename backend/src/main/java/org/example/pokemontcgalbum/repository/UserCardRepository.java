package org.example.pokemontcgalbum.repository;


import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.model.UserCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserCardRepository extends JpaRepository<UserCard, String> {
    List<UserCard> findByUser(User user);
    Optional<UserCard> findByUserAndCard(User user, TcgCard card);
}
