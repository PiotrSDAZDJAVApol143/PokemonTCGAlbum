package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.UserPokedexEntryDto;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.repository.UserCardRepository;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user/pokedex")
@RequiredArgsConstructor
public class UserPokedexController {
    private final UserCardRepository userCardRepo;
    private final UserService userService;

    @GetMapping
    public List<UserPokedexEntryDto> getUserPokedex(Authentication authentication) {
        String username = authentication.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Integer> ownedNumbers = userCardRepo.findOwnedPokedexNumbersByUser(user);
        return ownedNumbers.stream()
                .map(UserPokedexEntryDto::new)
                .toList();
    }
}