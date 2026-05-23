package com.bookstore.service;

import com.bookstore.exception.RateLimitException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitServiceTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private RateLimitService rateLimitService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        rateLimitService = new RateLimitService(redisTemplate);
        ReflectionTestUtils.setField(rateLimitService, "maxAttempts", 3);
        ReflectionTestUtils.setField(rateLimitService, "windowMs", 60000L);
        ReflectionTestUtils.setField(rateLimitService, "trustProxy", false);
    }

    @Test
    void resolveClientIP_NoProxy_ReturnsRemoteAddr() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        when(request.getHeader("X-Forwarded-For")).thenReturn("10.0.0.1, 10.0.0.2");

        String ip = rateLimitService.resolveClientIP(request);
        assertEquals("192.168.1.1", ip);
    }

    @Test
    void resolveClientIP_WithProxyTrusted_ReturnsFirstForwardedIP() {
        ReflectionTestUtils.setField(rateLimitService, "trustProxy", true);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        when(request.getHeader("X-Forwarded-For")).thenReturn(" 10.0.0.1 , 10.0.0.2");

        String ip = rateLimitService.resolveClientIP(request);
        assertEquals("10.0.0.1", ip);
    }

    @Test
    void checkRateLimit_UnderLimit_DoesNotThrow() {
        when(valueOperations.get("rate:limit:login:127.0.0.1")).thenReturn("2");
        assertDoesNotThrow(() -> rateLimitService.checkRateLimit("127.0.0.1"));
    }

    @Test
    void checkRateLimit_OverLimit_ThrowsRateLimitException() {
        when(valueOperations.get("rate:limit:login:127.0.0.1")).thenReturn("3");
        when(redisTemplate.getExpire("rate:limit:login:127.0.0.1", TimeUnit.SECONDS)).thenReturn(45L);

        RateLimitException exception = assertThrows(RateLimitException.class, () -> {
            rateLimitService.checkRateLimit("127.0.0.1");
        });
        assertTrue(exception.getMessage().contains("45 seconds"));
    }

    @Test
    void recordFailedAttempt_FirstTime_SetsTtl() {
        String key = "rate:limit:login:127.0.0.1";
        when(valueOperations.increment(key)).thenReturn(1L);
        when(redisTemplate.getExpire(key, TimeUnit.MILLISECONDS)).thenReturn(-1L);

        rateLimitService.recordFailedAttempt("127.0.0.1");

        verify(valueOperations).increment(key);
        verify(redisTemplate).expire(eq(key), any(Duration.class));
    }

    @Test
    void recordFailedAttempt_Subsequent_DoesNotOverwriteTtlIfValid() {
        String key = "rate:limit:login:127.0.0.1";
        when(valueOperations.increment(key)).thenReturn(2L);
        when(redisTemplate.getExpire(key, TimeUnit.MILLISECONDS)).thenReturn(30000L);

        rateLimitService.recordFailedAttempt("127.0.0.1");

        verify(valueOperations).increment(key);
        verify(redisTemplate, never()).expire(eq(key), any(Duration.class));
    }

    @Test
    void clearAttempts_DeletesKey() {
        String key = "rate:limit:login:127.0.0.1";
        rateLimitService.clearAttempts("127.0.0.1");
        verify(redisTemplate).delete(key);
    }
}
