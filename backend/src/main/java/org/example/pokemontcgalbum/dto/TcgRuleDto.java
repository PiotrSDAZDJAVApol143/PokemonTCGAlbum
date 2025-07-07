package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class TcgRuleDto {
    private Long id;
    private String text;
    private String textPl;
    private Integer rating;
}