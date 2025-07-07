package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.mapper.TcgCardMapper;
import org.example.pokemontcgalbum.model.CardSet;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.CardSetRepository;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TcgImportService {
    private final TcgApiService tcgApiService;
    private final CardSetRepository cardSetRepository;
    private final TcgCardRepository cardRepository;
    private final TcgCardMapper cardMapper;

    public int importAllTcgCards() {
        var allCards = tcgApiService.getAllCards();  // pobiera wszystko z paginacją!
        int imported = 0;

        for (var cardDto : allCards) {
            // Sprawdź lub utwórz set
            CardSet set = null;
            if (cardDto.getSet() != null) {
                String setId = cardDto.getSet().getId();
                set = cardSetRepository.findById(setId)
                        .orElseGet(() -> {
                            CardSet newSet = CardSet.builder()
                                    .id(setId)
                                    .name(cardDto.getSet().getName())
                                    .series(cardDto.getSet().getSeries())
                                    .logoUrl(cardDto.getSet().getImages() != null ? cardDto.getSet().getImages().getLogo() : null)
                                    .symbolUrl(cardDto.getSet().getImages() != null ? cardDto.getSet().getImages().getSymbol() : null)
                                    .build();
                            return cardSetRepository.save(newSet);
                        });
            }

            // Mapuj DTO na encję
            TcgCard card = cardMapper.toEntity(cardDto);

            // Ustaw set, jeśli istnieje
            if (set != null) {
                card.setSet(set);
            }

            // Zapisz, jeśli nie istnieje
            if (!cardRepository.existsById(card.getId())) {
                cardRepository.save(card);
                imported++;
            }
        }
        return imported;
    }
}


