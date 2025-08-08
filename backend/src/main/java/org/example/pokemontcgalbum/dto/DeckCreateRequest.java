package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class DeckCreateRequest {
    private String name;
    private String baseEnergy;
    private String secondaryEnergy;
    private String logoUrl;
}