package com.pulse.api.model;

import java.security.SecureRandom;
import java.time.Instant;

/**
 * Generates prefixed, lexicographically sortable public ids (ULID-shaped).
 *
 * <p>Format is {@code <prefix>_<26 chars of Crockford base32>}: 10 characters of
 * millisecond timestamp followed by 16 characters of randomness. Sorting by id
 * therefore sorts by creation time, which is what the list endpoints rely on.
 */
public final class Ids {

    private static final char[] ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    private Ids() {
    }

    public static String generate(String prefix) {
        return prefix + "_" + encodeTime(Instant.now().toEpochMilli()) + randomSuffix();
    }

    private static String encodeTime(long epochMillis) {
        char[] out = new char[10];
        long value = epochMillis;
        for (int i = 9; i >= 0; i--) {
            out[i] = ALPHABET[(int) (value & 0x1F)];
            value >>>= 5;
        }
        return new String(out);
    }

    private static String randomSuffix() {
        char[] out = new char[16];
        for (int i = 0; i < out.length; i++) {
            out[i] = ALPHABET[RANDOM.nextInt(ALPHABET.length)];
        }
        return new String(out);
    }
}
