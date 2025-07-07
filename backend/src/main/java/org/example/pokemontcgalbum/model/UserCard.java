package org.example.pokemontcgalbum.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "user_cards")
public class UserCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id")
    private TcgCard card;
    private Integer quantity;
    @OneToMany(mappedBy = "userCard", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserCardInDeck> inDecks;
}