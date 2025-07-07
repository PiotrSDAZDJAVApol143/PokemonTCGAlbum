package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class TcgApiCardsResponseDto {
    private List<TcgApiCardDto> data;
}
