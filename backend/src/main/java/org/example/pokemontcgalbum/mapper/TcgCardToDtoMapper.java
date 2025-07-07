package org.example.pokemontcgalbum.mapper;

import org.example.pokemontcgalbum.dto.*;
import org.example.pokemontcgalbum.model.TcgCard;
import org.springframework.stereotype.Component;
import java.util.List;


@Component
public class TcgCardToDtoMapper {
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
            dto.setSet(setDto);
        }

        // RULES
        if (card.getRules() != null && !card.getRules().isEmpty()) {
            List<TcgRuleDto> ruleDtos = card.getRules().stream().map(rule -> {
                TcgRuleDto r = new TcgRuleDto();
                r.setId(rule.getId());
                r.setText(rule.getText());
                r.setTextPl(rule.getTextPl());
                r.setRating(rule.getRating());
                return r;
            }).toList();
            dto.setRules(ruleDtos);
        }

        // ATTACKS
        if (card.getAttacks() != null && !card.getAttacks().isEmpty()) {
            List<AttackDto> attackDtos = card.getAttacks().stream().map(attack -> {
                AttackDto a = new AttackDto();
                a.setName(attack.getName());
                a.setNamePl(attack.getNamePl());
                a.setCost(attack.getCost());
                a.setDamage(attack.getDamage());
                a.setDescription(attack.getDescription());
                a.setDescriptionPl(attack.getDescriptionPl());
                a.setSpecial(attack.getSpecial());
                a.setRating(attack.getRating());
                return a;
            }).toList();
            dto.setAttacks(attackDtos);
        }

        // ABILITIES
        if (card.getAbilities() != null && !card.getAbilities().isEmpty()) {
            List<AbilityDto> abilityDtos = card.getAbilities().stream().map(ability -> {
                AbilityDto ab = new AbilityDto();
                ab.setName(ability.getName());
                ab.setNamePl(ability.getNamePl());
                ab.setDescription(ability.getDescription());
                ab.setDescriptionPl(ability.getDescriptionPl());
                ab.setRating(ability.getRating());
                return ab;
            }).toList();
            dto.setAbilities(abilityDtos);
        }

        return dto;
    }
}