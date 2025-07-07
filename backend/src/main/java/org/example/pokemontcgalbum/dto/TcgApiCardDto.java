package org.example.pokemontcgalbum.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
// klasa do importu zewnętrznego z API
public class TcgApiCardDto {
    private String id; // "sv7-45"
    private String name; // "Fuecoco"
    private String number; // "45"
    private TcgApiSetDto set;
    @JsonProperty("nationalPokedexNumbers")
    private List<Integer> pokedexNumber;
    private String supertype;
    private List<String> subtypes;
    private String hp;
    private List<String> types;
    private String flavorText;
    private List<TcgApiAttackDto> attacks;
    private List<TcgApiAbilityDto> abilities;
    private List<String> rules;
    private List<TcgApiWeaknessDto> weaknesses;
    private List<String> retreatCost;
    private Integer convertedRetreatCost;
    private String rarity;
    private TcgApiImageDto images;
    private TcgApiCardmarketDto cardmarket;


}
