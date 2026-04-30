package org.example.pokemontcgalbum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImagePreloadResultDto {

    private int requestedCards;
    private int requestedImages;

    private int successImages;
    private int failedImages;

    private List<String> failedCardIds;

    private ImageCacheStatsDto cacheStats;
}