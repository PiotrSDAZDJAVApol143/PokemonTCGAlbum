package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.security.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    void deleteByUser(User user);
}
