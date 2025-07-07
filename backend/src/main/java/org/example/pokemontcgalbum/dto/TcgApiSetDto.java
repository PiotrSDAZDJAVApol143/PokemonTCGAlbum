package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class TcgApiSetDto {
    private String id;
    private String name;
    private String series;
    private String printedTotal;
    private String total;
    private String releaseDate;
    private TcgApiSetImageDto images;
}
