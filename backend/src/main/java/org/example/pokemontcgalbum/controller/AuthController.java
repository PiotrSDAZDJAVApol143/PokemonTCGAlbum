package org.example.pokemontcgalbum.controller;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.LoginRequest;
import org.example.pokemontcgalbum.dto.LoginResponse;
import org.example.pokemontcgalbum.dto.RefreshRequest;
import org.example.pokemontcgalbum.dto.RegisterRequest;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.security.JwtUtil;
import org.example.pokemontcgalbum.security.RefreshToken;
import org.example.pokemontcgalbum.security.SecurityConfig;
import org.example.pokemontcgalbum.service.RefreshTokenService;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        userService.registerNewUser(request.getUsername(), request.getPassword());
        return ResponseEntity.ok("User registered!");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userService.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String accessToken = jwtUtil.generateToken(user.getUsername());
        String refreshToken = refreshTokenService.createRefreshToken(user).getToken();

        return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken));
    }
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody RefreshRequest request) {
        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (!refreshTokenService.isValid(refreshToken)) {
            refreshTokenService.delete(refreshToken);
            throw new RuntimeException("Refresh token expired");
        }

        String accessToken = jwtUtil.generateToken(refreshToken.getUser().getUsername());
        // Możesz odnowić refresh token (opcjonalnie, jeśli chcesz rotować tokeny) lub zostawić ten sam jeśli nie wygasł

        return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken.getToken()));
    }
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshRequest request) {
        refreshTokenService.findByToken(request.getRefreshToken())
                .ifPresent(refreshTokenService::delete);
        return ResponseEntity.ok("Logged out");
    }

}
