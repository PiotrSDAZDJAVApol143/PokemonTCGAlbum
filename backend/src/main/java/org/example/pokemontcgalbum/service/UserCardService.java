package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.UserCardDetailsDto;
import org.example.pokemontcgalbum.dto.UserCardInstanceDto;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.model.UserCard;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.example.pokemontcgalbum.repository.UserCardRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserCardService {
    private final UserCardRepository userCardRepo;
    private final TcgCardRepository cardRepo;

    public UserCardDetailsDto getCardDetailsForUser(String cardId, User user) {
        TcgCard card = cardRepo.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        UserCard userCard = userCardRepo.findByUserAndCard(user, card)
                .orElseThrow(() -> new RuntimeException("You don't own this card"));

        UserCardDetailsDto dto = new UserCardDetailsDto();
        dto.setCardId(card.getId());
        dto.setCardName(card.getName());
        dto.setImageUrlLarge(card.getImageUrlLarge());
        dto.setFlavorText(card.getFlavorText());


        List<UserCardInstanceDto> instances = userCard.getInDecks().stream()
                .map(inDeck -> new UserCardInstanceDto(
                        inDeck.getId(),
                        inDeck.getDeck() != null ? inDeck.getDeck().getName() : null,
                        inDeck.getQuantity()
                )).collect(Collectors.toList());


        dto.setInstances(instances);

        return dto;
    }
}
