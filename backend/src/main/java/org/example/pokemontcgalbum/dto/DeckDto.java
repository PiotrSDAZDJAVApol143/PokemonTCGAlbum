package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class DeckDto {
    private Long id;
    private String name;
    private String baseEnergy;
    private String secondaryEnergy;
    private List<DeckCardDto> cards;

}