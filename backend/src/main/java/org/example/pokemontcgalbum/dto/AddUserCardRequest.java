package org.example.pokemontcgalbum.dto;

import lombok.Data;

@Data
public class AddUserCardRequest {
    private String cardId;
    private int quantity;
}
