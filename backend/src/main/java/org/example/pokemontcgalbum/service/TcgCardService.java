package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.CardTranslationImport;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.AbilityRepository;
import org.example.pokemontcgalbum.repository.AttackRepository;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.example.pokemontcgalbum.repository.TcgRuleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public int updateTranslationsFromImport(List<CardTranslationImport> cards) {
        int count = 0;
        for (CardTranslationImport imp : cards) {
            var cardOpt = cardRepository.findById(imp.id);
            if (cardOpt.isEmpty()) continue;
            TcgCard card = cardOpt.get();

            if (imp.namePl != null && !imp.namePl.equalsIgnoreCase("brak")) card.setNamePl(imp.namePl);
            if (imp.flavorTextPl != null && !imp.flavorTextPl.equalsIgnoreCase("brak"))
                card.setFlavorTextPl(imp.flavorTextPl);

            // Ataki
            if (imp.attacks != null && card.getAttacks() != null) {
                for (int i = 0; i < Math.min(imp.attacks.size(), card.getAttacks().size()); i++) {
                    var atkImp = imp.attacks.get(i);
                    var atk = card.getAttacks().get(i);
                    if (atkImp.namePl != null && !atkImp.namePl.equalsIgnoreCase("brak")) atk.setNamePl(atkImp.namePl);
                    if (atkImp.descriptionPl != null && !atkImp.descriptionPl.equalsIgnoreCase("brak"))
                        atk.setDescriptionPl(atkImp.descriptionPl);
                }
            }
            // Abilities
            if (imp.abilities != null && card.getAbilities() != null) {
                for (int i = 0; i < Math.min(imp.abilities.size(), card.getAbilities().size()); i++) {
                    var abImp = imp.abilities.get(i);
                    var ab = card.getAbilities().get(i);
                    if (abImp.namePl != null && !abImp.namePl.equalsIgnoreCase("brak")) ab.setNamePl(abImp.namePl);
                    if (abImp.descriptionPl != null && !abImp.descriptionPl.equalsIgnoreCase("brak"))
                        ab.setDescriptionPl(abImp.descriptionPl);
                }
            }
            // Rules
            if (imp.rules != null && card.getRules() != null) {
                for (int i = 0; i < Math.min(imp.rules.size(), card.getRules().size()); i++) {
                    var ruleImp = imp.rules.get(i);
                    var rule = card.getRules().get(i);
                    if (ruleImp.textPl != null && !ruleImp.textPl.equalsIgnoreCase("brak"))
                        rule.setTextPl(ruleImp.textPl);
                }
            }

            cardRepository.save(card);
            count++;
        }
        return count;
    }
    public Page<TcgCard> findAll(Pageable pageable) {
        return cardRepository.findAll(pageable);
    }
    public Page<TcgCard> findByName(String name, Pageable pageable) {
        return cardRepository.findByNameContainingIgnoreCase(name, pageable);
    }
    public Page<TcgCard> findBySet(String setId, Pageable pageable) {
        return cardRepository.findBySet_Id(setId, pageable);
    }
    public Page<TcgCard> findByNameAndSet(String name, String setId, Pageable pageable) {
        return cardRepository.findByNameContainingIgnoreCaseAndSet_Id(name, setId, pageable);
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

    public Page<TcgCard> findByNumberInSetAndPrintedTotal(String numberInSet, String printedTotal, Pageable pageable) {
        // Zamień printedTotal na Integer!
        String normalizedNumberInSet = normalizeNumber(numberInSet);
        int printedTotalInt;
        try {
            printedTotalInt = Integer.parseInt(printedTotal.replaceFirst("^0+(?!$)", "")); // usunie zera z przodu
        } catch (NumberFormatException e) {
            return Page.empty(pageable);
        }
        // Szukaj po normalizedNumberInSet i printedTotalInt
        return cardRepository.findByNumberInSetAndSet_PrintedTotal(normalizedNumberInSet, printedTotalInt, pageable);
    }

    private String normalizeNumber(String number) {
        if (number == null) return null;
        try {
            // Usuwa zera z przodu: "001" -> "1"
            return String.valueOf(Integer.parseInt(number));
        } catch (NumberFormatException e) {
            // Jeśli nie liczba, zwraca oryginał
            return number;
        }
    }
}
