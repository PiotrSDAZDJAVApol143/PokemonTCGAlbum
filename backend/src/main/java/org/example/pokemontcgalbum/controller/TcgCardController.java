package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.CardSetDto;
import org.example.pokemontcgalbum.dto.TcgCardDto;
import org.example.pokemontcgalbum.mapper.CardSetMapper;
import org.example.pokemontcgalbum.mapper.TcgCardMapper;
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
    private final TcgCardMapper toDtoMapper;
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

        // 1) Priorytet: filtr po secie
        if (!setId.isEmpty() && !name.isEmpty()) {
            return service.findByNameAndSet(name, setId, pageable).map(toDtoMapper::toDto);
        } else if (!setId.isEmpty()) {
            return service.findBySet(setId, pageable).map(toDtoMapper::toDto);
        }

        // 2) Stary przypadek "123/456" – zachowaj kompatybilność (opcjonalne)
        if (name.matches("\\d{1,3}/\\d{1,3}")) {
            String[] parts = name.split("/");
            return service.findByNumberInSetAndPrintedTotal(parts[0], parts[1], pageable)
                    .map(toDtoMapper::toDto);
        }

        // 3) Nowe, „sprytne” wyszukiwanie – obsługa TG03/TG30, 10tg/TG03, TG03, zwykłych nazw
        return service.searchForAddPanel(name, pageable).map(toDtoMapper::toDto);
    }
    @GetMapping("/sets")
    public List<CardSetDto> getAllSets() {
        return cardSetRepository
                .findAll(Sort.by(Sort.Direction.DESC, "releaseDate"))
                .stream()
                .map(cardSetMapper::toDto)
                .toList();
    }
}
