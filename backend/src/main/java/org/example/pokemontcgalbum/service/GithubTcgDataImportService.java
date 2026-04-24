package org.example.pokemontcgalbum.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.GithubSetDto;
import org.example.pokemontcgalbum.dto.TcgApiCardDto;
import org.example.pokemontcgalbum.mapper.TcgCardMapper;
import org.example.pokemontcgalbum.model.CardSet;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.CardSetRepository;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;


@Service
@RequiredArgsConstructor
public class GithubTcgDataImportService {

    private final WebClient githubRawWebClient;
    private final ObjectMapper objectMapper;
    private final CardSetRepository setRepository;
    private final TcgCardRepository cardRepository;
    private final TcgCardMapper cardMapper;
    private final DefinitionBindingService defBinder;
    private static final DateTimeFormatter GH_DATE = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    /**
     * Importuje plik kart z repo PokemonTCG/pokemon-tcg-data, np. "me1" -> me1.json
     * Zwraca liczbę nowo dodanych kart.
     */
    @Transactional
    public int importSetFile(String fileKey) {
        // fileKey = "me1" / "me2"
        String path = "/PokemonTCG/pokemon-tcg-data/master/cards/en/" + fileKey + ".json";

        String json = githubRawWebClient.get()
                .uri(path)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (json == null || json.isBlank()) return 0;

        try {
            ObjectMapper om = objectMapper.copy()
                    .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            JsonNode root = om.readTree(json);
            if (!root.isArray()) throw new IllegalStateException("Root nie jest tablicą dla: " + fileKey);

            int imported = 0;

            for (JsonNode node : root) {
                TcgApiCardDto dto = om.treeToValue(node, TcgApiCardDto.class);
                if (dto == null || dto.getId() == null) continue;

                if (cardRepository.existsById(dto.getId())) continue; // skip duplikatów

                // setId: z prefiksu id ("me1-1" -> "me1"), fallback na nazwę pliku
                String setId = extractSetId(dto.getId(), fileKey);

                CardSet set = setRepository.findById(setId)
                        .orElseThrow(() -> new RuntimeException(
                                "Brak seta w bazie: " + setId + ". Najpierw dodaj set (ty już to robisz ręcznie)."));

                TcgCard card = cardMapper.toEntity(dto);
                card.setSet(set);

                // safety: numberInSet
                if (card.getNumberInSet() == null || card.getNumberInSet().isBlank()) {
                    card.setNumberInSet(dto.getNumber());
                }

                // kluczowe: definicje (AttackDef/AbilityDef/RuleDef)
                defBinder.bindAllDefs(card);

                cardRepository.save(card);
                imported++;
            }

            return imported;

        } catch (Exception e) {
            throw new RuntimeException("Import nie powiódł się dla: " + fileKey + " -> " + e.getMessage(), e);
        }
    }

    private String extractSetId(String cardId, String fallback) {
        int idx = cardId.indexOf('-');
        if (idx > 0) return cardId.substring(0, idx);
        return fallback;
    }
    @Transactional
    public int syncSetsFromGithub(boolean updateExisting) {
        String path = "/PokemonTCG/pokemon-tcg-data/master/sets/en.json";

        String json = githubRawWebClient.get()
                .uri(path)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (json == null || json.isBlank()) return 0;

        try {
            List<GithubSetDto> sets = objectMapper.readValue(json, new TypeReference<>() {});
            int changed = 0;

            for (GithubSetDto dto : sets) {
                if (dto.getId() == null || dto.getId().isBlank()) continue;

                boolean exists = setRepository.existsById(dto.getId());

                if (exists && !updateExisting) {
                    continue; // tylko dodawanie brakujących
                }

                CardSet entity = exists
                        ? setRepository.findById(dto.getId()).orElseThrow()
                        : new CardSet();

                entity.setId(dto.getId());
                entity.setName(dto.getName());
                entity.setSeries(dto.getSeries());

                if (dto.getImages() != null) {
                    entity.setLogoUrl(dto.getImages().getLogo());
                    entity.setSymbolUrl(dto.getImages().getSymbol());
                }

                if (dto.getReleaseDate() != null && !dto.getReleaseDate().isBlank()) {
                    entity.setReleaseDate(LocalDate.parse(dto.getReleaseDate(), GH_DATE));
                }

                entity.setPrintedTotal(dto.getPrintedTotal());
                entity.setTotal(dto.getTotal());

                setRepository.save(entity);
                changed++;
            }

            return changed;

        } catch (Exception e) {
            throw new RuntimeException("Sync setów nie powiódł się: " + e.getMessage(), e);
        }
    }

}
