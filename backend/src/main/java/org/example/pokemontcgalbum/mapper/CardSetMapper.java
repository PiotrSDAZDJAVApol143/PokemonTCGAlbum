package org.example.pokemontcgalbum.mapper;

import org.example.pokemontcgalbum.dto.CardSetDto;
import org.example.pokemontcgalbum.model.CardSet;
import org.springframework.stereotype.Component;

@Component
public class CardSetMapper {
    public CardSetDto toDto(CardSet set) {
        if (set == null) return null;
        CardSetDto dto = new CardSetDto();
        dto.setId(set.getId());
        dto.setName(set.getName());
        dto.setSeries(set.getSeries());
        dto.setLogoUrl(set.getLogoUrl());
        dto.setSymbolUrl(set.getSymbolUrl());
        dto.setReleaseDate(set.getReleaseDate() != null ? set.getReleaseDate().toString() : null);
        return dto;
    }
}
