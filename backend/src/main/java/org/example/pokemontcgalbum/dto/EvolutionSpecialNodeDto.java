package org.example.pokemontcgalbum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvolutionSpecialNodeDto {
    private Integer pokedexNumber;
    private String formCode;
    private String pokemonName;
    private String cardState; // EX / GX / V / VMAX / VSTAR / MEGA
    private String label;     // np. "Pikachu EX"
}
