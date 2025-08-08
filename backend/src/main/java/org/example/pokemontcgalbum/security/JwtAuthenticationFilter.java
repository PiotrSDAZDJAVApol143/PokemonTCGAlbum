package org.example.pokemontcgalbum.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.pokemontcgalbum.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public JwtAuthenticationFilter(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        System.out.println("JWT FILTER: " + request.getRequestURI());
        String header = request.getHeader("Authorization");
        String token = null;
        String username = null;
        String path = request.getRequestURI();

        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
            username = jwtUtil.getUsernameFromToken(token);
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            var userDetails = userService.loadUserByUsername(username);
            System.out.println("Authorities: " + userDetails.getAuthorities());
            boolean jwtValid = jwtUtil.validateToken(token);

            // --- WALIDACJA DEV JWT + BAZA ---
            if (path.startsWith("/api/dev")) {
                // 1. JWT musi mieć rolę DEV (albo ROLE_DEV)
                String jwtRole = jwtUtil.getRoleFromToken(token);
                boolean isDevInJwt = "ROLE_DEV".equals(jwtRole) || "DEV".equals(jwtRole);

                // 2. Sprawdź rolę w bazie (Spring UserDetails zwykle ma authorities)
                boolean isDevInDb = userDetails.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_DEV"));

                System.out.println("JWT: " + jwtRole + " DB: " + userDetails.getAuthorities());

                if (jwtValid && isDevInJwt && isDevInDb) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("DEV double-validation failed");
                    return;
                }
            }
            // --- Zwykły user (tylko JWT)
            else if (jwtValid) {
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }

}
