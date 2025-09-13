package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.FlavorDto;
import org.example.pokemontcgalbum.dto.UserPokedexEntryDto;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.example.pokemontcgalbum.repository.UserCardInstanceRepository;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user/pokedex")
@RequiredArgsConstructor
public class UserPokedexController {
    private final UserCardInstanceRepository userCardInstanceRepo;
    private final UserService userService;
    private final TcgCardRepository cardRepo;

    @GetMapping
    public List<UserPokedexEntryDto> getUserPokedex(Authentication authentication) {
        String username = authentication.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Pobieramy unikalne numery Pokedex, które user posiada w swoich instancjach kart
        List<Integer> ownedNumbers = userCardInstanceRepo.findOwnedPokedexNumbersByUser(user);

        // Mapujemy do DTO
        return ownedNumbers.stream()
                .map(UserPokedexEntryDto::new)
                .toList();
    }

    @GetMapping("/{pokedexNumber}/random-flavor")
    public ResponseEntity<FlavorDto> randomFlavor(@PathVariable Integer pokedexNumber) {
        String pl = cardRepo.findRandomFlavorPlByPokedex(pokedexNumber);
        String en = (pl == null) ? cardRepo.findRandomFlavorEnByPokedex(pokedexNumber) : null;
        String txt = (pl != null) ? pl : en;
        if (txt == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(new FlavorDto(txt));
    }
}