package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.service.CardImageCacheService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/card-images")
@RequiredArgsConstructor
public class CardImageController {

    private final CardImageCacheService cardImageCacheService;

    @GetMapping("/{cardId}/{size}")
    public ResponseEntity<Resource> getCardImage(
            @PathVariable String cardId,
            @PathVariable String size
    ) {
        Optional<CardImageCacheService.CachedCardImage> imageOpt =
                cardImageCacheService.getCardImage(cardId, size);

        if (imageOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CardImageCacheService.CachedCardImage image = imageOpt.get();
        Resource resource = new FileSystemResource(image.getPath());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(image.getMediaType())
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .body(resource);
    }
}