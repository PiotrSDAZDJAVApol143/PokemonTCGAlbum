package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.AttackDef;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttackDefRepository extends JpaRepository<AttackDef, Long> {
    Optional<AttackDef> findByCanonicalKey(String canonicalKey);
    List<AttackDef> findByNameContainingIgnoreCase(String q);
}
