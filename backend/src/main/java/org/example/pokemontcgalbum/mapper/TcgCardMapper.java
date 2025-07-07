package org.example.pokemontcgalbum.mapper;

import org.example.pokemontcgalbum.dto.TcgApiAbilityDto;
import org.example.pokemontcgalbum.dto.TcgApiAttackDto;
import org.example.pokemontcgalbum.dto.TcgApiCardDto;
import org.example.pokemontcgalbum.model.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TcgCardMapper {
    public TcgCard toEntity(TcgApiCardDto dto) {
        if (dto == null) return null;

        TcgCard card = new TcgCard();
        card.setId(dto.getId());
        card.setName(dto.getName());
        card.setSupertype(dto.getSupertype());
        card.setSubtypes(dto.getSubtypes() != null ? String.join(",", dto.getSubtypes()) : null);
        card.setStage(dto.getSubtypes() != null && !dto.getSubtypes().isEmpty() ? dto.getSubtypes().get(0) : null);
        // HP
        card.setHp(dto.getHp() != null ? tryParseInt(dto.getHp()) : null);
        // Typ (np. Water, Grass, ... pierwsza na liście)
        card.setType(dto.getTypes() != null && !dto.getTypes().isEmpty() ? dto.getTypes().get(0) : null);
        // Rarity, images, flavorText
        card.setRarity(dto.getRarity());
        card.setImageUrlSmall(dto.getImages() != null ? dto.getImages().getSmall() : null);
        card.setImageUrlLarge(dto.getImages() != null ? dto.getImages().getLarge() : null);
        card.setFlavorText(dto.getFlavorText());

        // Weakness (pierwszy element na razie)
        card.setWeakness(dto.getWeaknesses() != null && !dto.getWeaknesses().isEmpty()
                ? dto.getWeaknesses().get(0).getType() : null);
        // Koszt wycofania
        card.setRetreat(dto.getConvertedRetreatCost());

        if (dto.getSet() != null) {
            CardSet set = CardSet.builder()
                    .id(dto.getSet().getId())
                    .name(dto.getSet().getName())
                    .series(dto.getSet().getSeries())
                    .logoUrl(dto.getSet().getImages() != null ? dto.getSet().getImages().getLogo() : null)
                    .symbolUrl(dto.getSet().getImages() != null ? dto.getSet().getImages().getSymbol() : null)
                    .build();
            card.setSet(set);
        }

        // NationalPokedexNumbers → pokedexNumber
        card.setPokedexNumber(dto.getPokedexNumber() != null && !dto.getPokedexNumber().isEmpty()
                ? dto.getPokedexNumber().get(0) : null);

        if (dto.getRules() != null && !dto.getRules().isEmpty()) {
            List<TcgRule> rules = new ArrayList<>();
            for (String ruleText : dto.getRules()) {
                TcgRule rule = new TcgRule();
                rule.setText(ruleText);
                rule.setCard(card);
                rules.add(rule);
            }
            card.setRules(rules);
        }
        // MAPOWANIE ATTACKS
        if (dto.getAttacks() != null && !dto.getAttacks().isEmpty()) {
            List<Attack> attackList = new ArrayList<>();
            for (TcgApiAttackDto attackDto : dto.getAttacks()) {
                Attack attack = new Attack();
                attack.setName(attackDto.getName());
                attack.setCost(attackDto.getCost() != null ? String.join(",", attackDto.getCost()) : null);
                attack.setDamage(attackDto.getDamage());
                attack.setDescription(attackDto.getText());
                attack.setSpecial(false); // Rozwijaj jeśli chcesz wykrywać
                attack.setCard(card);
                attackList.add(attack);
            }
            card.setAttacks(attackList);
        }

        // MAPOWANIE ABILITIES
        if (dto.getAbilities() != null && !dto.getAbilities().isEmpty()) {
            List<Ability> abilityList = new ArrayList<>();
            for (TcgApiAbilityDto abilityDto : dto.getAbilities()) {
                Ability ability = new Ability();
                ability.setName(abilityDto.getName());
                ability.setDescription(abilityDto.getText());
                ability.setCard(card);
                abilityList.add(ability);
            }
            card.setAbilities(abilityList);
        }

        if (dto.getCardmarket() != null) {
            card.setCardmarketUrl(dto.getCardmarket().getUrl());
            if (dto.getCardmarket().getPrices() != null) {
                card.setCardmarketAvgSellPrice(dto.getCardmarket().getPrices().getAverageSellPrice());
                card.setCardmarketLowPrice(dto.getCardmarket().getPrices().getLowPrice());
            }
        }
            return card;
        }


    // Pomocnicza metoda do bezpiecznego parsowania
    private Integer tryParseInt(String val) {
        try {
            return Integer.parseInt(val);
        } catch (Exception e) {
            return null;
        }
    }
}