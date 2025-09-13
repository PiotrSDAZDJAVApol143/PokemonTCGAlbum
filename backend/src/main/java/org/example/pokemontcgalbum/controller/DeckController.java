package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.DeckCreateRequest;
import org.example.pokemontcgalbum.dto.DeckDto;
import org.example.pokemontcgalbum.dto.DeckUpdateRequest;
import org.example.pokemontcgalbum.mapper.DeckMapper;
import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.service.UserDeckService;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class DeckController {
    private final UserService userService;
    private final UserDeckService deckService;
    private final DeckMapper deckMapper;

    private User getUser(Authentication auth) {
        String username = auth.getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @GetMapping("/decks")
    public List<DeckDto> getMyDecks(Authentication auth) {
        User user = getUser(auth);
        return deckService.getDecksForUser(user).stream().map(deckMapper::toDto).toList();
    }
    @PostMapping("/decks/add")
    public DeckDto createDeck(Authentication auth, @RequestBody DeckCreateRequest req) {
        User user = getUser(auth);
        return deckMapper.toDto(deckService.createDeck(user, req));
    }

    @PutMapping("/decks/{deckId}")
    public DeckDto updateDeck(Authentication auth, @PathVariable Long deckId,
                              @RequestBody DeckUpdateRequest req) {
        User user = getUser(auth);
        return deckMapper.toDto(deckService.updateDeck(deckId, user, req));
    }

    @DeleteMapping("/decks/{deckId}")
    public void deleteDeck(Authentication auth, @PathVariable Long deckId) {
        User user = getUser(auth);
        deckService.deleteDeck(deckId, user);
    }

    @GetMapping("/decks/{deckId}")
    public DeckDto getDeck(Authentication auth, @PathVariable Long deckId) {
        User user = getUser(auth);
        return deckService.getDeckDtoById(deckId, user);
    }

}