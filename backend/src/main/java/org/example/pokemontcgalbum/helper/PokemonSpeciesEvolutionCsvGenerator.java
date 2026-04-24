package org.example.pokemontcgalbum.helper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedWriter;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PokemonSpeciesEvolutionCsvGenerator {

    private static final String API_BASE = "https://pokeapi.co/api/v2";
    private static final int MAX_POKEDEX_NUMBER = 1025;

    private static final Path OUTPUT = Path.of(
            "backend","src", "main", "resources", "db", "scripts", "data", "pokemon_species_evolution.csv"
    );

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    private final Map<Integer, JsonNode> speciesCache = new HashMap<>();
    private final Map<Integer, JsonNode> evolutionChainCache = new HashMap<>();
    private final Set<Integer> processedChains = new HashSet<>();

    public static void main(String[] args) throws Exception {
        System.out.println("Katalog roboczy: " + Path.of("").toAbsolutePath().normalize());
        System.out.println("Plik wynikowy: " + OUTPUT.toAbsolutePath().normalize());

        new PokemonSpeciesEvolutionCsvGenerator().run();
    }

    public void run() throws Exception {
        System.out.println("START generatora species");
        List<SpeciesRow> rows = new ArrayList<>();

        for (int speciesId = 1; speciesId <= MAX_POKEDEX_NUMBER; speciesId++) {
            JsonNode species = fetchSpecies(speciesId);
            if (speciesId <= 5) {
                System.out.println("speciesId=" + speciesId + ", speciesNull=" + (species == null));
            }
            if (species == null || species.isMissingNode()) {
                continue;
            }

            JsonNode evolutionChainNode = species.path("evolution_chain");
            String evolutionChainUrl = evolutionChainNode.path("url").asText(null);
            if (evolutionChainUrl == null || evolutionChainUrl.isBlank()) {
                continue;
            }

            Integer chainId = extractTrailingNumber(evolutionChainUrl);
            if (chainId == null || processedChains.contains(chainId)) {
                continue;
            }

            JsonNode evolutionChain = fetchEvolutionChain(chainId);
            if (evolutionChain == null || evolutionChain.isMissingNode()) {
                continue;
            }

            JsonNode rootChain = evolutionChain.path("chain");
            if (rootChain.isMissingNode() || rootChain.isNull()) {
                continue;
            }

            String familyCode = slugify(rootChain.path("species").path("name").asText(""));
            walkChain(rootChain, familyCode, 0, 0, null, null, rows);

            processedChains.add(chainId);
        }

        rows.sort(Comparator
                .comparing(SpeciesRow::familyCode)
                .thenComparingInt(SpeciesRow::evolutionTier)
                .thenComparingInt(SpeciesRow::branchOrder)
                .thenComparingInt(SpeciesRow::pokedexNumber)
                .thenComparing(SpeciesRow::formCode));

        writeCsv(rows, OUTPUT);

        System.out.println("Wygenerowano: " + OUTPUT.toAbsolutePath().normalize());
        System.out.println("Liczba rekordów: " + rows.size());
    }

    private void walkChain(
            JsonNode chainNode,
            String familyCode,
            int evolutionTier,
            int branchOrder,
            Integer evolvesFromPokedexNumber,
            String evolvesFromFormCode,
            List<SpeciesRow> rows
    ) throws Exception {
        String speciesName = chainNode.path("species").path("name").asText();
        String speciesUrl = chainNode.path("species").path("url").asText();
        Integer pokedexNumber = extractTrailingNumber(speciesUrl);

        if (pokedexNumber == null) {
            return;
        }

        JsonNode species = fetchSpecies(pokedexNumber);
        if (species == null || species.isMissingNode()) {
            return;
        }

        boolean isBaby = chainNode.path("is_baby").asBoolean(false) || species.path("is_baby").asBoolean(false);

        String englishName = extractName(species, "en");
        String polishName = extractName(species, "pl");
        String formCode = resolveFormCode(englishName != null ? englishName : speciesName);

        String normalStage = resolveNormalStage(evolutionTier, isBaby);

        rows.add(new SpeciesRow(
                familyCode,
                pokedexNumber,
                formCode,
                coalesce(englishName, speciesName),
                polishName,
                evolutionTier,
                normalStage,
                isBaby,
                evolvesFromPokedexNumber,
                evolvesFromFormCode,
                branchOrder,
                ""
        ));

        JsonNode evolvesTo = chainNode.path("evolves_to");
        if (evolvesTo.isArray()) {
            int childBranch = 0;
            for (JsonNode child : evolvesTo) {
                walkChain(
                        child,
                        familyCode,
                        evolutionTier + 1,
                        childBranch,
                        pokedexNumber,
                        formCode,
                        rows
                );
                childBranch++;
            }
        }
    }

    private JsonNode fetchSpecies(int speciesId) throws Exception {
        if (speciesCache.containsKey(speciesId)) {
            return speciesCache.get(speciesId);
        }
        JsonNode node = getJson(API_BASE + "/pokemon-species/" + speciesId + "/");
        speciesCache.put(speciesId, node);
        sleepSmall();
        return node;
    }

    private JsonNode fetchEvolutionChain(int chainId) throws Exception {
        if (evolutionChainCache.containsKey(chainId)) {
            return evolutionChainCache.get(chainId);
        }
        JsonNode node = getJson(API_BASE + "/evolution-chain/" + chainId + "/");
        evolutionChainCache.put(chainId, node);
        sleepSmall();
        return node;
    }

    private JsonNode getJson(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (response.statusCode() == 404) {
            return null;
        }
        if (response.statusCode() >= 400) {
            throw new IOException("HTTP " + response.statusCode() + " for " + url);
        }

        return mapper.readTree(response.body());
    }

    private void writeCsv(List<SpeciesRow> rows, Path output) throws IOException {
        Files.createDirectories(output.getParent());

        try (BufferedWriter writer = Files.newBufferedWriter(output, StandardCharsets.UTF_8)) {
            writer.write("family_code,pokedex_number,form_code,pokemon_name,pokemon_name_pl,evolution_tier,normal_stage,is_baby,evolves_from_pokedex_number,evolves_from_form_code,branch_order,notes");
            writer.newLine();

            for (SpeciesRow row : rows) {
                writer.write(csv(row.familyCode()));
                writer.write(",");
                writer.write(String.valueOf(row.pokedexNumber()));
                writer.write(",");
                writer.write(csv(row.formCode()));
                writer.write(",");
                writer.write(csv(row.pokemonName()));
                writer.write(",");
                writer.write(csv(row.pokemonNamePl()));
                writer.write(",");
                writer.write(String.valueOf(row.evolutionTier()));
                writer.write(",");
                writer.write(csv(row.normalStage()));
                writer.write(",");
                writer.write(String.valueOf(row.isBaby()));
                writer.write(",");
                writer.write(row.evolvesFromPokedexNumber() == null ? "" : String.valueOf(row.evolvesFromPokedexNumber()));
                writer.write(",");
                writer.write(csv(row.evolvesFromFormCode()));
                writer.write(",");
                writer.write(String.valueOf(row.branchOrder()));
                writer.write(",");
                writer.write(csv(row.notes()));
                writer.newLine();
            }
        }
    }

    private String resolveNormalStage(int evolutionTier, boolean isBaby) {
        if (isBaby) {
            if (evolutionTier == 0) return "BASIC";   // albo osobno BABY_BASIC, jeśli dodasz taki enum
            if (evolutionTier == 1) return "BASIC";
            if (evolutionTier == 2) return "STAGE1";
            return "STAGE2";
        }

        if (evolutionTier == 0) return "BASIC";
        if (evolutionTier == 1) return "STAGE1";
        return "STAGE2";
    }

    private String resolveFormCode(String name) {
        String lower = name == null ? "" : name.toLowerCase(Locale.ROOT);

        if (lower.contains("alolan")) return "ALOLAN";
        if (lower.contains("galarian")) return "GALARIAN";
        if (lower.contains("hisuian")) return "HISUIAN";
        if (lower.contains("paldean")) return "PALDEAN";

        return "NORMAL";
    }

    private String extractName(JsonNode species, String langCode) {
        JsonNode names = species.path("names");
        if (!names.isArray()) {
            return null;
        }

        for (JsonNode nameNode : names) {
            if (langCode.equalsIgnoreCase(nameNode.path("language").path("name").asText())) {
                return nameNode.path("name").asText(null);
            }
        }
        return null;
    }

    private Integer extractTrailingNumber(String url) {
        if (url == null) return null;
        Matcher matcher = Pattern.compile(".*/(\\d+)/?$").matcher(url);
        if (!matcher.matches()) return null;
        return Integer.parseInt(matcher.group(1));
    }

    private String slugify(String value) {
        if (value == null) return "";
        return value.trim().toLowerCase(Locale.ROOT).replace(" ", "-");
    }

    private String csv(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    private String coalesce(String a, String b) {
        return a != null && !a.isBlank() ? a : b;
    }

    private void sleepSmall() {
        try {
            Thread.sleep(80);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
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
    ) {}
}