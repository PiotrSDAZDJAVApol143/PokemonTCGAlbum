package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class AttackDto {
    private Long id;
    private String name;
    private String namePl;
    private String cost;
    private String damage;
    private String description;
    private String descriptionPl;
    private Boolean special;
    private Integer rating;
}
