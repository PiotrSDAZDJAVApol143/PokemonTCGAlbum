package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class PreloadCardImagesRequest {

    private List<String> cardIds;

    private boolean small = true;
    private boolean large = true;
}