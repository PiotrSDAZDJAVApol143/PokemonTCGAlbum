package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.AbilityDef;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AbilityDefRepository extends JpaRepository<AbilityDef, Long> {
    Optional<AbilityDef> findByCanonicalKey(String canonicalKey);
    List<AbilityDef> findByNameContainingIgnoreCase(String q);
}
