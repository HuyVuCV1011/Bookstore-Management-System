package com.bookstore.service;

import com.bookstore.exception.RateLimitException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    @Value("${security.rate-limit.login-attempts}")
    private int maxAttempts;

    @Value("${security.rate-limit.login-window}")
    private long windowMs;

    @Value("${security.rate-limit.trust-proxy:false}")
    private boolean trustProxy;

    private final StringRedisTemplate redisTemplate;

    public String resolveClientIP(HttpServletRequest request) {
        if (trustProxy) {
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isBlank()) {
                return xfHeader.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    public void checkRateLimit(String ipAddress) {
        String key = "rate:limit:login:" + ipAddress;
        String countStr = redisTemplate.opsForValue().get(key);

        if (countStr != null) {
            int count = Integer.parseInt(countStr);
            if (count >= maxAttempts) {
                Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                long seconds = (expire != null && expire > 0) ? expire : (windowMs / 1000);
                log.warn("Rate limit exceeded for IP: {}. Count: {}, Blocked for {} seconds", ipAddress, count, seconds);
                throw new RateLimitException("Too many login attempts. Please try again after " + seconds + " seconds.");
            }
        }
    }

    public void recordFailedAttempt(String ipAddress) {
        String key = "rate:limit:login:" + ipAddress;
        Long count = redisTemplate.opsForValue().increment(key);
        Long ttl = redisTemplate.getExpire(key, TimeUnit.MILLISECONDS);
        if (ttl != null && ttl == -1L) {
            redisTemplate.expire(key, Duration.ofMillis(windowMs));
        }
        log.debug("Recorded failed login attempt for IP: {}. New count: {}", ipAddress, count);
    }

    public void clearAttempts(String ipAddress) {
        String key = "rate:limit:login:" + ipAddress;
        redisTemplate.delete(key);
        log.debug("Cleared rate limit attempts for IP: {}", ipAddress);
    }
}
