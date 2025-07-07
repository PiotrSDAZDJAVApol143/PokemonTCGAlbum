package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.model.UserCard;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.example.pokemontcgalbum.repository.UserCardRepository;
import org.example.pokemontcgalbum.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAlbumService {
    private final UserRepository userRepository;
    private final TcgCardRepository cardRepository;
    private final UserCardRepository userCardRepository;

    public List<UserCard> getUserAlbum(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userCardRepository.findByUser(user);
    }

    public UserCard addCardToUserAlbum(Long userId, String cardId, int quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        TcgCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));

        // Jeśli już jest w albumie – zwiększ quantity
        UserCard userCard = userCardRepository.findByUserAndCard(user, card)
                .orElse(UserCard.builder().user(user).card(card).quantity(0).build());

        userCard.setQuantity(userCard.getQuantity() + quantity);
        return userCardRepository.save(userCard);
    }

    public void removeCardFromUserAlbum(Long userId, String cardId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        TcgCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        userCardRepository.findByUserAndCard(user, card)
                .ifPresent(userCardRepository::delete);
    }

}
