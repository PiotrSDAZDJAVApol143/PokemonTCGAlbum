package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.model.User;
import org.example.pokemontcgalbum.model.UserCardInstance;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.example.pokemontcgalbum.repository.UserCardInstanceRepository;
import org.example.pokemontcgalbum.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAlbumService {
    private final UserRepository userRepository;
    private final TcgCardRepository cardRepository;
    private final UserCardInstanceRepository userCardInstanceRepository;

    // Zwraca WSZYSTKIE instancje kart usera (czyli "album" z duplikatami)
    public List<UserCardInstance> getUserAlbum(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userCardInstanceRepository.findAllByUser(user);
    }


    // Dodaj n egzemplarzy karty do kolekcji usera
    public void addCardToUserAlbum(Long userId, String cardId, int quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        TcgCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));

        for (int i = 0; i < quantity; i++) {
            UserCardInstance inst = new UserCardInstance();
            inst.setUser(user);
            inst.setCard(card);
            inst.setDeck(null); // na start nieprzypisana
            userCardInstanceRepository.save(inst);
        }
    }

    // Usuwa X instancji danej karty (jeśli user posiada ich mniej, usuwa tyle ile ma)
    public void removeCardFromUserAlbum(Long userId, String cardId, int quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        TcgCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        List<UserCardInstance> instances = userCardInstanceRepository.findAllByUserAndCard(user, card);

        for (int i = 0; i < quantity && i < instances.size(); i++) {
            userCardInstanceRepository.delete(instances.get(i));
        }
    }

    // Usuwa WSZYSTKIE instancje danej karty usera
    public void removeAllCardFromUserAlbum(Long userId, String cardId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        TcgCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        List<UserCardInstance> instances = userCardInstanceRepository.findAllByUserAndCard(user, card);

        for (UserCardInstance inst : instances) {
            userCardInstanceRepository.delete(inst);
        }
    }
}
