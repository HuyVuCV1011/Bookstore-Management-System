package com.bookstore.scheduler;

import com.bookstore.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupScheduler {

    private final RefreshTokenService refreshTokenService;

    @Scheduled(cron = "0 0 0 * * *") // Run daily at midnight
    public void cleanupExpiredTokens() {
        log.info("Starting cleanup of expired refresh tokens");
        int deletedCount = refreshTokenService.cleanupExpiredTokens();
        log.info("Cleaned up {} expired refresh tokens", deletedCount);
    }
}
