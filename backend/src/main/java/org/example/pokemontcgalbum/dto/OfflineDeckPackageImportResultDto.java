package org.example.pokemontcgalbum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OfflineDeckPackageImportResultDto {

    private boolean success;
    private String message;

    private Long deckId;
    private String deckName;

    private int importedUniqueCards;
    private int importedTotalCardInstances;

    private int importedImages;
    private int skippedCards;

    private List<String> warnings;

    private DeckDto deck;
}