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
@Table(name = "tcg_card")
public class TcgCard {
    @Id
    private String id; // np. "sv7-45", "ex13-96" itd.

    private String name;
    private String namePl;
    private String supertype;      // "Pokémon" / "Trainer" / "Energy"
    private String subtypes;       // (opcjonalnie: CSV lub relacja jeśli potrzeba wielu podtypów)
    private String stage;          // tylko dla Pokémonów
    private Integer hp;            // tylko dla Pokémonów
    private String type;           // pierwszy typ z tablicy "types", lub null dla Energy/Trainer
    private Integer pokedexNumber; // tylko dla Pokémonów

    @ManyToOne
    @JoinColumn(name = "set_id")
    private CardSet set;

    private String rarity;
    private String imageUrlSmall;
    private String imageUrlLarge;

    @Column(length = 1000)
    private String flavorText;

    @Column(length = 1000)
    private String flavorTextPl;

    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TcgRule> rules;

    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Attack> attacks;

    // Abilities (dla Pokémon, może być puste)
    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Ability> abilities;

    private String weakness;
    private String resistance;
    private Integer retreat;

    private Integer overallRating; // uniwersalny rating

    // Ceny, Cardmarket itd.
    private String cardmarketUrl;
    private Double cardmarketAvgSellPrice;
    private Double cardmarketLowPrice;


}
