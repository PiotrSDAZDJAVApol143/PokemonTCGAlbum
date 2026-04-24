package org.example.pokemontcgalbum.mapper;

import org.example.pokemontcgalbum.dto.*;
import org.example.pokemontcgalbum.model.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class TcgCardMapper {
    public TcgCard toEntity(TcgApiCardDto dto) {
        if (dto == null) return null;

        TcgCard card = new TcgCard();
        card.setId(dto.getId());
        card.setNumberInSet(dto.getNumber());  // numberInSet z pola "number" (np. "1", "TG03", itd.)
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
                if (ruleText == null || ruleText.isBlank()) continue; // <-- ważne
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
               // ability.setId(ability.getId());
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

    public TcgCardDto toDto(TcgCard card) {
        if (card == null) return null;

        TcgCardDto dto = new TcgCardDto();
        dto.setId(card.getId());
        dto.setName(card.getName());
        dto.setSupertype(card.getSupertype());
        dto.setSubtypes(card.getSubtypes()); // CSV string, można rozbić na listę na froncie jeśli trzeba
        dto.setStage(card.getStage());
        dto.setHp(card.getHp());
        dto.setType(card.getType());
        dto.setPokedexNumber(card.getPokedexNumber());
        dto.setRarity(card.getRarity());
        dto.setImageUrlSmall(card.getImageUrlSmall());
        dto.setImageUrlLarge(card.getImageUrlLarge());
        dto.setNumberInSet(card.getNumberInSet());

        // Official artwork URL na podstawie pokedexNumber
        if (card.getPokedexNumber() != null && card.getPokedexNumber() > 0) {
            String artworkUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/" + card.getPokedexNumber() + ".png";
            dto.setOfficialArtworkUrl(artworkUrl);
        }

        dto.setFlavorText(card.getFlavorText());
        dto.setFlavorTextPl(card.getFlavorTextPl());
        dto.setWeakness(card.getWeakness());
        dto.setResistance(card.getResistance());
        dto.setRetreat(card.getRetreat());
        dto.setOverallRating(card.getOverallRating());
        dto.setCardmarketUrl(card.getCardmarketUrl());
        dto.setCardmarketAvgSellPrice(card.getCardmarketAvgSellPrice());
        dto.setCardmarketLowPrice(card.getCardmarketLowPrice());

        // SET
        if (card.getSet() != null) {
            CardSetDto setDto = new CardSetDto();
            setDto.setId(card.getSet().getId());
            setDto.setName(card.getSet().getName());
            setDto.setSeries(card.getSet().getSeries());
            setDto.setLogoUrl(card.getSet().getLogoUrl());
            setDto.setSymbolUrl(card.getSet().getSymbolUrl());
            setDto.setReleaseDate(card.getSet().getReleaseDate() != null
                    ? card.getSet().getReleaseDate().toString()
                    : null);
            setDto.setPrintedTotal(card.getSet().getPrintedTotal());
            dto.setSet(setDto);
        }

        // RULES
        if (card.getRules() != null && !card.getRules().isEmpty()) {
            List<TcgRuleDto> ruleDtos = card.getRules().stream().map(rule -> {
                TcgRuleDto r = new TcgRuleDto();
                r.setId(rule.getId());
                r.setText(rule.getText());
                r.setTextPl(rule.getTextPl());
                r.setRating(rule.getDef() != null ? rule.getDef().getRating() : null);
                r.setDefId(rule.getDef() != null ? rule.getDef().getId() : null);
                return r;
            }).toList();
            dto.setRules(ruleDtos);
        }

        // ATTACKS
        if (card.getAttacks() != null && !card.getAttacks().isEmpty()) {
            List<AttackDto> attackDtos = card.getAttacks().stream().map(attack -> {
                AttackDto a = new AttackDto();
                a.setId(attack.getId());
                a.setName(attack.getName());
                a.setNamePl(attack.getNamePl());
                a.setCost(attack.getCost());
                a.setDamage(attack.getDamage());
                a.setDescription(attack.getDescription());
                a.setDescriptionPl(attack.getDescriptionPl());
                a.setSpecial(attack.getSpecial());
                Long defId = (attack.getDef() != null ? attack.getDef().getId() : null);
                Integer defRating = (attack.getDef() != null ? attack.getDef().getRating() : null);
                a.setDefId(defId);
                a.setDefRating(defRating);
                return a;
            }).toList();
            dto.setAttacks(attackDtos);
        }

        // ABILITIES
        if (card.getAbilities() != null && !card.getAbilities().isEmpty()) {
            List<AbilityDto> abilityDtos = card.getAbilities().stream().map(ability -> {
                AbilityDto ab = new AbilityDto();
                ab.setId(ability.getId());
                ab.setDefId(ability.getDef() != null ? ability.getDef().getId() : null);
                ab.setName(ability.getName());
                ab.setNamePl(ability.getNamePl());
                ab.setDescription(ability.getDescription());
                ab.setDescriptionPl(ability.getDescriptionPl());
                ab.setRating(ability.getDef() != null ? ability.getDef().getRating() : null);
                return ab;
            }).toList();
            dto.setAbilities(abilityDtos);
        }

        return dto;
    }
}