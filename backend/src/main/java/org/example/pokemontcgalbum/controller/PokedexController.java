package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.FlavorDto;
import org.example.pokemontcgalbum.dto.PokedexEntry;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.example.pokemontcgalbum.service.PokedexService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/pokedex")
public class PokedexController {
    private final PokedexService pokedexService;
    private final TcgCardRepository tcgCardRepository;

    @GetMapping
    public List<PokedexEntry> getAllUniquePokemon() {
        return pokedexService.buildPokedex();
    }
    @GetMapping("/{pokedexNumber}/random-flavor")
    public ResponseEntity<FlavorDto> randomFlavor(@PathVariable Integer pokedexNumber) {
        String pl = tcgCardRepository.findRandomFlavorPlByPokedex(pokedexNumber);
        String en = (pl == null) ? tcgCardRepository.findRandomFlavorEnByPokedex(pokedexNumber) : null;
        String txt = (pl != null) ? pl : en;
        if (txt == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(new FlavorDto(txt));
    }
}