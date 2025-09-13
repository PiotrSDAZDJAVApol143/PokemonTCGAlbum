package org.example.pokemontcgalbum.helper;

public final class Canonical {
    public static String key(String s) { return s == null ? null : s.trim().toLowerCase(); }
}
