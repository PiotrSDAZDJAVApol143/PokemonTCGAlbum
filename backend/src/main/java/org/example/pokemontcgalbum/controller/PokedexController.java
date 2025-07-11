package org.example.pokemontcgalbum.controller;

import org.example.pokemontcgalbum.dto.PokedexEntry;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pokedex")
public class PokedexController {

    private final TcgCardRepository tcgCardRepository;

    public PokedexController(TcgCardRepository tcgCardRepository) {
        this.tcgCardRepository = tcgCardRepository;
    }

    @GetMapping
    public List<PokedexEntry> getAllUniquePokemon() {
        return tcgCardRepository.findAllDistinctPokemon();
    }
}