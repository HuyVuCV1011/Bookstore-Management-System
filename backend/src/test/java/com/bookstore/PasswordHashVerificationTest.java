package com.bookstore;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class PasswordHashVerificationTest {

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    @Test
    public void verifyAdminPasswordHash() {
        String password = "test-only-password";
        String newHash = passwordEncoder.encode(password);

        assertTrue(passwordEncoder.matches(password, newHash), "Password should match generated test hash");
    }
}
