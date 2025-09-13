package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.UserCardInstance;
import org.example.pokemontcgalbum.service.UserAlbumService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/{userId}/album")
@RequiredArgsConstructor
public class UserAlbumController {

    private final UserAlbumService albumService;

    // Zwraca WSZYSTKIE instancje kart użytkownika (możesz dorzucić DTO lub pogrupować po karcie)
    @GetMapping
    public List<UserCardInstance> getUserAlbum(@PathVariable Long userId) {
        return albumService.getUserAlbum(userId);
    }

    // Dodaje N egzemplarzy danej karty do albumu
    @PostMapping("/add")
    public ResponseEntity<Void> addCardToAlbum(@PathVariable Long userId,
                                               @RequestParam String cardId,
                                               @RequestParam(defaultValue = "1") int quantity) {
        albumService.addCardToUserAlbum(userId, cardId, quantity);
        return ResponseEntity.ok().build();
    }

    // Usuwa N egzemplarzy danej karty (możesz też endpoint na usunięcie wszystkich!)
    @DeleteMapping("/remove")
    public ResponseEntity<Void> removeCardFromAlbum(@PathVariable Long userId,
                                                    @RequestParam String cardId,
                                                    @RequestParam(defaultValue = "1") int quantity) {
        albumService.removeCardFromUserAlbum(userId, cardId, quantity);
        return ResponseEntity.noContent().build();
    }

    // Usuwa WSZYSTKIE egzemplarze danej karty usera (opcjonalnie)
    @DeleteMapping("/remove-all")
    public ResponseEntity<Void> removeAllCardFromAlbum(@PathVariable Long userId,
                                                       @RequestParam String cardId) {
        albumService.removeAllCardFromUserAlbum(userId, cardId);
        return ResponseEntity.noContent().build();
    }
}