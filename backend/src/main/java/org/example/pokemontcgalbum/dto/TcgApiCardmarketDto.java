package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class TcgApiCardmarketDto {
    private String url;
    private TcgApiCardmarketPriceDto prices;
}
