package com.bookstore.entity;

import lombok.*;
import org.springframework.data.cassandra.core.mapping.Indexed;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("user_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionEntity {

    @PrimaryKey
    private UUID sessionId;

    @Indexed
    private UUID userId;

    private String refreshToken;

    private Boolean revoked;

    private String deviceInfo;

    private String ipAddress;

    private Instant createdAt;

    private Instant expiresAt;
}