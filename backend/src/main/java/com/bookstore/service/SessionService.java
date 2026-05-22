package com.bookstore.service;

import com.bookstore.entity.User;
import com.bookstore.entity.SessionEntity;
import com.bookstore.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.cassandra.core.CassandraTemplate;
import org.springframework.data.cassandra.core.InsertOptions;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final CassandraTemplate cassandraTemplate;

    public SessionEntity createSession(
            User user,
            boolean rememberMe,
            String deviceInfo,
            String ipAddress
    ) {

        String refreshToken = UUID.randomUUID().toString();

        Instant expiresAt = rememberMe
                ? Instant.now().plus(30, ChronoUnit.DAYS)
                : Instant.now().plus(7, ChronoUnit.DAYS);

        SessionEntity session = SessionEntity.builder()
                .sessionId(UUID.randomUUID())
                .userId(user.getId())
                .refreshToken(refreshToken)
                .revoked(false)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .createdAt(Instant.now())
                .expiresAt(expiresAt)
                .build();

        int ttlSeconds = rememberMe
                ? 60 * 60 * 24 * 30
                : 60 * 60 * 24 * 7;

        InsertOptions options =
                InsertOptions.builder()
                        .ttl(ttlSeconds)
                        .build();

        cassandraTemplate.insert(session, options);

        return session;
    }

    public SessionEntity validateSession(String refreshToken) {

        SessionEntity session =
                sessionRepository
                        .findByRefreshToken(refreshToken)
                        .orElseThrow(() ->
                                new RuntimeException("Invalid session"));

        if (Boolean.TRUE.equals(session.getRevoked())) {
            throw new RuntimeException("Session revoked");
        }

        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Session expired");
        }

        return session;
    }

    public void revokeSession(String refreshToken) {

        SessionEntity session =
                sessionRepository
                        .findByRefreshToken(refreshToken)
                        .orElseThrow(() ->
                                new RuntimeException("Session not found"));

        session.setRevoked(true);

        sessionRepository.save(session);
    }
}