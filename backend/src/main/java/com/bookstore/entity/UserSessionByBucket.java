package com.bookstore.entity;

import lombok.*;
import org.springframework.data.cassandra.core.cql.Ordering;
import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.Column;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("user_sessions_by_bucket")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionByBucket {

    @PrimaryKeyColumn(name = "bucket", type = PrimaryKeyType.PARTITIONED, ordinal = 0)
    private String bucket; // always "all"

    @PrimaryKeyColumn(name = "expires_at", type = PrimaryKeyType.CLUSTERED, ordinal = 1, ordering = Ordering.DESCENDING)
    private Instant expiresAt;

    @PrimaryKeyColumn(name = "session_id", type = PrimaryKeyType.CLUSTERED, ordinal = 2)
    private UUID sessionId;

    @Column("user_id")
    private UUID userId;

    @Column("refresh_token")
    private String refreshToken;

    @Column("revoked")
    private Boolean revoked;

    @Column("device_info")
    private String deviceInfo;

    @Column("ip_address")
    private String ipAddress;

    @Column("created_at")
    private Instant createdAt;
}
