package org.example.pokemontcgalbum.security;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(UserService userService, JwtUtil jwtUtil) {
        return new JwtAuthenticationFilter(userService, jwtUtil);
    }

    /**
     * Jedno źródło prawdy dla CORS (Security).
     * DEV: pozwalamy na dowolny Origin (ważne: przez allowedOriginPatterns, bo allowCredentials=true).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // DEV: pozwól na każdy origin (Postman Web też przejdzie)
        config.setAllowedOriginPatterns(List.of("*"));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        // jeśli używasz cookies/authorization itp.
        config.setAllowCredentials(true);

        // opcjonalnie, ale często przydatne:
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // CORS globalnie, nie tylko /api/**
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
                // TU kluczowe: użyj corsConfigurationSource()
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/pokedex/**").permitAll()
                        .requestMatchers("/api/cards/**").permitAll()
                        .requestMatchers("/api/card-images/**").permitAll()
                        .requestMatchers("/api/user-cards/**").authenticated()
                        .requestMatchers("/api/user-decks/**").authenticated()
                        .requestMatchers("/api/user/**").hasAnyRole("USER", "DEV")
                        .requestMatchers("/api/dev/**").hasRole("DEV")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
