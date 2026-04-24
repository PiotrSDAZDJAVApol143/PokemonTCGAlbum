package org.example.pokemontcgalbum.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvolutionStageGroupDto {
    private Integer pokedexNumber;
    private String formCode;
    private String pokemonName;
    private String normalStage;     // BASIC / STAGE1 / STAGE2
    private boolean baby;
    private Integer evolutionTier;
    private Integer branchOrder;
    private List<EvolutionSpecialNodeDto> specialStates;
}