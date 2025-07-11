package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.UserPokedexEntryDto;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.repository.UserCardRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user/pokedex")
@RequiredArgsConstructor
public class UserPokedexController {
    private final UserCardRepository userCardRepo;

    @GetMapping
    public List<UserPokedexEntryDto> getUserPokedex(@AuthenticationPrincipal User user) {
        List<Integer> ownedNumbers = userCardRepo.findOwnedPokedexNumbersByUser(user);
        return ownedNumbers.stream()
                .map(UserPokedexEntryDto::new)
                .toList();
    }
}
