package com.bookstore.service;

import com.bookstore.config.JwtConfig;
import com.bookstore.entity.RefreshToken;
import com.bookstore.entity.User;
import com.bookstore.exception.InvalidTokenException;
import com.bookstore.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final JwtConfig jwtConfig;

    @Transactional
    public RefreshToken createRefreshToken(User user, boolean rememberMe) {
        String token = jwtService.generateRefreshToken();
        long expiration = rememberMe
                ? jwtConfig.getRefreshTokenExpirationRemember()
                : jwtConfig.getRefreshTokenExpiration();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusSeconds(expiration / 1000))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new InvalidTokenException("Refresh token expired");
        }

        return refreshToken;
    }

    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    @Transactional
    public void deleteByUserId(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Transactional
    public int cleanupExpiredTokens() {
        return refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }
}
