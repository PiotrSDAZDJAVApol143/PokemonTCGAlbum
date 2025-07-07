package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class TcgApiAttackDto {
    private String name;                // np. "Gnaw"
    private List<String> cost;          // ["Colorless", "Fire"]
    private String damage;              // np. "20"
    private String text;                // opis efektu ataku
    private Integer convertedEnergyCost;
}