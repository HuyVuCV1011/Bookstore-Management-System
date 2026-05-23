package com.bookstore.controller;

import com.bookstore.dto.response.MessageResponse;
import com.bookstore.dto.response.SessionStatsDTO;
import com.bookstore.dto.response.SessionWithUserDTO;
import com.bookstore.entity.SessionEntity;
import com.bookstore.entity.User;
import com.bookstore.entity.UserSessionByBucket;
import com.bookstore.repository.cassandra.SessionRepository;
import com.bookstore.repository.cassandra.UserSessionByBucketRepository;
import com.bookstore.repository.cassandra.UserSessionByStatusRepository;
import com.bookstore.repository.UserRepository;
import com.bookstore.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
    private final UserSessionByBucketRepository bucketRepository;
    private final UserSessionByStatusRepository statusRepository;
    private final UserRepository userRepository;
    private final SessionService sessionService;

    @GetMapping
    public ResponseEntity<Page<SessionWithUserDTO>> getSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String email
    ) {
        try {
            log.debug("Fetching sessions (optimized) - page: {}, size: {}, email: {}", page, size, email);

            List<SessionWithUserDTO> sessionDTOs = new ArrayList<>();
            long totalElements = 0;
            boolean hasNext = false;

            if (email != null && !email.trim().isEmpty()) {
                // 1. Search users by email in Postgres
                List<User> matchingUsers = userRepository.findByEmailContainingIgnoreCase(email.trim());
                if (matchingUsers.isEmpty()) {
                    return ResponseEntity.ok(new PageImpl<>(Collections.emptyList(), PageRequest.of(page, size), 0L));
                }

                // 2. Fetch sessions for matching users using secondary index (findByUserId)
                List<SessionEntity> matchingSessions = new ArrayList<>();
                for (User user : matchingUsers) {
                    matchingSessions.addAll(sessionRepository.findByUserId(user.getId()));
                }

                // 3. Sort matching sessions by expiresAt DESC
                matchingSessions.sort((a, b) -> b.getExpiresAt().compareTo(a.getExpiresAt()));
                totalElements = matchingSessions.size();

                // 4. Bounded pagination in-memory for matching subset
                int start = page * size;
                int end = Math.min(start + size, matchingSessions.size());
                List<SessionEntity> pageContent = start < matchingSessions.size()
                        ? matchingSessions.subList(start, end)
                        : Collections.emptyList();

                // Batch enrichment: Fetch all user profiles for this page in 1 single Jpa query to avoid N+1
                Set<UUID> userIds = pageContent.stream().map(SessionEntity::getUserId).collect(Collectors.toSet());
                Map<UUID, User> userMap = userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u));

                for (SessionEntity session : pageContent) {
                    User user = userMap.get(session.getUserId());
                    String userEmail = user != null ? user.getEmail() : "Unknown";

                    sessionDTOs.add(SessionWithUserDTO.builder()
                            .sessionId(session.getSessionId().toString())
                            .userId(session.getUserId())
                            .userEmail(userEmail)
                            .deviceInfo(session.getDeviceInfo())
                            .ipAddress(session.getIpAddress())
                            .revoked(session.getRevoked())
                            .createdAt(LocalDateTime.ofInstant(session.getCreatedAt(), ZoneId.systemDefault()))
                            .expiresAt(LocalDateTime.ofInstant(session.getExpiresAt(), ZoneId.systemDefault()))
                            .build());
                }
            } else {
                // No email search: query all sessions via bucket table using server-side paging (Slice)
                Pageable pageable = PageRequest.of(page, size);
                Slice<UserSessionByBucket> slice = bucketRepository.findByBucket("all", pageable);
                hasNext = slice.hasNext();
                List<UserSessionByBucket> content = slice.getContent();

                // Batch enrichment: Fetch all user profiles for this page in 1 single Jpa query to avoid N+1
                Set<UUID> userIds = content.stream().map(UserSessionByBucket::getUserId).collect(Collectors.toSet());
                Map<UUID, User> userMap = userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u));

                for (UserSessionByBucket session : content) {
                    User user = userMap.get(session.getUserId());
                    String userEmail = user != null ? user.getEmail() : "Unknown";

                    sessionDTOs.add(SessionWithUserDTO.builder()
                            .sessionId(session.getSessionId().toString())
                            .userId(session.getUserId())
                            .userEmail(userEmail)
                            .deviceInfo(session.getDeviceInfo())
                            .ipAddress(session.getIpAddress())
                            .revoked(session.getRevoked())
                            .createdAt(LocalDateTime.ofInstant(session.getCreatedAt(), ZoneId.systemDefault()))
                            .expiresAt(LocalDateTime.ofInstant(session.getExpiresAt(), ZoneId.systemDefault()))
                            .build());
                }

                totalElements = (long) (page * size) + sessionDTOs.size() + (hasNext ? size : 0);
            }

            Pageable resultPageable = PageRequest.of(page, size);
            Page<SessionWithUserDTO> sessionsPage = new PageImpl<>(
                    sessionDTOs,
                    resultPageable,
                    totalElements
            );

            log.info("Returning {} sessions for page {}", sessionDTOs.size(), page);
            return ResponseEntity.ok(sessionsPage);

        } catch (Exception e) {
            log.error("Error fetching sessions", e);
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
            log.debug("Fetching session statistics (optimized)");

            long activeSessions = statusRepository.countByStatus("active");
            long revokedSessions = statusRepository.countByStatus("revoked");
            long totalSessions = activeSessions + revokedSessions;
            long expiredSessions = 0L; // automatically removed by Cassandra TTL

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

            // Revoke in Cassandra (delegated to SessionService to keep other tables in sync)
            sessionService.revokeSession(session);

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
