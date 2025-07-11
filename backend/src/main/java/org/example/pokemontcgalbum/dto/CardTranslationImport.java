package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class CardTranslationImport {
    public String id;
    public String namePl;
    public String flavorTextPl;
    public List<AttackTranslation> attacks;
    public List<AbilityTranslation> abilities;
    public List<RuleTranslation> rules;

    @Data
    public static class AttackTranslation {
        public String namePl;
        public String descriptionPl;
    }
    @Data
    public static class AbilityTranslation {
        public String namePl;
        public String descriptionPl;
    }
    @Data
    public static class RuleTranslation {
        public String textPl;
    }
}
