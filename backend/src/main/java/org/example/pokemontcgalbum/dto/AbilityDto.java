package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class AbilityDto {
    private Long id;
    private Long defId;
    private String name;
    private String namePl;
    private String description;
    private String descriptionPl;
    private Integer rating;
}
