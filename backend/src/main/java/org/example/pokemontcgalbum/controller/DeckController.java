package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.DeckCreateRequest;
import org.example.pokemontcgalbum.dto.DeckDto;
import org.example.pokemontcgalbum.dto.DeckUpdateRequest;
import org.example.pokemontcgalbum.dto.ShareDeckRequest;
import org.example.pokemontcgalbum.mapper.DeckMapper;
import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.service.UserDeckService;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.example.pokemontcgalbum.service.DeckOfflinePackageService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class DeckController {
    private final UserService userService;
    private final UserDeckService deckService;
    private final DeckOfflinePackageService deckOfflinePackageService;

    private User getUser(Authentication auth) {
        String username = auth.getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @GetMapping("/decks")
    public List<DeckDto> getMyDecks(Authentication auth) {
        User user = getUser(auth);
        return deckService.getAccessibleDecksForUser(user);
    }

    @PostMapping("/decks/add")
    public DeckDto createDeck(Authentication auth, @RequestBody DeckCreateRequest req) {
        User user = getUser(auth);
        Deck deck = deckService.createDeck(user, req);
        return deckService.toOwnedDto(deck);
    }

    @PutMapping("/decks/{deckId}")
    public DeckDto updateDeck(Authentication auth, @PathVariable Long deckId,
                              @RequestBody DeckUpdateRequest req) {
        User user = getUser(auth);
        Deck updated = deckService.updateDeck(deckId, user, req);
        return deckService.toOwnedDto(updated);
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
    @GetMapping("/decks/{deckId}/offline-package")
    public ResponseEntity<byte[]> downloadDeckOfflinePackage(
            Authentication auth,
            @PathVariable Long deckId
    ) {
        User user = getUser(auth);

        DeckDto deckDto = deckService.getDeckDtoById(deckId, user);

        byte[] zipBytes = deckOfflinePackageService.buildDeckOfflinePackage(deckId, user);

        String safeDeckName = deckDto.getName() == null
                ? "deck"
                : deckDto.getName().replaceAll("[^a-zA-Z0-9._-]", "_");

        String filename = "deck-" + deckId + "-" + safeDeckName + "-offline.zip";

        ContentDisposition contentDisposition = ContentDisposition
                .attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(zipBytes);
    }

    @PostMapping("/decks/{deckId}/share")
    public void shareDeck(Authentication auth, @PathVariable Long deckId, @RequestBody ShareDeckRequest req) {
        User user = getUser(auth);
        deckService.shareDeck(deckId, user, req);
    }

    @PostMapping("/decks/{deckId}/win")
    public DeckDto addWin(@PathVariable Long deckId, Authentication authentication) {
        User user = getUser(authentication);
        deckService.registerWin(deckId, user);
        return deckService.getDeckDtoById(deckId, user);
    }

    @PostMapping("/decks/{deckId}/loss")
    public DeckDto addLoss(@PathVariable Long deckId, Authentication authentication) {
        User user = getUser(authentication);
        deckService.registerLoss(deckId, user);
        return deckService.getDeckDtoById(deckId, user);
    }

    @PostMapping("/decks/{deckId}/reset-score")
    public DeckDto resetScore(@PathVariable Long deckId, Authentication authentication) {
        User user = getUser(authentication);
        deckService.resetScore(deckId, user);
        return deckService.getDeckDtoById(deckId, user);
    }
}