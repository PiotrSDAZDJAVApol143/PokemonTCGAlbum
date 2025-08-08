package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class PageUserCardsDto {
    private List<UserCardDto> content;
    private int totalPages;
    private int totalElements;
    private int unique;      // unikalne karty (ile różnych)
    private int total;       // wszystkie karty (z duplikatami)
    private int duplicates;  // liczba duplikatów
}
