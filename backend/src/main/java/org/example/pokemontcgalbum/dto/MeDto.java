package org.example.pokemontcgalbum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MeDto {
    private Long id;
    private String username;
    private String role;
}