package org.example.pokemontcgalbum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImageCacheStatsDto {

    private String cacheDir;
    private long fileCount;
    private long totalBytes;
    private double totalMb;
}