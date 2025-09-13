package org.example.pokemontcgalbum.helper;

public final class AttackMath {
    private AttackMath() {}

    public static int parseBaseDamage(String damage) {
        if (damage == null || damage.isBlank()) return 0;
        // wyciąga pierwszą sekwencję cyfr
        StringBuilder sb = new StringBuilder();
        for (char ch : damage.toCharArray()) {
            if (Character.isDigit(ch)) sb.append(ch);
        }
        if (sb.length() == 0) return 0;
        try { return Integer.parseInt(sb.toString()); } catch (Exception e) { return 0; }
    }

    public static boolean hasPlus(String damage) {
        return damage != null && damage.contains("+");
    }

    public static boolean hasTimes(String damage) {
        return damage != null && (damage.contains("x") || damage.contains("×"));
    }
}
