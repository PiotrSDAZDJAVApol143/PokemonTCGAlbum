package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.CardTranslationImport;
import org.example.pokemontcgalbum.mapper.CardRatingCalculator;
import org.example.pokemontcgalbum.model.AbilityDef;
import org.example.pokemontcgalbum.model.AttackDef;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TcgCardService {
    private final TcgCardRepository cardRepository;
    private final AttackRepository attackRepository;
    private final AbilityRepository abilityRepository;
    private final TcgRuleRepository tcgRuleRepository;
    private final CardRatingCalculator ratingCalculator;
    private final DefinitionBindingService defBinder;
    private final AbilityDefRepository abilityDefRepository;
    private final AttackDefRepository attackDefRepository;
    private final RuleDefRepository ruleDefRepository;

    public void setAttackRating(Long attackId, int rating) {
        var attack = attackRepository.findById(attackId)
                .orElseThrow(() -> new RuntimeException("Attack not found"));
        var def = attack.getDef();
        if (def == null) throw new RuntimeException("AttackDef missing for attack " + attackId);
        def.setRating(rating);
        attackDefRepository.save(def);
    }

    public void setAbilityRating(Long abilityId, int rating) {
        var ability = abilityRepository.findById(abilityId)
                .orElseThrow(() -> new RuntimeException("Ability not found"));
        var def = ability.getDef();
        if (def == null) throw new RuntimeException("AbilityDef missing for ability " + abilityId);
        def.setRating(rating);
        abilityDefRepository.save(def);
    }
    public void setAttackDefRating(Long defId, int rating) {
        var def = attackDefRepository.findById(defId)
                .orElseThrow(() -> new RuntimeException("AttackDef not found"));
        def.setRating(rating);
        attackDefRepository.save(def);
    }

    public void setAbilityDefRating(Long defId, int rating) {
        var def = abilityDefRepository.findById(defId)
                .orElseThrow(() -> new RuntimeException("AbilityDef not found"));
        def.setRating(rating);
        abilityDefRepository.save(def);
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
        var def = rule.getDef();
        if (def == null) { // awaryjnie zbinduj, gdyby coś było niepodpięte
            def = defBinder.attachRuleDef(rule);
        }
        def.setRating(rating);
        ruleDefRepository.save(def);
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
        defBinder.bindAllDefs(card);
        return cardRepository.save(card);
    }

    public void deleteById(String id) {
        cardRepository.deleteById(id);
    }

    private static final Pattern CODE = Pattern.compile("(?i)^([A-Z]*\\d{1,3})\\s*/\\s*([A-Z]*\\d{1,3})$");

    private static String onlyDigits(String s) { return s == null ? null : s.replaceAll("\\D+", ""); }
    private static Integer parseIntOrNull(String s) {
        try { return (s == null || s.isBlank()) ? null : Integer.parseInt(s); } catch (Exception e) { return null; }
    }

    /**
     * Sprytne szukanie na potrzeby panelu „Dodaj kartę”.
     * Obsługuje: "TG03/TG30", "TG03", "10tg/TG03", zwykłą nazwę.
     */
    public Page<TcgCard> searchForAddPanel(String q, Pageable pageable) {
        if (q == null || q.isBlank()) {
            return cardRepository.findAll(pageable);
        }
        String s = q.trim();

        // 1) Format z ukośnikiem, np. "TG03/TG30" albo "10tg/TG03"
        Matcher m = CODE.matcher(s);
        if (m.matches()) {
            String left  = m.group(1).toUpperCase(); // np. TG03 lub 10TG
            String right = m.group(2).toUpperCase(); // np. TG30 lub TG03

            // Spróbuj wariantu NUM/TOTAL (TG03/TG30)
            Integer totalDigits = parseIntOrNull(onlyDigits(right)); // 30
            if (totalDigits != null) {
                Page<TcgCard> p = cardRepository.findByNumberInSetAndSet_PrintedTotal(left, totalDigits, pageable);
                if (!p.isEmpty()) return p;
            }

            // Spróbuj wariantu odwrotnego (SETLUBTOTAL/NUM → 10tg/TG03)
            totalDigits = parseIntOrNull(onlyDigits(left));
            if (totalDigits != null) {
                Page<TcgCard> p = cardRepository.findByNumberInSetAndSet_PrintedTotal(right, totalDigits, pageable);
                if (!p.isEmpty()) return p;
            }

            // Ostatecznie: szukaj tylko po numerze w secie (TG03)
            Page<TcgCard> p = cardRepository.findByNumberInSetIgnoreCase(left, pageable);
            if (!p.isEmpty()) return p;
            return cardRepository.findByNumberInSetIgnoreCase(right, pageable);
        }

        // 2) Pojedynczy token z literami i cyframi: "TG03"
        if (s.matches("(?i)^[A-Z]*\\d{1,3}$")) {
            return cardRepository.findByNumberInSetIgnoreCase(s, pageable);
        }

        // 3) Fallback: zwykła nazwa
        return cardRepository.findByNameContainingIgnoreCase(s, pageable);
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
    public int recalcAndSaveCardRating(String cardId) {
        TcgCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        int auto = ratingCalculator.computeAutoRating(card);
        card.setOverallRating(auto);
        cardRepository.save(card);
        return auto;
    }

    public int recalcAllCards() {
        List<TcgCard> all = cardRepository.findAll();
        int cnt = 0;
        for (TcgCard c : all) {
            int r = ratingCalculator.computeAutoRating(c);
            c.setOverallRating(r);
            cnt++;
        }
        cardRepository.saveAll(all);
        return cnt;
    }

    @Transactional
    public void setPokedexNumber(String id, Integer num) {
        var card = cardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Card not found: " + id));
        card.setPokedexNumber(num);
    }
}
