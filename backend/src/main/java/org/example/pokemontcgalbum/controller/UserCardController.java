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
            @RequestParam int page,
            @RequestParam int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String setId,
            @RequestParam(required = false, defaultValue = "recent") String sort,
            @RequestParam(required = false, defaultValue = "all") String show
    ) {
        User user = getAuthenticatedUser();
        return userCardService.searchUserCards(user, page, size, name, setId, sort, show);
    }

    @GetMapping("/details/{cardId}")
    public UserCardDetailsDto getCardDetailsForUser(@PathVariable String cardId) {
        User user = getAuthenticatedUser();
        return userCardService.getCardDetailsForUser(cardId, user);
    }

    @GetMapping("/sets")
    public List<UserSetProgressDto> getUserSets() {
        User user = getAuthenticatedUser();
        return userCardService.findSetsForUserWithProgress(user);
    }

    @PostMapping("/add")
    public void addUserCard(@RequestBody AddUserCardRequest request) {
        User user = getAuthenticatedUser();
        userCardService.addCardInstances(user, request.getCardId(), request.getQuantity());
    }

    @PostMapping("/add-instance")
    public void addInstance(@RequestBody AddUserCardRequest request) {
        User user = getAuthenticatedUser();
        userCardService.addCardInstances(user, request.getCardId(), 1);
    }

    @DeleteMapping("/instance/{instanceId}")
    public void removeInstance(@PathVariable Long instanceId) {
        User user = getAuthenticatedUser();
        userCardService.removeCardInstance(user, instanceId);
    }

    @DeleteMapping("/remove")
    public void removeUserCard(@RequestBody AddUserCardRequest request) {
        User user = getAuthenticatedUser();
        userCardService.removeCardInstances(user, request.getCardId(), request.getQuantity());
    }

    // Przypisz instancję do talii
    @PostMapping("/instance/{instanceId}/assign-to-deck")
    public void assignToDeck(@PathVariable Long instanceId, @RequestBody DeckAssignRequest req) {
        User user = getAuthenticatedUser();
        userCardService.assignInstanceToDeck(user, instanceId, req.getDeckId());
    }

    @PostMapping("/instance/{instanceId}/remove-from-deck")
    public void removeFromDeck(@PathVariable Long instanceId) {
        User user = getAuthenticatedUser();
        userCardService.removeInstanceFromDeck(user, instanceId);
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        String username = auth.getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}