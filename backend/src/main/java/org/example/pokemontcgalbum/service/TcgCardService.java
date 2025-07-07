package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.AbilityRepository;
import org.example.pokemontcgalbum.repository.AttackRepository;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.example.pokemontcgalbum.repository.TcgRuleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TcgCardService {
    private final TcgCardRepository cardRepository;
    private final AttackRepository attackRepository;
    private final AbilityRepository abilityRepository;
    private final TcgRuleRepository tcgRuleRepository;

    public void setAttackRating(Long attackId, int rating) {
        var attack = attackRepository.findById(attackId)
                .orElseThrow(() -> new RuntimeException("Attack not found"));
        attack.setRating(rating);
        attackRepository.save(attack);
    }

    public void setAbilityRating(Long abilityId, int rating) {
        var ability = abilityRepository.findById(abilityId)
                .orElseThrow(() -> new RuntimeException("Ability not found"));
        ability.setRating(rating);
        abilityRepository.save(ability);
    }

    public void setCardRating(String cardId, int rating) {
        var card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Not found"));
        card.setOverallRating(rating);
        cardRepository.save(card);
    }

    public void updateAttackTranslation(Long attackId, String namePl, String descriptionPl) {
        var attack = attackRepository.findById(attackId)
                .orElseThrow(() -> new RuntimeException("Attack not found"));
        attack.setNamePl(namePl);
        attack.setDescriptionPl(descriptionPl);
        attackRepository.save(attack);
    }

    public void updateAbilityTranslation(Long abilityId, String namePl, String descriptionPl) {
        var ability = abilityRepository.findById(abilityId)
                .orElseThrow(() -> new RuntimeException("Ability not found"));
        ability.setNamePl(namePl);
        ability.setDescriptionPl(descriptionPl);
        abilityRepository.save(ability);
    }

    public void setRuleRating(Long ruleId, int rating) {
        var rule = tcgRuleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Rule not found"));
        rule.setRating(rating);
        tcgRuleRepository.save(rule);
    }
    public void updateRuleTranslation(Long ruleId, String textPl) {
        var rule = tcgRuleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Rule not found"));
        rule.setTextPl(textPl);
        tcgRuleRepository.save(rule);
    }

    public void updateCardTranslation(String cardId, String namePl, String flavorTextPl) {
        var card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        card.setNamePl(namePl);
        card.setFlavorTextPl(flavorTextPl);
        cardRepository.save(card);
    }

    public List<TcgCard> findAll() {
       return cardRepository.findAll();
    }
    public Optional<TcgCard> findById(String id) {
      return cardRepository.findById(id);
    }
    public TcgCard save(TcgCard card) {
       return cardRepository.save(card);
    }
    public void deleteById(String id) {
        cardRepository.deleteById(id);
    }
}
