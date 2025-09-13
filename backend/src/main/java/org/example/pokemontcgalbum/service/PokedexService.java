package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.PokedexEntry;
import org.example.pokemontcgalbum.helper.PokedexNameCleaner;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.springframework.stereotype.Service;
import org.example.pokemontcgalbum.model.TcgCard;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PokedexService {
    private final TcgCardRepository cardRepo;

    public List<PokedexEntry> buildPokedex() {
        var cards = cardRepo.findAllPokemonWithDex();

        // grupuj po numerze
        var byDex = cards.stream().collect(Collectors.groupingBy(TcgCard::getPokedexNumber));

        return byDex.entrySet().stream()
                .sorted(Map.Entry.comparingByKey()) // rosnąco po numerze
                .map(e -> {
                    Integer dex = e.getKey();
                    var names = e.getValue().stream()
                            .map(TcgCard::getName)
                            .filter(Objects::nonNull)
                            .map(PokedexNameCleaner::clean)
                            .filter(s -> !s.isBlank())
                            .toList();

                    // policz częstotliwość
                    var freq = names.stream().collect(Collectors.groupingBy(s -> s, Collectors.counting()));

                    // wybierz najczęstszą; przy remisie – najkrótszą
                    String canonical = freq.entrySet().stream()
                            .sorted((a, b) -> {
                                int c = Long.compare(b.getValue(), a.getValue()); // malejąco po liczbie
                                if (c != 0) return c;
                                return Integer.compare(a.getKey().length(), b.getKey().length()); // krótsza wygrywa
                            })
                            .map(Map.Entry::getKey)
                            .findFirst()
                            .orElse("Unknown");

                    // typ – weź najczęstszy nie-null
                    String type = e.getValue().stream()
                            .map(TcgCard::getType)
                            .filter(Objects::nonNull)
                            .collect(Collectors.groupingBy(t -> t, Collectors.counting()))
                            .entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse(null);

                    return new PokedexEntry(dex, canonical, type);
                })
                .toList();
    }
}