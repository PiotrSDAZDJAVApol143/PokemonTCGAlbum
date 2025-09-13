package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class DeckCardDto {
    private Long id; // id relacji DeckCard
    private TcgCardDto card;
    private int quantity;
    private UserCardInstanceDto instance;
}
