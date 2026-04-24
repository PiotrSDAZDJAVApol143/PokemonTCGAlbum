package org.example.pokemontcgalbum.service;

import org.example.pokemontcgalbum.model.CardState;
import org.example.pokemontcgalbum.model.TcgCard;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PokemonCardIdentityResolver {

    public String resolveFormCode(TcgCard card) {
        String name = normalize(card.getName());

        if (name.contains("alolan")) return "ALOLAN";
        if (name.contains("galarian")) return "GALARIAN";
        if (name.contains("hisuian")) return "HISUIAN";
        if (name.contains("paldean")) return "PALDEAN";

        return "NORMAL";
    }

    public CardState resolveCardState(TcgCard card) {
        String name = normalize(card.getName());
        String stage = normalize(card.getStage());
        Set<String> subtypes = splitSubtypes(card.getSubtypes());

        if (subtypes.contains("vmax") || "vmax".equals(stage) || name.contains(" vmax")) {
            return CardState.VMAX;
        }

        if (subtypes.contains("vstar") || "vstar".equals(stage) || name.contains(" vstar")) {
            return CardState.VSTAR;
        }

        if (subtypes.contains("mega") || "mega".equals(stage) || name.startsWith("mega ") || name.contains(" mega")) {
            return CardState.MEGA;
        }

        if (subtypes.contains("gx") || "gx".equals(stage) || name.contains(" gx") || name.endsWith("-gx")) {
            return CardState.GX;
        }

        if (subtypes.contains("ex") || "ex".equals(stage) || name.contains(" ex") || name.endsWith("-ex")) {
            return CardState.EX;
        }

        if (subtypes.contains("v") || "v".equals(stage) || name.contains(" v")) {
            return CardState.V;
        }

        return CardState.NORMAL;
    }

    public boolean isSpecialState(CardState state) {
        return state != CardState.NORMAL;
    }

    private Set<String> splitSubtypes(String subtypes) {
        if (subtypes == null || subtypes.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(subtypes.split(","))
                .map(this::normalize)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}