package com.smartcampost.backend.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class WeightBracketResolverTest {

    @Test
    void resolve_underFiveKg_shouldReturn0to5() {
        assertEquals("0-5kg", WeightBracketResolver.resolve(0.5));
        assertEquals("0-5kg", WeightBracketResolver.resolve(1.0));
        assertEquals("0-5kg", WeightBracketResolver.resolve(4.9));
        assertEquals("0-5kg", WeightBracketResolver.resolve(5.0));
    }

    @Test
    void resolve_fiveToTen_shouldReturn5to10() {
        assertEquals("5-10kg", WeightBracketResolver.resolve(5.1));
        assertEquals("5-10kg", WeightBracketResolver.resolve(7.5));
        assertEquals("5-10kg", WeightBracketResolver.resolve(10.0));
    }

    @Test
    void resolve_tenToTwenty_shouldReturn10to20() {
        assertEquals("10-20kg", WeightBracketResolver.resolve(10.1));
        assertEquals("10-20kg", WeightBracketResolver.resolve(15.0));
        assertEquals("10-20kg", WeightBracketResolver.resolve(20.0));
    }

    @Test
    void resolve_twentyToFifty_shouldReturn20to50() {
        assertEquals("20-50kg", WeightBracketResolver.resolve(20.1));
        assertEquals("20-50kg", WeightBracketResolver.resolve(35.0));
        assertEquals("20-50kg", WeightBracketResolver.resolve(50.0));
    }

    @Test
    void resolve_overFifty_shouldReturn50plus() {
        assertEquals("50+kg", WeightBracketResolver.resolve(50.1));
        assertEquals("50+kg", WeightBracketResolver.resolve(100.0));
        assertEquals("50+kg", WeightBracketResolver.resolve(999.0));
    }

    @Test
    void resolve_zero_shouldReturn0to5() {
        assertEquals("0-5kg", WeightBracketResolver.resolve(0.0));
    }

    @Test
    void resolve_negative_shouldReturn0to5() {
        assertEquals("0-5kg", WeightBracketResolver.resolve(-1.0));
    }
}
