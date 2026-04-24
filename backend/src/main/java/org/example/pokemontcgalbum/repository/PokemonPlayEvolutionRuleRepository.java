package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.model.CardState;
import org.example.pokemontcgalbum.model.PokemonPlayEvolutionRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PokemonPlayEvolutionRuleRepository extends JpaRepository<PokemonPlayEvolutionRule, Long> {

    boolean existsByFromPokedexNumberAndFromFormCodeAndFromCardStateAndToPokedexNumberAndToFormCodeAndToCardState(
            Integer fromPokedexNumber,
            String fromFormCode,
            CardState fromCardState,
            Integer toPokedexNumber,
            String toFormCode,
            CardState toCardState
    );

    List<PokemonPlayEvolutionRule> findByFamilyCode(String familyCode);
}