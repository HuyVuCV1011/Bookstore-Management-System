package com.bookstore.service;

import com.bookstore.entity.User;
import com.bookstore.entity.SessionEntity;
import com.bookstore.entity.UserSessionByBucket;
import com.bookstore.entity.UserSessionByStatus;
import com.bookstore.repository.cassandra.SessionRepository;
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

        // 1. Save to user_sessions
        cassandraTemplate.insert(session, options);

        // 2. Save to user_sessions_by_bucket
        UserSessionByBucket bucketSession = UserSessionByBucket.builder()
                .bucket("all")
                .expiresAt(session.getExpiresAt())
                .sessionId(session.getSessionId())
                .userId(session.getUserId())
                .refreshToken(session.getRefreshToken())
                .revoked(session.getRevoked())
                .deviceInfo(session.getDeviceInfo())
                .ipAddress(session.getIpAddress())
                .createdAt(session.getCreatedAt())
                .build();
        cassandraTemplate.insert(bucketSession, options);

        // 3. Save to user_sessions_by_status
        UserSessionByStatus activeStatus = UserSessionByStatus.builder()
                .status("active")
                .sessionId(session.getSessionId())
                .build();
        cassandraTemplate.insert(activeStatus, options);

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

    public void revokeSession(SessionEntity session) {
        session.setRevoked(true);
        sessionRepository.save(session);

        long remainingTtl = ChronoUnit.SECONDS.between(Instant.now(), session.getExpiresAt());
        if (remainingTtl < 0) {
            remainingTtl = 0;
        }

        InsertOptions options = InsertOptions.builder()
                .ttl((int) remainingTtl)
                .build();

        // Update user_sessions_by_bucket
        UserSessionByBucket bucketSession = UserSessionByBucket.builder()
                .bucket("all")
                .expiresAt(session.getExpiresAt())
                .sessionId(session.getSessionId())
                .userId(session.getUserId())
                .refreshToken(session.getRefreshToken())
                .revoked(true)
                .deviceInfo(session.getDeviceInfo())
                .ipAddress(session.getIpAddress())
                .createdAt(session.getCreatedAt())
                .build();
        cassandraTemplate.insert(bucketSession, options);

        // Move status from active to revoked
        UserSessionByStatus activeStatus = UserSessionByStatus.builder()
                .status("active")
                .sessionId(session.getSessionId())
                .build();
        cassandraTemplate.delete(activeStatus);

        UserSessionByStatus revokedStatus = UserSessionByStatus.builder()
                .status("revoked")
                .sessionId(session.getSessionId())
                .build();
        cassandraTemplate.insert(revokedStatus, options);
    }

    public void revokeSession(String refreshToken) {

        SessionEntity session =
                sessionRepository
                        .findByRefreshToken(refreshToken)
                        .orElseThrow(() ->
                                new RuntimeException("Session not found"));

        revokeSession(session);
    }
}