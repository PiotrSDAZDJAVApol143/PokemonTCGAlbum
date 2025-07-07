package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserCardDetailsDto {
    private String cardId;
    private String cardName;
    private String imageUrlLarge;
    private String flavorText;
    private String flavorTextPl;
    private List<String> deckNames;
    private List<UserCardInstanceDto> instances;
    private List<AttackDto> attacks;
    private List<AbilityDto> abilities;
    private int quantity;

}
