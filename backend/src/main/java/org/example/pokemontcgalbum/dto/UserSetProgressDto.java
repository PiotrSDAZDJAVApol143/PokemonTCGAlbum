package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class UserSetProgressDto {
    private String id;
    private String name;
    private String series;
    private String logoUrl;
    private int unlocked; // ile unikalnych kart usera
    private int total;
}

