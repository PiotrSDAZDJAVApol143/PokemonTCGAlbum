package org.example.pokemontcgalbum.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.Ability;
import org.example.pokemontcgalbum.model.Attack;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.model.TcgRule;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PokemonExportService {
    private final TcgCardRepository cardRepository;

    public void exportCardsForTranslation(String filePath) throws IOException {
        List<TcgCard> cards = cardRepository.findAll();
        List<Map<String, Object>> exportList = new ArrayList<>();

        for (TcgCard card : cards) {
            try {
            Map<String, Object> cardMap = new LinkedHashMap<>();
            cardMap.put("id", card.getId());
            cardMap.put("name", card.getName());
            cardMap.put("supertype", card.getSupertype());
            cardMap.put("subtypes", card.getSubtypes());
            cardMap.put("flavorText", card.getFlavorText());
            cardMap.put("flavorTextPl", card.getFlavorTextPl());


            // Attacks (jeśli istnieją)
            if (card.getAttacks() != null && !card.getAttacks().isEmpty()) {
                List<Map<String, Object>> attacks = new ArrayList<>();
                for (Attack attack : card.getAttacks()) {
                    Map<String, Object> attackMap = new LinkedHashMap<>();
                    attackMap.put("name", attack.getName());
                    attackMap.put("namePl", attack.getNamePl());
                    attackMap.put("description", attack.getDescription());
                    attackMap.put("descriptionPl", attack.getDescriptionPl());
                    attackMap.put("rating", attack.getRating());
                    attacks.add(attackMap);
                }
                cardMap.put("attacks", attacks);
            }

            // Abilities (jeśli istnieją)
            if (card.getAbilities() != null && !card.getAbilities().isEmpty()) {
                List<Map<String, Object>> abilities = new ArrayList<>();
                for (Ability ability : card.getAbilities()) {
                    Map<String, Object> abilityMap = new LinkedHashMap<>();
                    abilityMap.put("name", ability.getName());
                    abilityMap.put("namePl", ability.getNamePl());
                    abilityMap.put("description", ability.getDescription());
                    abilityMap.put("descriptionPl", ability.getDescriptionPl());
                    abilityMap.put("rating", ability.getRating());
                    abilities.add(abilityMap);
                }
                cardMap.put("abilities", abilities);
            }

            if (card.getRules() != null && !card.getRules().isEmpty()) {
                List<Map<String, Object>> rules = new ArrayList<>();
                for (TcgRule rule : card.getRules()) {
                    Map<String, Object> ruleMap = new LinkedHashMap<>();
                    ruleMap.put("id", rule.getId());
                    ruleMap.put("text", rule.getText());
                    ruleMap.put("textPl", rule.getTextPl());
                    ruleMap.put("rating", rule.getRating());
                    rules.add(ruleMap);
                }
                cardMap.put("rules", rules);
            }

            exportList.add(cardMap);
            } catch (Exception e) {
                System.err.println("Błąd eksportu karty: " + card.getId() + " - " + e.getMessage());
            }
        }

        // Zapisz do pliku JSON
        ObjectMapper mapper = new ObjectMapper();
        mapper.writerWithDefaultPrettyPrinter().writeValue(new File(filePath), exportList);
    }
}
