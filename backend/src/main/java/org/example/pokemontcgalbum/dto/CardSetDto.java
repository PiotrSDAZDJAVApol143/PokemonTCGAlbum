package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class CardSetDto {
    private String id;
    private String name;
    private String series;
    private String logoUrl;
    private String symbolUrl;
    private String releaseDate;
    private Integer printedTotal;
}
