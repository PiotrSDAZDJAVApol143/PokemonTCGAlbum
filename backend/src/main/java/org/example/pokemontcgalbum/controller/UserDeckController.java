package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.DeckCreateRequest;
import org.example.pokemontcgalbum.dto.DeckUpdateRequest;
import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.service.UserDeckService;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/user/{userId}/decks")
@RequiredArgsConstructor
public class UserDeckController {

    private final UserDeckService deckService;
    private final UserService userService;

    // Sprawdzaj czy userId z path == userId z tokena!
    private User getCurrentUserOrThrow(Long pathUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        // username z tokena
        String username = auth.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        // Porównanie ID
        if (!user.getId().equals(pathUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return user;
    }

    @GetMapping()
    public List<Deck> getUserDecks(@PathVariable Long userId, Authentication authentication) {
        // Sprawdź czy id usera z tokena = userId z URL
        String username = authentication.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!user.getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nie możesz podglądać cudzych decków!");
        }
        return deckService.getDecksForUser(user);
    }
    @PostMapping("/add")
    public Deck addDeckToUser(@PathVariable Long userId, @RequestBody DeckCreateRequest req) {
        User user = getCurrentUserOrThrow(userId);
        return deckService.createDeck(user, req);
    }
    @PutMapping("/{deckId}")
    public Deck updateDeck(@PathVariable Long userId, @PathVariable Long deckId, @RequestBody DeckUpdateRequest req) {
        User user = getCurrentUserOrThrow(userId);
        return deckService.updateDeck(deckId, user, req);
    }
    @DeleteMapping("/{deckId}")
    public void deleteDeck(@PathVariable Long userId, @PathVariable Long deckId) {
        User user = getCurrentUserOrThrow(userId);
        deckService.deleteDeck(deckId, user);
    }

    @GetMapping("/api/user/decks")
    public List<Deck> getMyDecks(Authentication auth) {
        String username = auth.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return deckService.getDecksForUser(user);
    }
}