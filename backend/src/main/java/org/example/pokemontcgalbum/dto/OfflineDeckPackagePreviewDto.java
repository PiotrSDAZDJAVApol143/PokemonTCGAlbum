package org.example.pokemontcgalbum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OfflineDeckPackagePreviewDto {

    private boolean valid;
    private String message;

    private String packageType;
    private Integer packageVersion;
    private String createdAt;

    private Long deckId;
    private String deckName;
    private String baseEnergy;
    private String secondaryEnergy;

    private int uniqueCards;
    private int totalCards;

    private int imageFileCount;
    private int smallImages;
    private int largeImages;
    private int missingImages;

    private List<String> warnings;
}