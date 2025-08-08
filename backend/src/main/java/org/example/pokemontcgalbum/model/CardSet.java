package org.example.pokemontcgalbum.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardSet {
    @Id
    private String id;
    @Column(name = "set_name")
    private String name;
    private String series;
    @Column(name = "logo_url")
    private String logoUrl;
    @Column(name = "symbol_url")
    private String symbolUrl;
    private Integer printedTotal;
    private Integer total;
    private LocalDate releaseDate;

    @OneToMany(mappedBy = "set")
    private List<TcgCard> cards;
}
