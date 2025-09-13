package org.example.pokemontcgalbum.helper;

import java.util.regex.Pattern;

public final class PokedexNameCleaner {
    private static final Pattern PREFIXES = Pattern.compile(
            "^(Alolan|Galarian|Hisuian|Paldean|Dark|Light|Detective|Shining|Flying|Dawn Wings|Dusk Mane|Bloodmoon)\\s+",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern POSSESSIVE = Pattern.compile(
            "^[^\\s]+(?:’|'|`|´)s\\s+",  // np. "Ash’s Pikachu", "Lt. Surge's"
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern SUFFIXES = Pattern.compile(
            "\\s*(?:-?EX|-?GX|\\bex\\b|\\bV\\b|VMAX|VSTAR|BREAK|PRIME|LV\\.?X|\\(.*?\\)|\\[.*?\\])\\s*$",
            Pattern.CASE_INSENSITIVE
    );

    private PokedexNameCleaner() {}

    public static String clean(String name) {
        if (name == null) return null;
        String n = name.trim();

        // usuń „Ash’s …”, „Lt. Surge’s …”
        n = POSSESSIVE.matcher(n).replaceFirst("");

        // usuń regionalne/special prefixy
        n = PREFIXES.matcher(n).replaceFirst("");

        // usuń sufiksy typu EX/GX/V/VMAX, nawiasy itd.
        n = SUFFIXES.matcher(n).replaceAll("");

        // normalizacje pojedynczych wyjątków (opcjonalnie)
        n = n.replaceAll("\\s{2,}", " ").trim();

        return n;
    }
}