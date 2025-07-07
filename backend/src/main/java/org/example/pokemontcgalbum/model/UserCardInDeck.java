package org.example.pokemontcgalbum.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCardInDeck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_card_id")
    private UserCard userCard;

    @ManyToOne
    @JoinColumn(name = "deck_id")
    private Deck deck;

    private Integer quantity; // ile egzemplarzy tej karty jest w tej talii
}
