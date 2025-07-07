package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.TcgCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TcgCardRepository extends JpaRepository<TcgCard, String> {
    List<TcgCard> findBySupertype(String supertype);
    boolean existsById(String id);
    List<TcgCard> findBySupertypeAndType(String supertype, String type);
    // Dodatkowe metody do wyszukiwania np. tylko Trainerów
}