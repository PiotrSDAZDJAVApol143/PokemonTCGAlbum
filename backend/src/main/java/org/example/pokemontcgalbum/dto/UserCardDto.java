package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserCardDto {
    private String cardId;
    private String cardName;
    private String imageUrlSmall;
    private String numberInSet;
    private CardSetDto set;
    private List<UserCardInstanceDto> instances; // lista instancji tej karty
    private int quantity; // ← wyliczane: instances.size()
    private Integer overallRating;
}
