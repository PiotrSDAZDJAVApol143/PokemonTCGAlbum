package org.example.pokemontcgalbum.repository;

import org.example.pokemontcgalbum.dto.PokedexEntry;
import org.example.pokemontcgalbum.model.TcgCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TcgCardRepository extends JpaRepository<TcgCard, String> {
    List<TcgCard> findBySupertype(String supertype);
    boolean existsById(String id);
    List<TcgCard> findBySupertypeAndType(String supertype, String type);

    @Query("""
    SELECT new org.example.pokemontcgalbum.dto.PokedexEntry(
        c.pokedexNumber,
        MIN(c.name),
        MIN(c.type)
    )
    FROM TcgCard c
    WHERE c.supertype = 'Pokémon'
      AND c.pokedexNumber IS NOT NULL
      AND c.name NOT LIKE '% V'
      AND c.name NOT LIKE '%-GX'
      AND c.name NOT LIKE '%-EX'
      AND c.name NOT LIKE '% ex'
      AND c.name NOT LIKE 'Dark %'
      AND c.name NOT LIKE '%''s %'
      AND c.name NOT LIKE '%Alolan %'
      AND c.name NOT LIKE '%Galarian %'
      AND c.name NOT LIKE '%Palean %'
      AND c.name NOT LIKE '%Hisuian %'
      AND c.name NOT LIKE '%Armored %'
      AND c.name NOT LIKE '%Shining %'
      AND c.name NOT LIKE '%Detective %'
      AND c.name NOT LIKE '%Radiant %'
      AND c.name NOT LIKE '%Light %'
      AND c.name NOT LIKE '%flying %'
      AND c.name NOT LIKE '%Dawn Wings %'
      AND c.name NOT LIKE '%Dusk Mane %'
      
      AND c.name NOT LIKE '%Bloodmoon %'
    GROUP BY c.pokedexNumber
    ORDER BY c.pokedexNumber ASC
""")
    List<PokedexEntry> findAllDistinctPokemon();
    Page<TcgCard> findByNameContainingIgnoreCase(String name, Pageable pageable);
    Page<TcgCard> findBySet_Id(String setId, Pageable pageable);
    Page<TcgCard> findByNameContainingIgnoreCaseAndSet_Id(String name, String setId, Pageable pageable);

    @Query("SELECT c FROM TcgCard c JOIN FETCH c.set")
    List<TcgCard> findAllWithSet();

    @Query(
            value = """
        select flavor_text_pl 
        from tcg_card 
        where pokedex_number = :num and flavor_text_pl is not null
        order by rand() 
        limit 1
      """,
            nativeQuery = true)
    String findRandomFlavorPlByPokedex(@Param("num") Integer num);

    // fallback, gdy PL brak:
    @Query(
            value = """
        select flavor_text 
        from tcg_card 
        where pokedex_number = :num and flavor_text is not null
        order by rand() 
        limit 1
      """,
            nativeQuery = true)
    String findRandomFlavorEnByPokedex(@Param("num") Integer num);

    @Query("""
   SELECT c FROM TcgCard c
   WHERE c.supertype = 'Pokémon' AND c.pokedexNumber IS NOT NULL
""")
    List<TcgCard> findAllPokemonWithDex();

    Page<TcgCard> findByNumberInSetAndSet_PrintedTotal(String numberInSet, Integer printedTotal, Pageable pageable);

    Page<TcgCard> findByNumberInSetIgnoreCase(String numberInSet, Pageable pageable);
}