package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.model.UserRole;
import org.example.pokemontcgalbum.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.example.pokemontcgalbum.dto.UserSummaryDto;
import java.util.List;

import java.util.Optional;


@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    public void registerNewUser(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("User already exists");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(UserRole.USER);
        userRepository.save(user);
    }
    public User save(User u) {
        return userRepository.save(u);
    }
    // opcjonalnie: unikaj konfliktu username
    public void assertUsernameAvailable(String username, Long currentUserId) {
        userRepository.findByUsername(username).ifPresent(existing -> {
            if (!existing.getId().equals(currentUserId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.CONFLICT, "Username already taken"
                );
            }
        });
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<UserSummaryDto> searchUsersForDeckShare(User currentUser, String query) {
        String q = query == null ? "" : query.trim();
        List<User> users = q.isBlank()
                ? userRepository.findTop10ByIdNotOrderByUsernameAsc(currentUser.getId())
                : userRepository.findTop10ByUsernameContainingIgnoreCaseAndIdNotOrderByUsernameAsc(q, currentUser.getId());

        return users.stream()
                .map(u -> new UserSummaryDto(u.getId(), u.getUsername()))
                .toList();
    }
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        UserRole role = (user.getRole() != null) ? user.getRole() : UserRole.USER;

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .authorities("ROLE_" + role.name())
                .build();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }


}
