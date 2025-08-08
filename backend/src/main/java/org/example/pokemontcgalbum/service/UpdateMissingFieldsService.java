package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.TcgApiCardDto;
import org.example.pokemontcgalbum.dto.TcgApiSetDto;
import org.example.pokemontcgalbum.model.CardSet;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.CardSetRepository;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UpdateMissingFieldsService {
    private final TcgCardRepository cardRepository;
    private final CardSetRepository setRepository;
    private final TcgApiService tcgApiService;

    @Transactional
    public int updateMissingFields() {
        int updatedCards = 0;

        // 1. Uzupełnij dane w setach
        List<CardSet> setsToUpdate = setRepository.findAll().stream()
                .filter(set -> set.getPrintedTotal() == null || set.getTotal() == null)
                .toList();

        for (CardSet set : setsToUpdate) {
            TcgApiSetDto apiSet = tcgApiService.getSetById(set.getId());
            if (apiSet != null) {
                if (set.getPrintedTotal() == null && apiSet.getPrintedTotal() != null) {
                    try {
                        set.setPrintedTotal(Integer.parseInt(apiSet.getPrintedTotal()));
                    } catch (NumberFormatException ignored) {}
                }
                if (set.getTotal() == null && apiSet.getTotal() != null) {
                    try {
                        set.setTotal(Integer.parseInt(apiSet.getTotal()));
                    } catch (NumberFormatException ignored) {}
                }
                setRepository.save(set);
            }
        }

        // 2. Uzupełnij numberInSet w kartach (po ID karty, bez API!)
        List<TcgCard> allCards = cardRepository.findAll();
        for (TcgCard card : allCards) {
            if ((card.getNumberInSet() == null || card.getNumberInSet().isBlank()) && card.getId() != null) {
                String id = card.getId();
                if (id.contains("-")) {
                    String numberPart = id.substring(id.indexOf('-') + 1);
                    card.setNumberInSet(numberPart);
                    cardRepository.save(card);
                    updatedCards++;
                }
            }
        }
        return updatedCards;
    }
}