package org.example.pokemontcgalbum.controller;

import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.example.pokemontcgalbum.service.PokemonEvolutionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/evolution")
public class PokemonEvolutionController {

    private final TcgCardRepository tcgCardRepository;
    private final PokemonEvolutionService evolutionService;

    public PokemonEvolutionController(
            TcgCardRepository tcgCardRepository,
            PokemonEvolutionService evolutionService
    ) {
        this.tcgCardRepository = tcgCardRepository;
        this.evolutionService = evolutionService;
    }

    @GetMapping("/can-evolve")
    public ResponseEntity<Boolean> canEvolve(
            @RequestParam String fromCardId,
            @RequestParam String toCardId
    ) {
        TcgCard fromCard = tcgCardRepository.findById(fromCardId).orElse(null);
        TcgCard toCard = tcgCardRepository.findById(toCardId).orElse(null);

        boolean result = evolutionService.canEvolve(fromCard, toCard);
        return ResponseEntity.ok(result);
    }
}