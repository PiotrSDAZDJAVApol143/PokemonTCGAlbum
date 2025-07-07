package org.example.pokemontcgalbum.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ability {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String namePl;
    @Column(length = 1000)
    private String description;
    @Column(length = 1000)
    private String descriptionPl;
    @Column(name = "rating")
    private Integer rating;

    @ManyToOne
    @JoinColumn(name = "card_id")
    private TcgCard card;
}
