package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class UserCardDto {
        private String cardId;             // np. "sv7-45"
        private String cardName;           // np. "Fuecoco"
        private String imageUrlSmall;      // miniaturka do listy
        private Integer quantity;          // ile egzemplarzy user ma

        // Możesz dodać: np. flavorText, tłumaczenia itd.
    }
