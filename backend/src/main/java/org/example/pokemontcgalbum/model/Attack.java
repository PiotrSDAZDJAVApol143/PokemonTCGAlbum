package org.example.pokemontcgalbum.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attack {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String namePl;        // <-- nowość
    private String cost;
    private String damage;
    @Column(length = 1000)
    private String description;
    @Column(length = 1000)
    private String descriptionPl; // <-- nowość
    private Boolean special;
    @Column(name = "rating")
    private Integer rating;

    @ManyToOne
    @JoinColumn(name = "card_id")
    private TcgCard card;
}
