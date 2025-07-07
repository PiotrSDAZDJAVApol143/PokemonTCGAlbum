package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.UserCardDetailsDto;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.service.UserCardService;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-cards")
@RequiredArgsConstructor
public class UserCardController {
    private final UserCardService userCardService;
    private final UserService userService; // Dodaj jeśli masz

    @GetMapping("/details/{cardId}")
    public UserCardDetailsDto getCardDetailsForUser(@PathVariable String cardId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        return userCardService.getCardDetailsForUser(cardId, user);
    }
}