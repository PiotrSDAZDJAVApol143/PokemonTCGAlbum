package org.example.pokemontcgalbum.model;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Getter
@Table(
        name = "pokemon_play_evolution_rule",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_pokemon_play_evolution_rule",
                        columnNames = {
                                "from_pokedex_number",
                                "from_form_code",
                                "from_card_state",
                                "to_pokedex_number",
                                "to_form_code",
                                "to_card_state"
                        }
                )
        }
)
public class PokemonPlayEvolutionRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_code", nullable = false, length = 64)
    private String familyCode;

    @Column(name = "from_pokedex_number", nullable = false)
    private Integer fromPokedexNumber;

    @Column(name = "from_form_code", nullable = false, length = 32)
    private String fromFormCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_card_state", nullable = false, length = 16)
    private CardState fromCardState;

    @Column(name = "to_pokedex_number", nullable = false)
    private Integer toPokedexNumber;

    @Column(name = "to_form_code", nullable = false, length = 32)
    private String toFormCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_card_state", nullable = false, length = 16)
    private CardState toCardState;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false, length = 24)
    private EvolutionRuleType ruleType;

    @Column(name = "notes", length = 255)
    private String notes;

    // getters / setters
}