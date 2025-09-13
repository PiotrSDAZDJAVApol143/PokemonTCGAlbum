package org.example.pokemontcgalbum.mapper;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.DeckCardDto;
import org.example.pokemontcgalbum.dto.DeckDto;
import org.example.pokemontcgalbum.dto.TcgCardDto;
import org.example.pokemontcgalbum.model.Deck;
import org.example.pokemontcgalbum.model.DeckCard;
import org.example.pokemontcgalbum.model.UserCardInstance;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DeckMapper {

    private final TcgCardMapper tcgCardMapper;
    private final UserCardInstanceMapper userCardInstanceMapper;

    public DeckDto toDto(Deck deck) {
        DeckDto dto = new DeckDto();
        dto.setId(deck.getId());
        dto.setName(deck.getName());
        dto.setBaseEnergy(deck.getBaseEnergy());
        dto.setSecondaryEnergy(deck.getSecondaryEnergy());

        // 1) Najpierw spróbuj z deck_cards (jeśli z nich korzystasz)
        if (deck.getDeckCards() != null && !deck.getDeckCards().isEmpty()) {
            List<DeckCardDto> cardDtos = deck.getDeckCards().stream().map(this::toDeckCardDto).toList();
            dto.setCards(cardDtos);
            return dto;
        }

        // 2) Jeśli nie używasz deck_cards, policz z przypiętych instancji (deck.getCards())
        if (deck.getCards() != null && !deck.getCards().isEmpty()) {
            var byCard = deck.getCards().stream()
                    .collect(Collectors.groupingBy(UserCardInstance::getCard, Collectors.counting()));

            List<DeckCardDto> cardDtos = byCard.entrySet().stream().map(e -> {
                DeckCardDto d = new DeckCardDto();
                d.setId(null);
                d.setCard(tcgCardMapper.toDto(e.getKey()));
                d.setInstance(null);
                d.setQuantity(e.getValue().intValue());
                return d;
            }).toList();

            dto.setCards(cardDtos);
        } else {
            dto.setCards(List.of());
        }

        return dto;
    }
    private DeckCardDto fromInstance(UserCardInstance inst) {
        DeckCardDto dto = new DeckCardDto();
        dto.setId(null); // to jest ID relacji DeckCard — dla instancji nie mamy
        dto.setCard(tcgCardMapper.toDto(inst.getCard()));
        dto.setInstance(userCardInstanceMapper.toDto(inst));
        return dto;
    }

    private DeckCardDto fromDeckCard(DeckCard deckCard) {
        DeckCardDto dto = new DeckCardDto();
        dto.setId(deckCard.getId());
        dto.setCard(deckCard.getCard() != null ? tcgCardMapper.toDto(deckCard.getCard()) : null);
        dto.setInstance(null); // tu agregat, nie konkretna instancja
        return dto;
    }

    public DeckCardDto toDeckCardDto(DeckCard deckCard) {
        DeckCardDto dto = new DeckCardDto();
        dto.setId(deckCard.getId());
        dto.setCard(tcgCardMapper.toDto(deckCard.getCard()));
        dto.setInstance(null);
        dto.setQuantity(deckCard.getQuantity());
        return dto;
    }
}