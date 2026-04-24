package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.ChangePasswordRequest;
import org.example.pokemontcgalbum.dto.MeDto;
import org.example.pokemontcgalbum.dto.UpdateProfileRequest;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class AccountController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    private User getUser(Authentication auth) {
        String username = auth.getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
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

        // jeśli chcesz wymusić unikalność:
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
}