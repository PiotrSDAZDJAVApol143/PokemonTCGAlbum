package org.example.pokemontcgalbum.mapper;

import org.example.pokemontcgalbum.dto.AttackDefDto;
import org.example.pokemontcgalbum.model.AttackDef;
import org.springframework.stereotype.Component;

@Component
public class AttackDefMapper {
    public AttackDefDto toDto(AttackDef d) {
        AttackDefDto dto = new AttackDefDto();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setNamePl(d.getNamePl());
        dto.setDescription(d.getDescription());
        dto.setDescriptionPl(d.getDescriptionPl());
        dto.setCanonicalKey(d.getCanonicalKey());
        dto.setRating(d.getRating());
        dto.setDamageText(d.getDamageText());
        return dto;
    }
}
