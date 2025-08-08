package org.example.pokemontcgalbum.mapper;

import org.example.pokemontcgalbum.dto.UserCardInstanceDto;
import org.example.pokemontcgalbum.model.UserCardInstance;
import org.springframework.stereotype.Component;

@Component
public class UserCardInstanceMapper {
    public UserCardInstanceDto toDto(UserCardInstance instance) {
        UserCardInstanceDto dto = new UserCardInstanceDto();
        dto.setId(instance.getId());
        dto.setCardId(instance.getCard().getId());
        dto.setCardName(instance.getCard().getName());
        dto.setImageUrlSmall(instance.getCard().getImageUrlSmall());
        dto.setStatus(instance.getDeck() != null ? "in_deck" : "free");
        if (instance.getDeck() != null) {
            dto.setDeckId(instance.getDeck().getId());
            dto.setDeckName(instance.getDeck().getName());
        }
        return dto;
    }
}
