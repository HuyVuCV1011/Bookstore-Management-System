package com.bookstore.service;

import com.bookstore.exception.RateLimitException;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    @Value("${security.rate-limit.login-attempts}")
    private int maxAttempts;

    @Value("${security.rate-limit.login-window}")
    private long windowMs;

    private final Map<String, LoginAttempts> attempts = new ConcurrentHashMap<>();

    public void checkRateLimit(String ipAddress) {
        LoginAttempts loginAttempts = attempts.get(ipAddress);

        if (loginAttempts != null) {
            LocalDateTime windowStart = LocalDateTime.now().minusNanos(windowMs * 1_000_000);

            if (loginAttempts.getFirstAttempt().isAfter(windowStart)) {
                if (loginAttempts.getCount() >= maxAttempts) {
                    throw new RateLimitException("Too many login attempts. Please try again after 1 minute.");
                }
            } else {
                attempts.remove(ipAddress);
            }
        }
    }

    public void recordFailedAttempt(String ipAddress) {
        attempts.compute(ipAddress, (key, existing) -> {
            if (existing == null) {
                return new LoginAttempts(1, LocalDateTime.now());
            } else {
                existing.setCount(existing.getCount() + 1);
                return existing;
            }
        });
    }

    public void clearAttempts(String ipAddress) {
        attempts.remove(ipAddress);
    }

    @Data
    @AllArgsConstructor
    private static class LoginAttempts {
        private int count;
        private LocalDateTime firstAttempt;
    }
}
