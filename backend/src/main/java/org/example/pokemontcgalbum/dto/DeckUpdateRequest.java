package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class DeckUpdateRequest {
    private String name;
    private String baseEnergy;
    private String secondaryEnergy;
}
