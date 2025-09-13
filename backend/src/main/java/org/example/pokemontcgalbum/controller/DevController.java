package org.example.pokemontcgalbum.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.AbilityDefDto;
import org.example.pokemontcgalbum.dto.AttackDefDto;
import org.example.pokemontcgalbum.dto.CardTranslationImport;
import org.example.pokemontcgalbum.dto.RatingDto;
import org.example.pokemontcgalbum.mapper.AbilityDefMapper;
import org.example.pokemontcgalbum.mapper.AttackDefMapper;
import org.example.pokemontcgalbum.repository.AbilityDefRepository;
import org.example.pokemontcgalbum.repository.AttackDefRepository;
import org.example.pokemontcgalbum.service.PokemonExportService;
import org.example.pokemontcgalbum.service.TcgApiService;
import org.example.pokemontcgalbum.service.TcgCardService;
import org.example.pokemontcgalbum.service.UpdateMissingFieldsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@RestController
@PreAuthorize("hasRole('DEV')")
@RequestMapping("/api/dev")
@RequiredArgsConstructor
public class DevController {
    private final PokemonExportService exportService;
    private final TcgCardService cardService;
    private final ObjectMapper objectMapper;
    private final UpdateMissingFieldsService updateMissingFieldsService;
    private final TcgApiService api;
    private final AttackDefRepository attackDefRepository;
    private final AbilityDefRepository abilityDefRepository;
    private final AttackDefMapper attackDefMapper;
    private final AbilityDefMapper abilityDefMapper;

    @GetMapping("/export-translations")
    public ResponseEntity<String> exportTranslations(
            @RequestParam(required = false, defaultValue = "C:\\Users\\Piotrek\\Desktop\\tcg_export.json") String path) {
        try {
            exportService.exportCardsForTranslation(path);
            return ResponseEntity.ok("Eksport zakończony! Plik: " + path);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Błąd: " + e.getMessage());
        }
    }
    @PostMapping("/import-pl-translations")
    public ResponseEntity<?> importTranslations() {
        try {
            // Wczytaj plik z resources
            InputStream is = getClass().getResourceAsStream("/translations-pl.json");
            if (is == null) {
                return ResponseEntity.badRequest().body("Nie znaleziono pliku tłumaczeń!");
            }
            List<CardTranslationImport> cards = objectMapper.readValue(is, new TypeReference<>() {});
            int updates = cardService.updateTranslationsFromImport(cards);
            return ResponseEntity.ok("Zaimportowano/zmodyfikowano: " + updates + " kart.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Błąd importu: " + e.getMessage());
        }
    }
    // Update rating for card (overall)
    @PatchMapping("/{id}/rating")
    public ResponseEntity<?> rateCard(@PathVariable String id, @RequestBody RatingDto dto) {
        cardService.setCardRating(id, dto.getRating());
        return ResponseEntity.ok().build();
    }

    // Update rating for ability
    @PatchMapping("/ability/{id}/rating")
    public ResponseEntity<?> rateAbility(@PathVariable Long id, @RequestBody RatingDto dto) {
        cardService.setAbilityRating(id, dto.getRating());
        return ResponseEntity.ok().build();
    }

    // Update rating for attack
    @PatchMapping("/attack/{id}/rating")
    public ResponseEntity<?> patchAttackRating(@PathVariable Long id, @RequestBody RatingDto dto) {
        cardService.setAttackRating(id, dto.getRating());
        return ResponseEntity.ok().build();
    }
    @PatchMapping("/rule/{id}/rating")
    public ResponseEntity<?> rateRule(@PathVariable Long id, @RequestBody RatingDto dto) {
        cardService.setRuleRating(id, dto.getRating());
        return ResponseEntity.ok().build();
    }

    // Update translation for attack
    @PostMapping("/attack/{id}/translate")
    public ResponseEntity<?> translateAttack(@PathVariable Long id,
                                             @RequestParam String namePl,
                                             @RequestParam String descriptionPl) {
        cardService.updateAttackTranslation(id, namePl, descriptionPl);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/update-missing-fields")
    public ResponseEntity<?> updateMissingFields() {
        int updated = updateMissingFieldsService.updateMissingFields();
        return ResponseEntity.ok("Zaktualizowano dane dla " + updated + " kart.");
    }

    @PatchMapping("/cards/{id}/recalc-rating")
    public ResponseEntity<Integer> recalcCard(@PathVariable String id) {
        int r = cardService.recalcAndSaveCardRating(id);
        return ResponseEntity.ok(r);
    }

    @PostMapping("/cards/recalc-all")
    public ResponseEntity<String> recalcAll() {
        int n = cardService.recalcAllCards();
        return ResponseEntity.ok("Przeliczono " + n + " kart.");
    }
    @PatchMapping("/{id}/recalc-rating")
    public ResponseEntity<Integer> recalcRating(@PathVariable String id) {
        int r = cardService.recalcAndSaveCardRating(id);
        return ResponseEntity.ok(r);
    }

    @GetMapping("/sets/{setId}/raw")
    public ResponseEntity<?> rawSet(@PathVariable String setId) {
        var dto = api.getSetById(setId);
        if (dto == null) return ResponseEntity.status(502).body("Brak odpowiedzi z API");
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/sets/{setId}/fill-release-date")
    public ResponseEntity<?> fillOne(@PathVariable String setId) {
        int updated = updateMissingFieldsService.fillOnlyReleaseDateForSet(setId);
        return ResponseEntity.ok("Zaktualizowano: " + updated);
    }

    @PostMapping("/sets/fill-release-date-missing")
    public ResponseEntity<?> fillAllMissingReleaseDates() {
        int updated = updateMissingFieldsService.fillAllMissingReleaseDates();
        return ResponseEntity.ok("Zaktualizowano setów: " + updated);
    }

    @PostMapping("/sets/sync-release-dates")
    public ResponseEntity<?> syncReleaseDates() {
        int n = updateMissingFieldsService.syncReleaseDatesFromApi();
        return ResponseEntity.ok("Zaktualizowano releaseDate dla " + n + " setów.");
    }

    @GetMapping("/attack-defs")
    public List<AttackDefDto> searchAttackDefs(@RequestParam String q) {
        return attackDefRepository.findByNameContainingIgnoreCase(q).stream()
                .map(attackDefMapper::toDto)
                .toList();
    }

    @PatchMapping("/attack-defs/{id}/rating")
    public void setAttackDefRating(@PathVariable Long id, @RequestBody RatingDto dto) {
        cardService.setAttackDefRating(id, dto.getRating());
    }
    @GetMapping("/ability-defs")
    public List<AbilityDefDto> searchAbilityDefs(@RequestParam String q) {
        return abilityDefRepository.findByNameContainingIgnoreCase(q).stream()
                .map(abilityDefMapper::toDto)
                .toList();
    }

    @PatchMapping("/ability-defs/{id}/rating")
    public void setAbilityDefRating(@PathVariable Long id, @RequestBody RatingDto dto) {
        cardService.setAbilityDefRating(id, dto.getRating());
    }
    @PatchMapping("/cards/pokedex-number-bulk")
    public void setPokedexNumbers(@RequestBody List<Map<String, Object>> items) {
        items.forEach(it -> {
            String id = (String) it.get("id");
            Integer num = (Integer) it.get("pokedexNumber");
            if (id != null && num != null) cardService.setPokedexNumber(id, num);
        });
    }
}
