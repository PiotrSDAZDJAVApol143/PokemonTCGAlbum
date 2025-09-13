package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.TcgApiCardDto;
import org.example.pokemontcgalbum.dto.TcgApiSetDto;
import org.example.pokemontcgalbum.model.CardSet;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.CardSetRepository;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UpdateMissingFieldsService {
    private final TcgCardRepository cardRepository;
    private final CardSetRepository setRepository;
    private final TcgApiService tcgApiService;

    @Transactional
    public int updateMissingFields() {
        int updatedCards = 0;

        // 1. Uzupełnij dane w setach
        List<CardSet> setsToUpdate = setRepository.findAll().stream()
                .filter(set -> set.getPrintedTotal() == null || set.getTotal() == null || set.getReleaseDate() == null)
                .toList();

        for (CardSet set : setsToUpdate) {
            TcgApiSetDto apiSet = tcgApiService.getSetById(set.getId());
            if (apiSet != null) {
                if (set.getPrintedTotal() == null && apiSet.getPrintedTotal() != null) {
                    try {
                        set.setPrintedTotal(Integer.parseInt(apiSet.getPrintedTotal()));
                    } catch (NumberFormatException ignored) {
                    }
                }
                if (set.getTotal() == null && apiSet.getTotal() != null) {
                    try {
                        set.setTotal(Integer.parseInt(apiSet.getTotal()));
                    } catch (NumberFormatException ignored) {
                    }
                }
                if (set.getReleaseDate() == null && apiSet.getReleaseDate() != null) {
                    LocalDate parsed = parseRelease(apiSet.getReleaseDate());
                    if (parsed != null) set.setReleaseDate(parsed);
                }
                setRepository.save(set);
            }
        }

        // 2. Uzupełnij numberInSet w kartach (po ID karty, bez API!)
        List<TcgCard> allCards = cardRepository.findAll();
        for (TcgCard card : allCards) {
            if ((card.getNumberInSet() == null || card.getNumberInSet().isBlank()) && card.getId() != null) {
                String id = card.getId();
                if (id.contains("-")) {
                    String numberPart = id.substring(id.indexOf('-') + 1);
                    card.setNumberInSet(numberPart);
                    cardRepository.save(card);
                    updatedCards++;
                }
            }
        }
        return updatedCards;
    }

    private LocalDate parseRelease(String raw) {
        // Przykłady z API: "2020/02/07", czasem "2020-02-07"
        String s = raw.trim();
        List<DateTimeFormatter> fmts = List.of(
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                // awaryjnie: same rok/miesiąc → przyjmij 1 dzień
                new DateTimeFormatterBuilder().appendPattern("yyyy/MM").parseDefaulting(ChronoField.DAY_OF_MONTH, 1).toFormatter(),
                new DateTimeFormatterBuilder().appendPattern("yyyy-MM").parseDefaulting(ChronoField.DAY_OF_MONTH, 1).toFormatter()
        );
        for (DateTimeFormatter f : fmts) {
            try { return LocalDate.parse(s, f); } catch (Exception ignored) {}
        }
        return null;
    }

    @Transactional
    public int fillOnlyReleaseDateForSet(String setId) {
        var set = setRepository.findById(setId).orElse(null);
        if (set == null) return 0;
        if (set.getReleaseDate() != null) return 0;

        var api = tcgApiService.getSetById(setId);
        if (api == null || api.getReleaseDate() == null) return 0;

        var parsed = parseRelease(api.getReleaseDate());
        if (parsed == null) return 0;

        set.setReleaseDate(parsed);
        setRepository.save(set);
        return 1;
    }

    @Transactional
    public int fillAllMissingReleaseDates() {
        var sets = setRepository.findAll()
                .stream().filter(s -> s.getReleaseDate() == null).toList();
        int updated = 0;
        for (var set : sets) {
            var api = tcgApiService.getSetById(set.getId());
            if (api == null || api.getReleaseDate() == null) continue;
            var parsed = parseRelease(api.getReleaseDate());
            if (parsed == null) continue;
            set.setReleaseDate(parsed);
            updated++;
        }
        setRepository.saveAll(sets);
        return updated;
    }

    @Transactional
    public int syncReleaseDatesFromApi() {
        // Zaciągnij wszystkie sety z API i zmapuj po ID
        Map<String, TcgApiSetDto> byId = tcgApiService.getAllSetsById();

        // Weź tylko te sety z bazy, które mają pusty releaseDate
        List<CardSet> toUpdate = setRepository.findAll().stream()
                .filter(s -> s.getReleaseDate() == null)
                .toList();

        int updated = 0;
        for (CardSet set : toUpdate) {
            TcgApiSetDto api = byId.get(set.getId());
            if (api == null) continue;
            String raw = api.getReleaseDate();
            if (raw == null || raw.isBlank()) continue;

            LocalDate parsed = parseRelease(raw);
            if (parsed == null) continue;

            set.setReleaseDate(parsed);
            updated++;
        }
        if (updated > 0) {
            setRepository.saveAll(toUpdate); // zapisujemy tylko raz
        }
        return updated;
    }
}