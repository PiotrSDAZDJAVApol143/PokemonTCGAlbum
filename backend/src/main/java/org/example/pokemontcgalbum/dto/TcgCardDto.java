package org.example.pokemontcgalbum.dto;

import lombok.Data;
import org.example.pokemontcgalbum.model.CardSet;

import java.util.List;

@Data
public class TcgCardDto {
    private String id;
    private String name;
    private String supertype;
    private String subtypes;
    private String stage;
    private Integer hp;
    private String type;
    private Integer pokedexNumber;
    private CardSetDto set;
    private String numberInSet;
    private String rarity;
    private String imageUrlSmall;
    private String imageUrlLarge;
    private String officialArtworkUrl;
    private String flavorText;
    private String flavorTextPl;
    private List<TcgRuleDto> rules;
    private List<AttackDto> attacks;
    private List<AbilityDto> abilities;
    private String weakness;
    private String resistance;
    private Integer retreat;
    private Integer overallRating;
    private String cardmarketUrl;
    private Double cardmarketAvgSellPrice;
    private Double cardmarketLowPrice;

}
