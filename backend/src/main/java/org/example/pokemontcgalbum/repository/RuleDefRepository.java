package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.RuleDef;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RuleDefRepository extends JpaRepository<RuleDef, Long> {
    Optional<RuleDef> findByCanonicalKey(String canonicalKey);
}
