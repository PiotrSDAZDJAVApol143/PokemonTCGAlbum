package org.example.pokemontcgalbum.mapper;

import org.example.pokemontcgalbum.dto.UserCardDto;
import org.example.pokemontcgalbum.model.UserCard;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UserCardMapper {
    @Autowired
    private CardSetMapper cardSetMapper;
    public UserCardDto toDto(UserCard userCard) {
        var card = userCard.getCard();
        UserCardDto dto = new UserCardDto();
        dto.setCardId(card.getId());
        dto.setCardName(card.getName());
        dto.setImageUrlSmall(card.getImageUrlSmall());

        dto.setQuantity(userCard.getQuantity());
        dto.setNumberInSet(card.getNumberInSet());
        dto.setSet(card.getSet() != null ? cardSetMapper.toDto(card.getSet()) : null);
        return dto;
    }
}
