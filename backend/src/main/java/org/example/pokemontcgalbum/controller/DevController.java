package org.example.pokemontcgalbum.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.CardTranslationImport;
import org.example.pokemontcgalbum.dto.RatingDto;
import org.example.pokemontcgalbum.service.PokemonExportService;
import org.example.pokemontcgalbum.service.TcgCardService;
import org.example.pokemontcgalbum.service.UpdateMissingFieldsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.List;

@RestController
@PreAuthorize("hasRole('DEV')")
@RequestMapping("/api/dev")
@RequiredArgsConstructor
public class DevController {
    private final PokemonExportService exportService;
    private final TcgCardService cardService;
    private final ObjectMapper objectMapper;
    private final UpdateMissingFieldsService updateMissingFieldsService;
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
}
