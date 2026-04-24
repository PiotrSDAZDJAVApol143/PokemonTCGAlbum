package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.UserSummaryDto;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private User getUser(Authentication auth) {
        String username = auth.getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @GetMapping("/find-by-username/{username}")
    public UserSummaryDto getUserByUsername(@PathVariable String username) {
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return new UserSummaryDto(user.getId(), user.getUsername());
    }

    @GetMapping("/search")
    public List<UserSummaryDto> searchUsers(@RequestParam(required = false) String query,
                                            Authentication auth) {
        User currentUser = getUser(auth);
        return userService.searchUsersForDeckShare(currentUser, query);
    }
}