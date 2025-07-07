package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.Attack;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttackRepository extends JpaRepository<Attack, Long> {
}
