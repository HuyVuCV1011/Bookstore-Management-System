package com.bookstore.controller;

import com.bookstore.dto.response.MessageResponse;
import com.bookstore.dto.response.SessionStatsDTO;
import com.bookstore.dto.response.SessionWithUserDTO;
import com.bookstore.entity.SessionEntity;
import com.bookstore.entity.User;
import com.bookstore.repository.SessionRepository;
import com.bookstore.repository.UserRepository;
import com.bookstore.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.cassandra.core.CassandraTemplate;
import org.springframework.data.cassandra.core.query.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/sessions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SessionController {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final CassandraTemplate cassandraTemplate;
    private final RefreshTokenService refreshTokenService;

    @GetMapping
    public ResponseEntity<Page<SessionWithUserDTO>> getSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String email
    ) {
        try {
            log.debug("Fetching sessions - page: {}, size: {}, email: {}", page, size, email);

            // Get all sessions from Cassandra using CassandraTemplate
            List<SessionEntity> allSessions = cassandraTemplate.select(Query.empty(), SessionEntity.class);
            log.debug("Found {} total sessions in Cassandra", allSessions.size());

            // Convert to DTOs with user info and apply filters
            List<SessionWithUserDTO> sessionDTOs = allSessions.stream()
                    .map(session -> {
                        String userEmail = "Unknown";
                        try {
                            User user = userRepository.findById(session.getUserId()).orElse(null);
                            if (user != null) {
                                userEmail = user.getEmail();
                            }
                        } catch (Exception e) {
                            log.warn("Failed to fetch user for session {}", session.getSessionId(), e);
                        }

                        return SessionWithUserDTO.builder()
                                .sessionId(session.getSessionId().toString())
                                .userId(session.getUserId())
                                .userEmail(userEmail)
                                .deviceInfo(session.getDeviceInfo())
                                .ipAddress(session.getIpAddress())
                                .revoked(session.getRevoked())
                                .createdAt(LocalDateTime.ofInstant(session.getCreatedAt(), ZoneId.systemDefault()))
                                .expiresAt(LocalDateTime.ofInstant(session.getExpiresAt(), ZoneId.systemDefault()))
                                .build();
                    })
                    .filter(dto -> {
                        // Apply email filter if provided (search email only)
                        if (email != null && !email.trim().isEmpty()) {
                            String searchTerm = email.toLowerCase().trim();
                            return dto.getUserEmail().toLowerCase().contains(searchTerm);
                        }
                        return true;
                    })
                    .sorted((a, b) -> b.getExpiresAt().compareTo(a.getExpiresAt())) // Sort by expiresAt DESC (latest first)
                    .collect(Collectors.toList());

            log.debug("After filtering and sorting: {} sessions", sessionDTOs.size());

            // Simple pagination in memory
            int start = page * size;
            int end = Math.min(start + size, sessionDTOs.size());
            List<SessionWithUserDTO> pageContent = start < sessionDTOs.size()
                    ? sessionDTOs.subList(start, end)
                    : Collections.emptyList();

            Pageable pageable = PageRequest.of(page, size);
            Page<SessionWithUserDTO> sessionsPage = new PageImpl<>(
                    pageContent,
                    pageable,
                    sessionDTOs.size()
            );

            log.info("Returning {} sessions for page {}", pageContent.size(), page);
            return ResponseEntity.ok(sessionsPage);

        } catch (Exception e) {
            log.error("Error fetching sessions", e);
            // Return empty page on error
            return ResponseEntity.ok(new PageImpl<>(
                    Collections.emptyList(),
                    PageRequest.of(page, size),
                    0L
            ));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<SessionStatsDTO> getStats() {
        try {
            log.debug("Fetching session statistics");

            List<SessionEntity> allSessions = cassandraTemplate.select(Query.empty(), SessionEntity.class);
            Instant now = Instant.now();

            long totalSessions = allSessions.size();
            long activeSessions = allSessions.stream()
                    .filter(s -> !Boolean.TRUE.equals(s.getRevoked()))
                    .filter(s -> s.getExpiresAt().isAfter(now))
                    .count();
            long revokedSessions = allSessions.stream()
                    .filter(s -> Boolean.TRUE.equals(s.getRevoked()))
                    .count();
            long expiredSessions = allSessions.stream()
                    .filter(s -> !Boolean.TRUE.equals(s.getRevoked()))
                    .filter(s -> s.getExpiresAt().isBefore(now))
                    .count();

            SessionStatsDTO stats = SessionStatsDTO.builder()
                    .totalSessions(totalSessions)
                    .activeSessions(activeSessions)
                    .revokedSessions(revokedSessions)
                    .expiredSessions(expiredSessions)
                    .build();

            log.info("Session stats - total: {}, active: {}, revoked: {}, expired: {}",
                    totalSessions, activeSessions, revokedSessions, expiredSessions);
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Error fetching session stats", e);
            // Return zero stats on error
            return ResponseEntity.ok(SessionStatsDTO.builder()
                    .totalSessions(0L)
                    .activeSessions(0L)
                    .revokedSessions(0L)
                    .expiredSessions(0L)
                    .build());
        }
    }

    @PatchMapping("/{sessionId}/revoke")
    public ResponseEntity<MessageResponse> revokeSession(@PathVariable String sessionId) {
        try {
            log.debug("Revoking session: {}", sessionId);

            UUID sessionUuid = UUID.fromString(sessionId);

            // Find the session
            Optional<SessionEntity> sessionOpt = sessionRepository.findById(sessionUuid);

            if (sessionOpt.isEmpty()) {
                log.warn("Session not found: {}", sessionId);
                return ResponseEntity.notFound().build();
            }

            SessionEntity session = sessionOpt.get();

            // Update revoked status in Cassandra
            session.setRevoked(true);
            sessionRepository.save(session);

            // Also delete the refresh token from PostgreSQL to actually log out the user
            try {
                String refreshToken = session.getRefreshToken();
                if (refreshToken != null && !refreshToken.isEmpty()) {
                    refreshTokenService.deleteByToken(refreshToken);
                    log.debug("Deleted refresh token for session: {}", sessionId);
                }
            } catch (Exception e) {
                log.warn("Failed to delete refresh token for session {}: {}", sessionId, e.getMessage());
                // Continue anyway - Cassandra session is revoked
            }

            log.info("Session revoked successfully: {}", sessionId);
            return ResponseEntity.ok(MessageResponse.builder()
                    .message("Session revoked successfully")
                    .build());

        } catch (IllegalArgumentException e) {
            log.error("Invalid session ID format: {}", sessionId);
            return ResponseEntity.badRequest()
                    .body(MessageResponse.builder()
                            .message("Invalid session ID format")
                            .build());
        } catch (Exception e) {
            log.error("Error revoking session: {}", sessionId, e);
            return ResponseEntity.internalServerError()
                    .body(MessageResponse.builder()
                            .message("Failed to revoke session")
                            .build());
        }
    }
}
