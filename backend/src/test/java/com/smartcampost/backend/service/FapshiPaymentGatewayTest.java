package com.smartcampost.backend.service;

import com.smartcampost.backend.service.impl.FapshiPaymentGatewayServiceImpl;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for FapshiPaymentGatewayServiceImpl.
 * Tests phone normalization and medium detection logic without making real API calls.
 */
class FapshiPaymentGatewayTest {

    @Test
    void detectMedium_mtnNumbers_shouldReturnMobileMoney() throws Exception {
        var gateway = new FapshiPaymentGatewayServiceImpl();
        var method = invokeDetectMedium(gateway, "677123456");
        assertEquals("mobile money", method);
    }

    @Test
    void detectMedium_orangeNumbers_shouldReturnOrangeMoney() throws Exception {
        var gateway = new FapshiPaymentGatewayServiceImpl();
        assertEquals("orange money", invokeDetectMedium(gateway, "695123456"));
        assertEquals("orange money", invokeDetectMedium(gateway, "699123456"));
    }

    @Test
    void normalizePhone_shouldStrip237Prefix() throws Exception {
        var gateway = new FapshiPaymentGatewayServiceImpl();
        assertEquals("677123456", invokeNormalizePhone(gateway, "+237677123456"));
        assertEquals("677123456", invokeNormalizePhone(gateway, "237677123456"));
        assertEquals("677123456", invokeNormalizePhone(gateway, "677123456"));
    }

    @Test
    void normalizePhone_shouldStripNonDigits() throws Exception {
        var gateway = new FapshiPaymentGatewayServiceImpl();
        assertEquals("677123456", invokeNormalizePhone(gateway, "+237 677 123 456"));
        assertEquals("677123456", invokeNormalizePhone(gateway, "677-123-456"));
    }

    @Test
    void initiatePayment_withoutCredentials_shouldThrow() {
        var gateway = new FapshiPaymentGatewayServiceImpl();
        assertThrows(Exception.class, () ->
                gateway.initiatePayment("+237677123456", 5000.0, "XAF", "Test"));
    }

    private String invokeDetectMedium(FapshiPaymentGatewayServiceImpl gateway, String phone) throws Exception {
        var method = FapshiPaymentGatewayServiceImpl.class.getDeclaredMethod("detectMedium", String.class);
        method.setAccessible(true);
        return (String) method.invoke(gateway, phone);
    }

    private String invokeNormalizePhone(FapshiPaymentGatewayServiceImpl gateway, String phone) throws Exception {
        var method = FapshiPaymentGatewayServiceImpl.class.getDeclaredMethod("normalizePhone", String.class);
        method.setAccessible(true);
        return (String) method.invoke(gateway, phone);
    }
}
