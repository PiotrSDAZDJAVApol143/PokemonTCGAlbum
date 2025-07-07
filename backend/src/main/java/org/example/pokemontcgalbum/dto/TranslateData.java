package org.example.pokemontcgalbum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranslateData {

    private String flavorTextPl;
    private List<TranslatedAttack> attacks;
    private List<TranslatedAbility> abilities;

}
