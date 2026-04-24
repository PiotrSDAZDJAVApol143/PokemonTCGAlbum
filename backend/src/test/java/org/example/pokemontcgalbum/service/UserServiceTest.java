package org.example.pokemontcgalbum.service;

import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.model.UserRole;
import org.example.pokemontcgalbum.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks UserService userService;

    @BeforeEach
    void setup() {}

    @Test
    void registerNewUser_shouldSaveUser_whenUsernameNotExists() {
        when(userRepository.findByUsername("piotr")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass")).thenReturn("ENC(pass)");

        userService.registerNewUser("piotr", "pass");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User saved = captor.getValue();
        assertEquals("piotr", saved.getUsername());
        assertEquals("ENC(pass)", saved.getPassword());
        assertEquals(UserRole.USER, saved.getRole());
    }

    @Test
    void registerNewUser_shouldThrow_whenUsernameExists() {
        when(userRepository.findByUsername("piotr")).thenReturn(Optional.of(new User()));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.registerNewUser("piotr", "pass"));

        assertEquals("User already exists", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void assertUsernameAvailable_shouldPass_whenNoUserWithThatUsername() {
        when(userRepository.findByUsername("newname")).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> userService.assertUsernameAvailable("newname", 1L));
    }

    @Test
    void assertUsernameAvailable_shouldPass_whenSameUserKeepsUsername() {
        User existing = new User();
        existing.setId(10L);
        existing.setUsername("same");
        when(userRepository.findByUsername("same")).thenReturn(Optional.of(existing));

        assertDoesNotThrow(() -> userService.assertUsernameAvailable("same", 10L));
    }

    @Test
    void assertUsernameAvailable_shouldThrowConflict_whenUsernameTakenByAnotherUser() {
        User existing = new User();
        existing.setId(11L);
        existing.setUsername("taken");
        when(userRepository.findByUsername("taken")).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.assertUsernameAvailable("taken", 10L));

        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().toLowerCase().contains("already"));
    }

    @Test
    void loadUserByUsername_shouldBuildUserDetails_withRoleFromDb() {
        User u = new User();
        u.setId(1L);
        u.setUsername("piotr");
        u.setPassword("hash");
        u.setRole(UserRole.DEV);

        when(userRepository.findByUsername("piotr")).thenReturn(Optional.of(u));

        UserDetails details = userService.loadUserByUsername("piotr");

        assertEquals("piotr", details.getUsername());
        assertEquals("hash", details.getPassword());
        assertTrue(details.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DEV")));
    }

    @Test
    void loadUserByUsername_shouldDefaultToUser_whenRoleNull() {
        User u = new User();
        u.setUsername("x");
        u.setPassword("hash");
        u.setRole(null);

        when(userRepository.findByUsername("x")).thenReturn(Optional.of(u));

        UserDetails details = userService.loadUserByUsername("x");

        assertTrue(details.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
    }

    @Test
    void loadUserByUsername_shouldThrow_whenNotFound() {
        when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> userService.loadUserByUsername("missing"));
    }
}
