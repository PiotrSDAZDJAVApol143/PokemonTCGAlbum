package org.example.pokemontcgalbum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCardInstanceDto {
    private Long instanceId;         // ID rekordu user_card (albo po prostu unikalny indeks)
    private String deckName;
    private Integer quantity;
}
