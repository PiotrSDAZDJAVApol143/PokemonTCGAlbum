package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.*;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.service.UserCardService;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/user-cards")
@RequiredArgsConstructor
public class UserCardController {
    private final UserCardService userCardService;
    private final UserService userService; // Dodaj jeśli masz

    @GetMapping("/search")
    public PageUserCardsDto searchUserCards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String setId
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        String username = auth.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userCardService.searchUserCards(user, page, size, name, setId);
    }

    @GetMapping("/details/{cardId}")
    public UserCardDetailsDto getCardDetailsForUser(@PathVariable String cardId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        return userCardService.getCardDetailsForUser(cardId, user);
    }

    @GetMapping("/sets")
    public List<UserSetProgressDto> getUserSets() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        String username = auth.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userCardService.findSetsForUserWithProgress(user);
    }

    @PostMapping("/add")
    public void addUserCard(@RequestBody AddUserCardRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        String username = auth.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userCardService.addCardToUser(user, request.getCardId(), request.getQuantity());
    }

    @PostMapping("/add-instance")
    public void addInstance(@RequestBody AddUserCardRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userCardService.addCardInstance(user, request.getCardId());
    }


    @DeleteMapping("/instance/{instanceId}")
    public void removeInstance(@PathVariable Long instanceId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userCardService.removeCardInstance(user, instanceId);
    }

    @PostMapping("/instance/{instanceId}/assign-to-deck")
    public void assignToDeck(@PathVariable Long instanceId, @RequestBody DeckAssignRequest req) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userCardService.assignInstanceToDeck(user, instanceId, req.getDeckId());
    }

    @PostMapping("/instance/{instanceId}/remove-from-deck")
    public void removeFromDeck(@PathVariable Long instanceId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userCardService.removeInstanceFromDeck(user, instanceId);
    }
}