package org.example.pokemontcgalbum.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "pokemon_species_evolution",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_pokemon_species_evolution", columnNames = {"pokedex_number", "form_code"})
        }
)
public class PokemonSpeciesEvolution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_code", nullable = false, length = 64)
    private String familyCode;

    @Column(name = "pokedex_number", nullable = false)
    private Integer pokedexNumber;

    @Column(name = "form_code", nullable = false, length = 32)
    private String formCode;

    @Column(name = "pokemon_name", nullable = false, length = 128)
    private String pokemonName;

    @Column(name = "pokemon_name_pl", length = 128)
    private String pokemonNamePl;

    @Column(name = "evolution_tier", nullable = false)
    private Integer evolutionTier;

    @Enumerated(EnumType.STRING)
    @Column(name = "normal_stage", nullable = false, length = 16)
    private NormalStage normalStage;

    @Column(name = "is_baby", nullable = false)
    private boolean baby;

    @Column(name = "evolves_from_pokedex_number")
    private Integer evolvesFromPokedexNumber;

    @Column(name = "evolves_from_form_code", length = 32)
    private String evolvesFromFormCode;

    @Column(name = "branch_order", nullable = false)
    private Integer branchOrder;

    @Column(name = "notes", length = 255)
    private String notes;
}