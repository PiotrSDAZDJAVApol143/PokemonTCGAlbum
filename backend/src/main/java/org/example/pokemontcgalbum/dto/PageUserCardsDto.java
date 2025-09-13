package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class PageUserCardsDto {
    private List<UserCardDto> content;
    private int totalPages;
    private int totalElements;
    private int unique;      // liczba unikalnych kart (po id karty)
    private int total;       // liczba wszystkich instancji
    private int duplicates;  // liczba duplikatów (total - unique)
}
