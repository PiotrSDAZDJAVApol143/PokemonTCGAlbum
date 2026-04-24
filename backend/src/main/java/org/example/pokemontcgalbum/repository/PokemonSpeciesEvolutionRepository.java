package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.PokemonSpeciesEvolution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PokemonSpeciesEvolutionRepository extends JpaRepository<PokemonSpeciesEvolution, Long> {

    Optional<PokemonSpeciesEvolution> findByPokedexNumberAndFormCode(Integer pokedexNumber, String formCode);

    List<PokemonSpeciesEvolution> findByFamilyCodeOrderByEvolutionTierAscBranchOrderAsc(String familyCode);
}
