package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.UserCard;
import org.example.pokemontcgalbum.service.UserAlbumService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/{userId}/album")
@RequiredArgsConstructor
public class UserAlbumController {

    private final UserAlbumService albumService;

    @GetMapping
    public List<UserCard> getUserAlbum(@PathVariable Long userId) {
        return albumService.getUserAlbum(userId);
    }

    @PostMapping("/add")
    public UserCard addCardToAlbum(@PathVariable Long userId,
                                   @RequestParam String cardId,
                                   @RequestParam(defaultValue = "1") int quantity) {
        return albumService.addCardToUserAlbum(userId, cardId, quantity);
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Void> removeCardFromAlbum(@PathVariable Long userId,
                                                    @RequestParam String cardId) {
        albumService.removeCardFromUserAlbum(userId, cardId);
        return ResponseEntity.noContent().build();
    }
}
