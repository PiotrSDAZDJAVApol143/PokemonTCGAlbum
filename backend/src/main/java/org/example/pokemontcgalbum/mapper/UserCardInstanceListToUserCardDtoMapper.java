package org.example.pokemontcgalbum.mapper;

import org.example.pokemontcgalbum.dto.*;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.model.UserCardInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserCardInstanceListToUserCardDtoMapper {
    @Autowired
    private UserCardInstanceMapper instanceMapper;
    @Autowired
    private CardSetMapper cardSetMapper;

    public UserCardDto toDto(TcgCard card, List<UserCardInstance> instances) {
        UserCardDto dto = new UserCardDto();
        dto.setCardId(card.getId());
        dto.setCardName(card.getName());
        dto.setImageUrlSmall(card.getImageUrlSmall());
        dto.setNumberInSet(card.getNumberInSet());
        dto.setSet(card.getSet() != null ? cardSetMapper.toDto(card.getSet()) : null);
        List<UserCardInstanceDto> instanceDtos = instances.stream()
                .map(instanceMapper::toDto)
                .collect(Collectors.toList());
        dto.setInstances(instanceDtos);
        dto.setQuantity(instanceDtos.size());
        dto.setOverallRating(card.getOverallRating());
        return dto;
    }
}
