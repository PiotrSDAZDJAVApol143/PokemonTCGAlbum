package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.OfflineDeckPackagePreviewDto;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.service.DeckOfflinePackageImportService;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.example.pokemontcgalbum.dto.OfflineDeckPackageImportResultDto;

@RestController
@RequestMapping("/api/user/offline-packages")
@RequiredArgsConstructor
public class OfflinePackageController {

    private final UserService userService;
    private final DeckOfflinePackageImportService deckOfflinePackageImportService;

    private User getUser(Authentication auth) {
        String username = auth.getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @PostMapping(
            value = "/deck-preview",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public OfflineDeckPackagePreviewDto previewDeckPackage(
            Authentication auth,
            @RequestParam("file") MultipartFile file
    ) {
        getUser(auth);

        return deckOfflinePackageImportService.previewDeckPackage(file);
    }
    @PostMapping(
            value = "/deck-import",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public OfflineDeckPackageImportResultDto importDeckPackage(
            Authentication auth,
            @RequestParam("file") MultipartFile file
    ) {
        User user = getUser(auth);

        return deckOfflinePackageImportService.importDeckPackage(file, user);
    }
}