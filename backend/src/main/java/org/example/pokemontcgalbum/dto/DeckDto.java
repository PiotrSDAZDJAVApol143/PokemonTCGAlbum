package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class DeckDto {
    private Long id;
    private String name;
    private String baseEnergy;
    private String secondaryEnergy;
    private String logoUrl;

    private Integer wins;
    private Integer losses;

    private List<DeckCardDto> cards;

    private Integer deckPower;

    private Boolean shared;
    private Boolean readOnly;
    private Long ownerUserId;
    private String ownerUsername;

}