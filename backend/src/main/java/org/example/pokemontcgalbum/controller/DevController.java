package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.service.PokemonExportService;
import org.example.pokemontcgalbum.service.TcgCardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@PreAuthorize("hasRole('DEV')")
@RequestMapping("/api/dev")
@RequiredArgsConstructor
public class DevController {
    private final PokemonExportService exportService;
    private final TcgCardService cardService;
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
    // Update rating for card (overall)
    @PostMapping("/{id}/rating")
    public ResponseEntity<?> rateCard(@PathVariable String id, @RequestParam int rating) {
        cardService.setCardRating(id, rating);
        return ResponseEntity.ok().build();
    }

    // Update rating for ability
    @PostMapping("/ability/{id}/rating")
    public ResponseEntity<?> rateAbility(@PathVariable Long id, @RequestParam int rating) {
        cardService.setAbilityRating(id, rating);
        return ResponseEntity.ok().build();
    }

    // Update rating for attack
    @PostMapping("/attack/{id}/rating")
    public ResponseEntity<?> rateAttack(@PathVariable Long id, @RequestParam int rating) {
        cardService.setAttackRating(id, rating);
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
}
