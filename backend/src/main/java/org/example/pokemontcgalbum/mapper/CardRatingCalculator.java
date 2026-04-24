package org.example.pokemontcgalbum.mapper;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.helper.AttackMath;
import org.example.pokemontcgalbum.model.*;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class CardRatingCalculator {

    // Wagi (suma = 100)
    private static final double HP_WEIGHT        = 30.0;
    private static final double ATTACKS_WEIGHT   = 50.0;
    private static final double ABILITIES_WEIGHT = 10.0;
    private static final double RULES_WEIGHT     = 5.0;
    private static final double RETREAT_WEIGHT   = 5.0;

    // Parametry normalizacji i miękkiego capa
    private static final double ATTACKS_SOFT_K   = 60.0;

    public int computeAutoRating(TcgCard c) {
        if (c == null) return 0;

        // 1) HP (zależne od Stage)
        double hpScore = hpScoreByStage(c.getStage(), safeInt(c.getHp()));

        // 2) Ataki (efektywność + mnożnik za liczbę ataków + miękki cap)
        double attacksScore = attacksScore(c.getAttacks());

        // 3) Abilities (po staremu, ale z twardym capem do 10% wagi)
        double abilitiesScore = abilitiesScore(c.getAbilities());

        // 4) Rules (po staremu, cap do 5% wagi)
        double rulesScore = rulesScore(c.getRules());

        // 5) Retreat (0.RETREAT_WEIGHT)
        double retreatScore = retreatScore(safeInt(c.getRetreat()));

        // Suma i clamp
        double total = hpScore + attacksScore + abilitiesScore + rulesScore + retreatScore;
        total = Math.max(0, Math.min(100, total));

        return (int) Math.round(total);
    }

    // ---------------- HP ----------------

    /** Zwraca punkty w przedziale [0, HP_WEIGHT] zależne od Stage i HP */
    private double hpScoreByStage(String stage, int hp) {
        Range r = hpRangeForStage(stage);
        // normalizacja 0..1 w obrębie widełek dla Stage
        double norm = 0.0;
        if (r.max > r.min) {
            norm = (hp - r.min) / (double)(r.max - r.min);
        }
        norm = clamp01(norm);
        return norm * HP_WEIGHT;
    }

    /** Widełki HP per Stage – możesz dostroić */
    private Range hpRangeForStage(String stage) {
        if ("Stage 2".equalsIgnoreCase(stage)) {
            return new Range(90, 180);
        } else if ("Stage 1".equalsIgnoreCase(stage)) {
            return new Range(70, 140);
        } else { // Basic i wszystko inne
            return new Range(40, 130);
        }
    }

    private record Range(int min, int max) {}

    // ---------------- Ataki ----------------

    /** Ataki → [0, ATTACKS_WEIGHT] */
    private double attacksScore(List<Attack> attacks) {
        if (attacks == null || attacks.isEmpty()) return 0.0;

        double sumEff = 0.0;

        for (Attack a : attacks) {
            int base = AttackMath.parseBaseDamage(a.getDamage());
            int costCount = 0;
            int distinctTypes = 0;
            if (a.getCost() != null && !a.getCost().isBlank()) {
                String[] parts = a.getCost().split(",");
                costCount = parts.length;
                Set<String> distinct = new HashSet<>();
                for (String p : parts) {
                    String t = p.trim().toLowerCase();
                    if (!t.isEmpty()) distinct.add(t);
                }
                distinctTypes = distinct.size();
            }
            // podstawowa efektywność
            double eff = (double) base / Math.max(1, costCount);

            // kara za mix energii
            if (distinctTypes > 1) {
                eff *= Math.pow(0.85, distinctTypes - 1);
            }

            // wzmocnienia za „+” i „×” (ocena oczekiwana, nie maks)
            boolean hasPlus = AttackMath.hasPlus(a.getDamage());
            boolean hasTimes = AttackMath.hasTimes(a.getDamage());
            if (hasPlus)  eff *= 1.25;  // 25% więcej jeśli atak ma „+” (warunkowe skalowanie)
            if (hasTimes) eff *= 1.40;  // 40% więcej jeśli ma mnożnik „×”

            // Dev bonus (wagi subiektywne) – lekko, niech nie dominuje
            int dev = safeInt(a.getDef() != null ? a.getDef().getRating() : null);
            eff += dev * 1.0;

            sumEff += Math.max(0, eff);
        }

        // mnożnik za liczbę ataków (większy wachlarz opcji = lepiej)
        double countMul = attacks.size() >= 3 ? 1.30 : (attacks.size() == 2 ? 1.20 : 1.00);
        sumEff *= countMul;

        // miękki cap do ATTACKS_WEIGHT
        // skaluje sumę efektywności do [0, 1), potem do wagi
        double scaled = (1.0 - Math.exp(-sumEff / ATTACKS_SOFT_K));
        return scaled * ATTACKS_WEIGHT;
    }

    // ---------------- Abilities / Rules ----------------

    /** Abilities oceniane dev-ratingiem (×2) i soft cap do ABILITIES_WEIGHT */
    private double abilitiesScore(List<Ability> abilities) {
        if (abilities == null || abilities.isEmpty()) return 0.0;
        double raw = 0.0;
        for (Ability ab : abilities) {
            raw += safeInt(ab.getDef() != null ? ab.getDef().getRating() : null) * 2.0;
        }
        // przeskaluj do ABILITIES_WEIGHT
        // 10 pkt „raw” ~ połowa; 20 „raw” ~ sufit
        double scaled = (1.0 - Math.exp(-raw / 10.0)) * ABILITIES_WEIGHT;
        return clamp(0, ABILITIES_WEIGHT, scaled);
    }

    /** Rules – suma dev-ratingów, skala do RULES_WEIGHT */
    private double rulesScore(List<TcgRule> rules) {
        if (rules == null || rules.isEmpty()) return 0.0;
        double raw = 0.0;
        for (TcgRule r : rules) {
            raw += safeInt(r.getDef() != null ? r.getDef().getRating() : null);
        }
        double scaled = (1.0 - Math.exp(-raw / 8.0)) * RULES_WEIGHT;
        return clamp(0, RULES_WEIGHT, scaled);
    }

    // ---------------- Retreat ----------------

    /** Retreat – preferujemy niskie koszty ucieczki */
    private double retreatScore(int retreat) {
        // 0 → 5.0, 1 → 3.5, 2 → 2.0, 3 → 0.5, >=4 → 0
        double[] table = {5.0, 3.5, 2.0, 0.5, 0.0};
        double pts = retreat >= 0 && retreat < table.length ? table[retreat] : 0.0;
        // przeskaluj do RETREAT_WEIGHT (tu tabela już jest w tej skali)
        return clamp(0, RETREAT_WEIGHT, pts);
    }

    // ---------------- Utils ----------------

    private static double clamp01(double v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
    private static double clamp(double min, double max, double v) { return Math.max(min, Math.min(max, v)); }
    private static int safeInt(Integer v) { return v == null ? 0 : v; }
}
