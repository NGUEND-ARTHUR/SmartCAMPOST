package com.smartcampost.backend.util;

/**
 * Single source of truth for weight -> tariff weightBracket mapping.
 * Must match the brackets offered in the admin Tariff Management UI
 * (TariffManagement.tsx weight Select options), since tariffs are stored
 * with whichever bracket string the admin picked there.
 */
public final class WeightBracketResolver {

    private WeightBracketResolver() {
    }

    public static String resolve(double weightKg) {
        if (weightKg <= 5.0) return "0-5kg";
        if (weightKg <= 10.0) return "5-10kg";
        if (weightKg <= 20.0) return "10-20kg";
        if (weightKg <= 50.0) return "20-50kg";
        return "50+kg";
    }
}
