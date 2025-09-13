package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.*;
import org.example.pokemontcgalbum.repository.AbilityDefRepository;
import org.example.pokemontcgalbum.repository.AttackDefRepository;
import org.example.pokemontcgalbum.repository.RuleDefRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DefinitionBindingService {
    private final AttackDefRepository attackDefRepo;
    private final AbilityDefRepository abilityDefRepo;
    private final RuleDefRepository ruleDefRepo;

    // --- Normalizacja ---

    private static String canonicalName(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }
    private static String canonicalDamage(String s) {
        // zostawiamy oryginalny kształt (np. "20+", "30x"), ale tnij spacje i małe litery
        return s == null ? "" : s.trim().toLowerCase();
    }
    private static String normalizeWhitespace(String s) {
        if (s == null) return "";
        // usuń CR/LF, zredukuj wielokrotne spacje, przytnij
        return s.replaceAll("\\s+", " ").trim().toLowerCase();
    }
    private static String sha256(String s) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] dig = md.digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(dig.length * 2);
            for (byte b : dig) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            // awaryjnie – ale praktycznie się nie zdarzy
            return s;
        }
    }

    /** Klucz: name|damage|sha256(normalizedDescription)  */
    private static String attackKey(String name, String damage, String description) {
        String n = canonicalName(name);
        String d = canonicalDamage(damage);
        String descHash = sha256(normalizeWhitespace(description));
        return n + "|" + d + "|" + descHash;
    }

    public AttackDef attachAttackDef(Attack a) {
        String key = attackKey(a.getName(), a.getDamage(), a.getDescription());
        var def = attackDefRepo.findByCanonicalKey(key).orElseGet(() -> {
            AttackDef d = new AttackDef();
            d.setName(a.getName());
            d.setNamePl(a.getNamePl());
            d.setDescription(a.getDescription());
            d.setDescriptionPl(a.getDescriptionPl());
            d.setDamageText(a.getDamage());
            d.setCanonicalKey(key);
            return attackDefRepo.save(d);
        });
        a.setDef(def);
        return def;
    }

    // Ability bez dmg – zostaje po nazwie
    private static String abilityKey(String s) { return canonicalName(s); }

    public AbilityDef attachAbilityDef(Ability ab) {
        String key = abilityKey(ab.getName());
        var def = abilityDefRepo.findByCanonicalKey(key).orElseGet(() -> {
            AbilityDef d = new AbilityDef();
            d.setName(ab.getName());
            d.setNamePl(ab.getNamePl());
            d.setDescription(ab.getDescription());
            d.setDescriptionPl(ab.getDescriptionPl());
            d.setCanonicalKey(key);
            return abilityDefRepo.save(d);
        });
        ab.setDef(def);
        return def;
    }

    // ---------- Rule ----------
    private static String ruleKey(String text) {
        return sha256(normalizeWhitespace(text));
    }

    private static String firstSentence(String s) {
        if (s == null) return "";
        int dot = s.indexOf('.');
        String t = (dot >= 0 ? s.substring(0, dot) : s).trim();
        return t;
    }
    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    public RuleDef attachRuleDef(TcgRule r) {
        String text = r.getText();
        if (text == null || text.isBlank()) {
            // brak treści – nie tworzymy definicji
            r.setDef(null);
            return null;
        }
        String key = ruleKey(text);
        var def = ruleDefRepo.findByCanonicalKey(key).orElseGet(() -> {
            RuleDef d = new RuleDef();
            d.setName(truncate(firstSentence(text), 255));
            d.setNamePl(null);
            d.setDescription(truncate(text, 1000));
            d.setDescriptionPl(truncate(r.getTextPl(), 1000));
            d.setCanonicalKey(key);
            // rating domyślnie null; migracja zaciągnie MAX z tcg_rule
            return ruleDefRepo.save(d);
        });
        r.setDef(def);
        return def;
    }

    @Transactional
    public void bindAllDefs(TcgCard card) {
        if (card.getAttacks() != null) card.getAttacks().forEach(this::attachAttackDef);
        if (card.getAbilities() != null) card.getAbilities().forEach(this::attachAbilityDef);
        if (card.getRules() != null)    card.getRules().forEach(this::attachRuleDef);

    }
}