package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class TcgApiAbilityDto {
    private String name;    // np. "Sturdy"
    private String text;    // opis efektu
    private String type;    // np. "Ability", "Poké-POWER", "Poké-BODY"
}