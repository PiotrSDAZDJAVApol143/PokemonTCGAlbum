package org.example.pokemontcgalbum.mapper;

import org.example.pokemontcgalbum.dto.AbilityDefDto;
import org.example.pokemontcgalbum.model.AbilityDef;
import org.springframework.stereotype.Component;

@Component
public class AbilityDefMapper {
    public AbilityDefDto toDto(AbilityDef d) {
        AbilityDefDto dto = new AbilityDefDto();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setNamePl(d.getNamePl());
        dto.setDescription(d.getDescription());
        dto.setDescriptionPl(d.getDescriptionPl());
        dto.setCanonicalKey(d.getCanonicalKey());
        dto.setRating(d.getRating());
        return dto;
    }
}