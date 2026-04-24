package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.EvolutionDiagramDto;
import org.example.pokemontcgalbum.dto.EvolutionSpecialNodeDto;
import org.example.pokemontcgalbum.dto.EvolutionStageGroupDto;
import org.example.pokemontcgalbum.model.CardState;
import org.example.pokemontcgalbum.model.PokemonSpeciesEvolution;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.PokemonSpeciesEvolutionRepository;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PokemonEvolutionDiagramService {

    private final PokemonSpeciesEvolutionRepository speciesRepository;
    private final TcgCardRepository cardRepository;
    private final PokemonCardIdentityResolver identityResolver;

    public EvolutionDiagramDto getDiagram(Integer pokedexNumber) {
        PokemonSpeciesEvolution selectedNode = speciesRepository
                .findByPokedexNumberAndFormCode(pokedexNumber, "NORMAL")
                .orElseGet(() -> findAnyByDex(pokedexNumber));

        if (selectedNode == null) {
            return null;
        }

        List<PokemonSpeciesEvolution> familyNodes =
                speciesRepository.findByFamilyCodeOrderByEvolutionTierAscBranchOrderAsc(selectedNode.getFamilyCode());

        if (familyNodes.isEmpty()) {
            return null;
        }

        List<Integer> familyDexNumbers = familyNodes.stream()
                .map(PokemonSpeciesEvolution::getPokedexNumber)
                .distinct()
                .toList();

        List<TcgCard> familyCards = cardRepository.findAllPokemonByPokedexNumbers(familyDexNumbers);

        Map<String, List<EvolutionSpecialNodeDto>> specialStatesByNode = buildSpecialStateMap(familyCards);

        List<EvolutionStageGroupDto> groups = familyNodes.stream()
                .map(node -> {
                    String key = nodeKey(node.getPokedexNumber(), node.getFormCode());

                    return new EvolutionStageGroupDto(
                            node.getPokedexNumber(),
                            node.getFormCode(),
                            node.getPokemonName(),
                            node.getNormalStage().name(),
                            node.isBaby(),
                            node.getEvolutionTier(),
                            node.getBranchOrder(),
                            specialStatesByNode.getOrDefault(key, List.of())
                    );
                })
                .toList();

        return new EvolutionDiagramDto(selectedNode.getFamilyCode(), groups);
    }

    private PokemonSpeciesEvolution findAnyByDex(Integer pokedexNumber) {
        // fallback: znajdź pierwszy pasujący node po dex przez wszystkie rodziny
        return speciesRepository.findAll().stream()
                .filter(x -> Objects.equals(x.getPokedexNumber(), pokedexNumber))
                .findFirst()
                .orElse(null);
    }

    private Map<String, List<EvolutionSpecialNodeDto>> buildSpecialStateMap(List<TcgCard> cards) {
        Map<String, Map<CardState, EvolutionSpecialNodeDto>> grouped = new HashMap<>();

        for (TcgCard card : cards) {
            CardState state = identityResolver.resolveCardState(card);
            if (state == CardState.NORMAL) {
                continue;
            }

            String formCode = identityResolver.resolveFormCode(card);
            String key = nodeKey(card.getPokedexNumber(), formCode);

            grouped.computeIfAbsent(key, k -> new EnumMap<>(CardState.class));

            grouped.get(key).putIfAbsent(
                    state,
                    new EvolutionSpecialNodeDto(
                            card.getPokedexNumber(),
                            formCode,
                            buildBasePokemonName(card),
                            state.name(),
                            buildLabel(card, state)
                    )
            );
        }

        Map<String, List<EvolutionSpecialNodeDto>> result = new HashMap<>();

        for (Map.Entry<String, Map<CardState, EvolutionSpecialNodeDto>> entry : grouped.entrySet()) {
            List<EvolutionSpecialNodeDto> sorted = entry.getValue().values().stream()
                    .sorted(Comparator.comparingInt(dto -> stateOrder(dto.getCardState())))
                    .collect(Collectors.toList());

            result.put(entry.getKey(), sorted);
        }

        return result;
    }

    private String buildBasePokemonName(TcgCard card) {
        String name = card.getName() == null ? "" : card.getName();

        name = name.replaceAll("(?i)\\s+VMAX$", "");
        name = name.replaceAll("(?i)\\s+VSTAR$", "");
        name = name.replaceAll("(?i)\\s+V$", "");
        name = name.replaceAll("(?i)\\s+GX$", "");
        name = name.replaceAll("(?i)\\s+EX$", "");
        name = name.replaceAll("(?i)^Mega\\s+", "");
        name = name.replaceAll("(?i)\\s+ex$", "");

        return name.trim();
    }

    private String buildLabel(TcgCard card, CardState state) {
        String baseName = buildBasePokemonName(card);

        return switch (state) {
            case EX -> baseName + " EX";
            case GX -> baseName + " GX";
            case V -> baseName + " V";
            case VMAX -> baseName + " VMAX";
            case VSTAR -> baseName + " VSTAR";
            case MEGA -> "Mega " + baseName;
            default -> baseName;
        };
    }

    private int stateOrder(String state) {
        return switch (state) {
            case "EX" -> 1;
            case "GX" -> 2;
            case "V" -> 3;
            case "VMAX" -> 4;
            case "VSTAR" -> 5;
            case "MEGA" -> 6;
            default -> 99;
        };
    }

    private String nodeKey(Integer pokedexNumber, String formCode) {
        return pokedexNumber + "|" + (formCode == null ? "NORMAL" : formCode);
    }
}