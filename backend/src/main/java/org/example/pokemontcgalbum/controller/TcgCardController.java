package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.CardSetDto;
import org.example.pokemontcgalbum.dto.TcgCardDto;
import org.example.pokemontcgalbum.mapper.CardSetMapper;
import org.example.pokemontcgalbum.mapper.TcgCardToDtoMapper;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.CardSetRepository;
import org.example.pokemontcgalbum.service.TcgImportService;
import org.example.pokemontcgalbum.service.TcgCardService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private final CardSetRepository cardSetRepository;
    private final CardSetMapper cardSetMapper;
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
    @GetMapping("/search")
    public Page<TcgCardDto> searchCards(
            @RequestParam(defaultValue = "") String name,
            @RequestParam(defaultValue = "") String setId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name"));
        Page<TcgCard> result;
        if (!setId.isEmpty() && !name.isEmpty()) {
            result = service.findByNameAndSet(name, setId, pageable);
        } else if (!setId.isEmpty()) {
            result = service.findBySet(setId, pageable);
        } else if (!name.isEmpty()) {
            result = service.findByName(name, pageable);
        } else {
            result = service.findAll(pageable);
        }
        return result.map(toDtoMapper::toDto);
    }
    @GetMapping("/sets")
    public List<CardSetDto> getAllSets() {
        return cardSetRepository.findAll().stream().map(cardSetMapper::toDto).toList();
    }
}
