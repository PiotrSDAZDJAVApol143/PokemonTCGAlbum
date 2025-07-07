package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.TcgCardDto;
import org.example.pokemontcgalbum.mapper.TcgCardToDtoMapper;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.service.TcgImportService;
import org.example.pokemontcgalbum.service.TcgCardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class TcgCardController {
    private final TcgCardService service;
    private final TcgImportService importService;
    private final TcgCardToDtoMapper toDtoMapper;
    @GetMapping
    public List<TcgCardDto> getAll() {
        return service.findAll().stream()
                .map(toDtoMapper::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TcgCardDto> getById(@PathVariable String id) {
        return service.findById(id)
                .map(toDtoMapper::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TcgCard addCard(@RequestBody TcgCard card) {
        return service.save(card);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCard(@PathVariable String id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import/all")
    public ResponseEntity<String> importAllCards() {
        int imported = importService.importAllTcgCards();
        return ResponseEntity.ok("Zaimportowano " + imported + " kart!");
    }
}
