package org.example.pokemontcgalbum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCardInstanceDto {
    private Long id;
    private String cardId;
    private String cardName;
    private String imageUrlSmall;
    private String status;      // "free" lub "in_deck"
    private Long deckId;
    private String deckName;
}
