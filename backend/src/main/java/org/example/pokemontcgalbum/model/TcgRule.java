package org.example.pokemontcgalbum.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "tcg_rule")
public class TcgRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Reguła w oryginale (angielski)
    @Column(length = 1000)
    private String text;

    // Tłumaczenie na PL
    @Column(length = 1000)
    private String textPl;

    // Rating tej zasady (opcjonalnie)
    private Integer rating;

    // Powiązanie z kartą
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id")
    private TcgCard card;
}
