package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.auth.LoginRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthServiceImplTest {

    @Test
    void loginRequest_withPhone_shouldHavePhone() {
        LoginRequest req = new LoginRequest();
        req.setPhone("+237699999999");
        req.setPassword("Test123!");
        assertEquals("+237699999999", req.getPhone());
        assertEquals("Test123!", req.getPassword());
    }

    @Test
    void loginRequest_withNullPhone_shouldBeNull() {
        LoginRequest req = new LoginRequest();
        assertNull(req.getPhone());
    }
}
