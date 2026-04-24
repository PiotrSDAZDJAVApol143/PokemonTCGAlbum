package org.example.pokemontcgalbum.service;

import org.example.pokemontcgalbum.model.CardState;
import org.example.pokemontcgalbum.model.PokemonSpeciesEvolution;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.PokemonPlayEvolutionRuleRepository;
import org.example.pokemontcgalbum.repository.PokemonSpeciesEvolutionRepository;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class PokemonEvolutionService {

    private final PokemonPlayEvolutionRuleRepository ruleRepository;
    private final PokemonSpeciesEvolutionRepository speciesRepository;
    private final PokemonCardIdentityResolver resolver;

    public PokemonEvolutionService(
            PokemonPlayEvolutionRuleRepository ruleRepository,
            PokemonSpeciesEvolutionRepository speciesRepository,
            PokemonCardIdentityResolver resolver
    ) {
        this.ruleRepository = ruleRepository;
        this.speciesRepository = speciesRepository;
        this.resolver = resolver;
    }

    public boolean canEvolve(TcgCard currentCard, TcgCard targetCard) {
        if (currentCard == null || targetCard == null) return false;
        if (currentCard.getPokedexNumber() == null || targetCard.getPokedexNumber() == null) return false;

        PokemonSpeciesEvolution currentNode = getSpeciesNode(currentCard);
        PokemonSpeciesEvolution targetNode = getSpeciesNode(targetCard);

        if (currentNode == null || targetNode == null) return false;
        if (!Objects.equals(currentNode.getFamilyCode(), targetNode.getFamilyCode())) return false;

        String fromFormCode = currentNode.getFormCode();
        String toFormCode = targetNode.getFormCode();

        CardState fromState = resolver.resolveCardState(currentCard);
        CardState toState = resolver.resolveCardState(targetCard);

        return ruleRepository.existsByFromPokedexNumberAndFromFormCodeAndFromCardStateAndToPokedexNumberAndToFormCodeAndToCardState(
                currentCard.getPokedexNumber(),
                fromFormCode,
                fromState,
                targetCard.getPokedexNumber(),
                toFormCode,
                toState
        );
    }

    public PokemonSpeciesEvolution getSpeciesNode(TcgCard card) {
        if (card == null || card.getPokedexNumber() == null) {
            return null;
        }

        String formCode = resolver.resolveFormCode(card);

        return speciesRepository.findByPokedexNumberAndFormCode(card.getPokedexNumber(), formCode)
                .orElse(null);
    }
}