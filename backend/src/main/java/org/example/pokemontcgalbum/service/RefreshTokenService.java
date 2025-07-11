package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.repository.RefreshTokenRepository;
import org.example.pokemontcgalbum.security.RefreshToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private static final long REFRESH_TOKEN_DURATION_DAYS = 7;
    public RefreshToken createRefreshToken(User user) {
        // Przy logowaniu wyczyść stare tokeny usera (opcjonalnie)
        refreshTokenRepository.deleteByUser(user);
        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(LocalDateTime.now().plusDays(REFRESH_TOKEN_DURATION_DAYS))
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public boolean isValid(RefreshToken token) {
        return token != null && token.getExpiryDate().isAfter(LocalDateTime.now());
    }

    public void delete(RefreshToken token) {
        refreshTokenRepository.delete(token);
    }
}
