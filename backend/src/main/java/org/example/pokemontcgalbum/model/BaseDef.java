package org.example.pokemontcgalbum.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@MappedSuperclass
public abstract class BaseDef {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long id;

    @Column(nullable = false)
    protected String name;

    @Column(name = "name_pl")
    protected String namePl;

    @Column(name = "description", length = 1000)
    protected String description;

    @Column(name = "description_pl", length = 1000)
    protected String descriptionPl;

    @Column(name = "canonical_key",length = 512, nullable = false)
    protected String canonicalKey;

    // globalna ocena, dziedziczona przez wszystkie wystąpienia
    protected Integer rating;
}
