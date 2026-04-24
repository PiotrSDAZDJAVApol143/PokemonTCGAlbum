package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.model.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DeckPowerService {

    private final PokemonEvolutionService evolutionService;
    private final PokemonCardIdentityResolver identityResolver;

    public int computeDeckPower(Deck deck) {
        if (deck == null) return 0;

        double total = 0.0;

        Map<String, FamilyBucket> families = new HashMap<>();

        if (deck.getDeckCards() != null && !deck.getDeckCards().isEmpty()) {
            for (DeckCard dc : deck.getDeckCards()) {
                if (dc.getCard() == null) continue;
                total += collectCard(dc.getCard(), dc.getQuantity(), families);
            }
        } else if (deck.getCards() != null && !deck.getCards().isEmpty()) {
            Map<TcgCard, Integer> grouped = new HashMap<>();
            for (UserCardInstance inst : deck.getCards()) {
                if (inst.getCard() == null) continue;
                grouped.merge(inst.getCard(), 1, Integer::sum);
            }

            for (Map.Entry<TcgCard, Integer> e : grouped.entrySet()) {
                total += collectCard(e.getKey(), e.getValue(), families);
            }
        }

        for (FamilyBucket bucket : families.values()) {
            total += bucket.computeScore();
        }

        return (int) Math.round(total);
    }

    private double collectCard(TcgCard card, int qty, Map<String, FamilyBucket> families) {
        int rating = card.getOverallRating() != null ? card.getOverallRating() : 0;

        String supertype = card.getSupertype() == null ? "" : card.getSupertype().toLowerCase();

        if (!supertype.equals("pokémon") && !supertype.equals("pokemon")) {
            return rating * qty;
        }

        PokemonSpeciesEvolution node = evolutionService.getSpeciesNode(card);
        if (node == null) {
            return rating * qty;
        }

        String familyCode = node.getFamilyCode();
        CardState state = identityResolver.resolveCardState(card);

        FamilyBucket bucket = families.computeIfAbsent(familyCode, k -> new FamilyBucket());
        bucket.add(card, node, state, qty);

        return 0.0;
    }

    private static class FamilyBucket {
        int basicNormal;
        int stage1Normal;
        int stage2Normal;

        int exCount;
        int gxCount;
        int vCount;
        int vmaxCount;
        int vstarCount;
        int megaCount;

        double basicNormalScore;
        double stage1NormalScore;
        double stage2NormalScore;

        double exScore;
        double gxScore;
        double vScore;
        double vmaxScore;
        double vstarScore;
        double megaScore;

        void add(TcgCard card, PokemonSpeciesEvolution node, CardState state, int qty) {
            int rating = card.getOverallRating() != null ? card.getOverallRating() : 0;
            double sum = rating * qty;

            if (state == CardState.NORMAL) {
                NormalStage stage = node.getNormalStage();
                if (stage == NormalStage.BASIC) {
                    basicNormal += qty;
                    basicNormalScore += sum;
                } else if (stage == NormalStage.STAGE1) {
                    stage1Normal += qty;
                    stage1NormalScore += sum;
                } else if (stage == NormalStage.STAGE2) {
                    stage2Normal += qty;
                    stage2NormalScore += sum;
                }
                return;
            }

            switch (state) {
                case EX -> {
                    exCount += qty;
                    exScore += sum;
                }
                case GX -> {
                    gxCount += qty;
                    gxScore += sum;
                }
                case V -> {
                    vCount += qty;
                    vScore += sum;
                }
                case VMAX -> {
                    vmaxCount += qty;
                    vmaxScore += sum;
                }
                case VSTAR -> {
                    vstarCount += qty;
                    vstarScore += sum;
                }
                case MEGA -> {
                    megaCount += qty;
                    megaScore += sum;
                }
            }
        }

        double computeScore() {
            double total = 0.0;

            total += basicNormalScore;
            total += stage1NormalScore * stage1Factor(basicNormal, stage1Normal);
            total += stage2NormalScore * stage2Factor(basicNormal, stage1Normal, stage2Normal);

            int bestNormalParent = Math.max(basicNormal, Math.max(stage1Normal, stage2Normal));

            total += exScore * specialBranchFactor(bestNormalParent, exCount);
            total += gxScore * specialBranchFactor(bestNormalParent, gxCount);
            total += vScore * specialBranchFactor(bestNormalParent, vCount);
            total += megaScore * specialBranchFactor(bestNormalParent, megaCount);

            total += vmaxScore * vUpgradeFactor(vCount, vmaxCount);
            total += vstarScore * vUpgradeFactor(vCount, vstarCount);

            return total;
        }

        private static double stage1Factor(int basicCount, int stage1Count) {
            if (stage1Count <= 0) return 1.0;

            double coverage = Math.min(1.0, basicCount / (double) stage1Count);
            double reserve = Math.min(1.0, Math.max(0, basicCount - stage1Count) / (double) stage1Count);

            // zakres:
            // 0.80 -> bardzo słaba baza
            // 1.00 -> układ 1:1
            // 1.20 -> bardzo dobra baza z zapasem
            return 0.80
                    + 0.20 * coverage
                    + 0.20 * reserve;
        }

        private static double stage2Factor(int basicCount, int stage1Count, int stage2Count) {
            if (stage2Count <= 0) return 1.0;

            double stage1Coverage = Math.min(1.0, stage1Count / (double) stage2Count);
            double basicCoverage = Math.min(1.0, basicCount / (double) stage2Count);

            double stage1Reserve = Math.min(1.0, Math.max(0, stage1Count - stage2Count) / (double) stage2Count);
            double basicReserve = Math.min(1.0, Math.max(0, basicCount - stage2Count) / (double) stage2Count);

            // zakres:
            // 0.70 -> bardzo słaba baza
            // 1.00 -> układ 1:1:1
            // 1.30 -> bardzo dobra baza z zapasem
            return 0.70
                    + 0.20 * stage1Coverage
                    + 0.10 * basicCoverage
                    + 0.20 * stage1Reserve
                    + 0.10 * basicReserve;
        }

        private static double specialBranchFactor(int parentCount, int specialCount) {
            if (specialCount <= 0) return 1.0;

            double coverage = Math.min(1.0, parentCount / (double) specialCount);
            double reserve = Math.min(1.0, Math.max(0, parentCount - specialCount) / (double) specialCount);

            // zakres:
            // 0.80 -> słaba baza
            // 1.00 -> układ 1:1
            // 1.20 -> dobra baza z zapasem
            return 0.80
                    + 0.20 * coverage
                    + 0.20 * reserve;
        }

        private static double vUpgradeFactor(int vCount, int upgradeCount) {
            if (upgradeCount <= 0) return 1.0;

            double coverage = Math.min(1.0, vCount / (double) upgradeCount);
            double reserve = Math.min(1.0, Math.max(0, vCount - upgradeCount) / (double) upgradeCount);

            // jeśli chcesz, żeby VMAX/VSTAR działały tak samo jak EX/GX/V/MEGA
            return 0.80
                    + 0.20 * coverage
                    + 0.20 * reserve;
        }
    }
}