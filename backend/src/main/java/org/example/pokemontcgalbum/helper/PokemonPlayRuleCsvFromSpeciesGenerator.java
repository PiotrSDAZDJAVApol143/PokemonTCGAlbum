package org.example.pokemontcgalbum.helper;

import org.example.pokemontcgalbum.model.CardState;
import org.example.pokemontcgalbum.model.EvolutionRuleType;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class PokemonPlayRuleCsvFromSpeciesGenerator {

    private static final Path INPUT = Path.of(
            "backend", "src", "main", "resources", "db", "scripts", "data", "pokemon_species_evolution.csv"
    );

    private static final Path OUTPUT = Path.of(
            "backend", "src", "main", "resources", "db", "scripts", "data", "pokemon_play_evolution_rule.csv"
    );

    /**
     * Domowe gałęzie specjalne:
     * NORMAL -> EX / GX / V / MEGA
     */
    private static final List<CardState> DIRECT_SPECIAL_BRANCH_STATES = List.of(
            CardState.EX,
            CardState.GX,
            CardState.V,
            CardState.MEGA
    );

    /**
     * Domowy łańcuch specjalny:
     * V -> VMAX / VSTAR
     */
    private static final List<CardState> V_CHAIN_STATES = List.of(
            CardState.VMAX,
            CardState.VSTAR
    );

    public static void main(String[] args) throws Exception {
        System.out.println("Katalog roboczy: " + Path.of("").toAbsolutePath().normalize());
        System.out.println("Plik wejściowy: " + INPUT.toAbsolutePath().normalize());
        System.out.println("Plik wyjściowy: " + OUTPUT.toAbsolutePath().normalize());

        new PokemonPlayRuleCsvFromSpeciesGenerator().run();
    }

    public void run() throws Exception {
        if (!Files.exists(INPUT)) {
            throw new IllegalStateException("Brak pliku wejściowego: " + INPUT.toAbsolutePath().normalize());
        }

        List<SpeciesRow> speciesRows = readSpeciesRows(INPUT);
        List<PlayRuleRow> rules = generateRules(speciesRows);
        writeRules(rules, OUTPUT);

        long standardCount = rules.stream().filter(r -> r.ruleType() == EvolutionRuleType.STANDARD).count();
        long specialBranchCount = rules.stream().filter(r -> r.ruleType() == EvolutionRuleType.SPECIAL_BRANCH).count();
        long specialChainCount = rules.stream().filter(r -> r.ruleType() == EvolutionRuleType.SPECIAL_CHAIN).count();

        System.out.println("Wygenerowano: " + OUTPUT.toAbsolutePath().normalize());
        System.out.println("Liczba wszystkich reguł: " + rules.size());
        System.out.println("STANDARD: " + standardCount);
        System.out.println("SPECIAL_BRANCH: " + specialBranchCount);
        System.out.println("SPECIAL_CHAIN: " + specialChainCount);
    }

    private List<PlayRuleRow> generateRules(List<SpeciesRow> speciesRows) {
        List<PlayRuleRow> rules = new ArrayList<>();
        Set<RuleKey> uniqueKeys = new LinkedHashSet<>();

        for (SpeciesRow row : speciesRows) {
            String familyCode = safeText(row.familyCode());
            String selfFormCode = safeFormCode(row.formCode());

            // 1. Zwykła ewolucja: parent NORMAL -> child NORMAL
            if (row.evolvesFromPokedexNumber() != null) {
                addRule(
                        uniqueKeys,
                        rules,
                        familyCode,
                        row.evolvesFromPokedexNumber(),
                        safeFormCode(row.evolvesFromFormCode()),
                        CardState.NORMAL,
                        row.pokedexNumber(),
                        selfFormCode,
                        CardState.NORMAL,
                        EvolutionRuleType.STANDARD,
                        "Standard evolution from species tree"
                );
            }

            // Baby nie dostaje gałęzi specjalnych
            if (row.isBaby()) {
                continue;
            }

            // 2. Specjalna gałąź: NORMAL -> EX/GX/V/MEGA
            for (CardState specialState : DIRECT_SPECIAL_BRANCH_STATES) {
                addRule(
                        uniqueKeys,
                        rules,
                        familyCode,
                        row.pokedexNumber(),
                        selfFormCode,
                        CardState.NORMAL,
                        row.pokedexNumber(),
                        selfFormCode,
                        specialState,
                        EvolutionRuleType.SPECIAL_BRANCH,
                        "House rule: NORMAL can branch into same-species special state " + specialState.name()
                );
            }

            // 3. Specjalny łańcuch: V -> VMAX / VSTAR
            for (CardState vChainState : V_CHAIN_STATES) {
                addRule(
                        uniqueKeys,
                        rules,
                        familyCode,
                        row.pokedexNumber(),
                        selfFormCode,
                        CardState.V,
                        row.pokedexNumber(),
                        selfFormCode,
                        vChainState,
                        EvolutionRuleType.SPECIAL_CHAIN,
                        "House rule: V can continue into same-species state " + vChainState.name()
                );
            }
        }

        rules.sort(
                Comparator.comparing(PlayRuleRow::familyCode)
                        .thenComparingInt(PlayRuleRow::fromPokedexNumber)
                        .thenComparing(r -> r.fromFormCode() == null ? "" : r.fromFormCode())
                        .thenComparingInt(r -> r.fromCardState().ordinal())
                        .thenComparingInt(PlayRuleRow::toPokedexNumber)
                        .thenComparing(r -> r.toFormCode() == null ? "" : r.toFormCode())
                        .thenComparingInt(r -> r.toCardState().ordinal())
        );

        return rules;
    }

    private void addRule(
            Set<RuleKey> uniqueKeys,
            List<PlayRuleRow> rules,
            String familyCode,
            Integer fromPokedexNumber,
            String fromFormCode,
            CardState fromCardState,
            Integer toPokedexNumber,
            String toFormCode,
            CardState toCardState,
            EvolutionRuleType ruleType,
            String notes
    ) {
        if (familyCode == null || familyCode.isBlank()) return;
        if (fromPokedexNumber == null || toPokedexNumber == null) return;
        if (fromFormCode == null || fromFormCode.isBlank()) return;
        if (toFormCode == null || toFormCode.isBlank()) return;
        if (fromCardState == null || toCardState == null || ruleType == null) return;

        RuleKey key = new RuleKey(
                fromPokedexNumber,
                fromFormCode,
                fromCardState,
                toPokedexNumber,
                toFormCode,
                toCardState
        );

        if (!uniqueKeys.add(key)) {
            return;
        }

        rules.add(new PlayRuleRow(
                familyCode,
                fromPokedexNumber,
                fromFormCode,
                fromCardState,
                toPokedexNumber,
                toFormCode,
                toCardState,
                ruleType,
                safeText(notes)
        ));
    }

    private List<SpeciesRow> readSpeciesRows(Path input) throws IOException {
        List<SpeciesRow> rows = new ArrayList<>();

        try (BufferedReader reader = Files.newBufferedReader(input, StandardCharsets.UTF_8)) {
            String header = reader.readLine(); // pomijamy nagłówek
            if (header == null) {
                return rows;
            }

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                String[] parts = parseCsvLine(line);

                if (parts.length < 12) {
                    throw new IllegalStateException("Nieprawidłowy wiersz CSV. Oczekiwano 12 kolumn, jest: " + parts.length + " | " + line);
                }

                rows.add(new SpeciesRow(
                        unq(parts[0]),
                        parseInt(parts[1]),
                        unq(parts[2]),
                        unq(parts[3]),
                        unq(parts[4]),
                        parseInt(parts[5]),
                        unq(parts[6]),
                        parseBoolean(parts[7]),
                        isBlank(parts[8]) ? null : parseInt(parts[8]),
                        isBlank(parts[9]) ? null : unq(parts[9]),
                        parseInt(parts[10]),
                        unq(parts[11])
                ));
            }
        }

        return rows;
    }

    private void writeRules(List<PlayRuleRow> rules, Path output) throws IOException {
        Files.createDirectories(output.getParent());

        try (BufferedWriter writer = Files.newBufferedWriter(output, StandardCharsets.UTF_8)) {
            writer.write("family_code,from_pokedex_number,from_form_code,from_card_state,to_pokedex_number,to_form_code,to_card_state,rule_type,notes");
            writer.newLine();

            for (PlayRuleRow row : rules) {
                writer.write(csv(row.familyCode()));
                writer.write(",");
                writer.write(String.valueOf(row.fromPokedexNumber()));
                writer.write(",");
                writer.write(csv(row.fromFormCode()));
                writer.write(",");
                writer.write(csv(row.fromCardState().name()));
                writer.write(",");
                writer.write(String.valueOf(row.toPokedexNumber()));
                writer.write(",");
                writer.write(csv(row.toFormCode()));
                writer.write(",");
                writer.write(csv(row.toCardState().name()));
                writer.write(",");
                writer.write(csv(row.ruleType().name()));
                writer.write(",");
                writer.write(csv(row.notes()));
                writer.newLine();
            }
        }
    }

    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);

            if (ch == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch == ',' && !inQuotes) {
                fields.add(current.toString());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }

        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }

    private boolean parseBoolean(String value) {
        return Boolean.parseBoolean(unq(value));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isBlank();
    }

    private int parseInt(String value) {
        return Integer.parseInt(unq(value));
    }

    private String unq(String value) {
        return value == null ? null : value.trim();
    }

    private String safeFormCode(String value) {
        String normalized = safeText(value);
        return normalized.isBlank() ? "NORMAL" : normalized;
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String csv(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    record SpeciesRow(
            String familyCode,
            int pokedexNumber,
            String formCode,
            String pokemonName,
            String pokemonNamePl,
            int evolutionTier,
            String normalStage,
            boolean isBaby,
            Integer evolvesFromPokedexNumber,
            String evolvesFromFormCode,
            int branchOrder,
            String notes
    ) {
    }

    record PlayRuleRow(
            String familyCode,
            int fromPokedexNumber,
            String fromFormCode,
            CardState fromCardState,
            int toPokedexNumber,
            String toFormCode,
            CardState toCardState,
            EvolutionRuleType ruleType,
            String notes
    ) {
    }

    record RuleKey(
            int fromPokedexNumber,
            String fromFormCode,
            CardState fromCardState,
            int toPokedexNumber,
            String toFormCode,
            CardState toCardState
    ) {
    }
}