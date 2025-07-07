package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.CardSet;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardSetRepository extends JpaRepository<CardSet, String> {
}
