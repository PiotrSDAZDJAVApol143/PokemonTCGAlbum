package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.ChangePasswordRequest;
import org.example.pokemontcgalbum.dto.ImageCacheStatsDto;
import org.example.pokemontcgalbum.dto.MeDto;
import org.example.pokemontcgalbum.dto.UpdateImageCacheDirRequest;
import org.example.pokemontcgalbum.dto.UpdateProfileRequest;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.service.CardImageCacheService;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.example.pokemontcgalbum.dto.ImagePreloadResultDto;
import org.example.pokemontcgalbum.dto.PreloadCardImagesRequest;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class AccountController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final CardImageCacheService cardImageCacheService;

    private User getUser(Authentication auth) {
        String username = auth.getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void requireDev(User user) {
        if (user.getRole() == null || !"DEV".equals(user.getRole().name())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only DEV can manage image cache");
        }
    }

    // GET /api/user/me
    @GetMapping("/me")
    public MeDto me(Authentication auth) {
        User u = getUser(auth);
        return new MeDto(u.getId(), u.getUsername(), u.getRole().name());
    }

    // PATCH /api/user/me
    @PatchMapping("/me")
    public MeDto updateProfile(Authentication auth, @RequestBody UpdateProfileRequest req) {
        User u = getUser(auth);

        String newUsername = (req.getUsername() == null) ? "" : req.getUsername().trim();
        if (newUsername.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username too short (min 3)");
        }

        userService.assertUsernameAvailable(newUsername, u.getId());

        u.setUsername(newUsername);
        User saved = userService.save(u);

        return new MeDto(saved.getId(), saved.getUsername(), saved.getRole().name());
    }

    // POST /api/user/change-password
    @PostMapping("/change-password")
    public void changePassword(Authentication auth, @RequestBody ChangePasswordRequest req) {
        User u = getUser(auth);

        if (req.getCurrentPassword() == null || req.getNewPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing password fields");
        }

        if (!passwordEncoder.matches(req.getCurrentPassword(), u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        if (req.getNewPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password too short (min 6)");
        }

        u.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userService.save(u);
    }

    // GET /api/user/image-cache/stats
    @GetMapping("/image-cache/stats")
    public ImageCacheStatsDto imageCacheStats(Authentication auth) {
        getUser(auth);
        return cardImageCacheService.getCacheStats();
    }
    // POST /api/user/image-cache/preload-cards
    @PostMapping("/image-cache/preload-cards")
    public ImagePreloadResultDto preloadCardImages(Authentication auth,
                                                   @RequestBody PreloadCardImagesRequest req) {
        getUser(auth);

        boolean includeSmall = req.isSmall();
        boolean includeLarge = req.isLarge();

        if (!includeSmall && !includeLarge) {
            includeSmall = true;
            includeLarge = true;
        }

        return cardImageCacheService.preloadCardImages(
                req.getCardIds(),
                includeSmall,
                includeLarge
        );
    }

    // PATCH /api/user/image-cache/folder
    @PatchMapping("/image-cache/folder")
    public ImageCacheStatsDto changeImageCacheFolder(
            Authentication auth,
            @RequestBody UpdateImageCacheDirRequest req
    ) {
        User user = getUser(auth);
        requireDev(user);

        try {
            return cardImageCacheService.changeCacheDir(req.getCacheDir());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // DELETE /api/user/image-cache
    @DeleteMapping("/image-cache")
    public ImageCacheStatsDto clearImageCache(Authentication auth) {
        User user = getUser(auth);
        requireDev(user);

        try {
            return cardImageCacheService.clearCache();
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}