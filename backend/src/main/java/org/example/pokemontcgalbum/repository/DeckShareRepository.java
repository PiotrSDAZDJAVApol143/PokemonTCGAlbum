package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.DeckShare;
import org.example.pokemontcgalbum.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeckShareRepository extends JpaRepository<DeckShare, Long> {
    List<DeckShare> findByTargetUser(User targetUser);
    Optional<DeckShare> findByDeckIdAndTargetUserId(Long deckId, Long targetUserId);
    boolean existsByDeckIdAndTargetUserId(Long deckId, Long targetUserId);
}