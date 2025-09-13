package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class AbilityDefDto {
    private Long id;
    private String name;
    private String namePl;
    private String description;
    private String descriptionPl;
    private String canonicalKey;
    private Integer rating;
}
