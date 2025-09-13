package org.example.pokemontcgalbum.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Table(name = "tcg_rule")
public class TcgRule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String text;

    @Column(length = 1000)
    private String textPl;

    @ManyToOne(optional = false)
    @JoinColumn(name = "def_id")
    private RuleDef def;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id")
    private TcgCard card;
}
