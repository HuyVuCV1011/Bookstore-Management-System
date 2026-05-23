package com.bookstore.entity;

import lombok.*;
import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;
import org.springframework.data.cassandra.core.mapping.Table;

import java.util.UUID;

@Table("user_sessions_by_status")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionByStatus {

    @PrimaryKeyColumn(name = "status", type = PrimaryKeyType.PARTITIONED, ordinal = 0)
    private String status; // "active" or "revoked"

    @PrimaryKeyColumn(name = "session_id", type = PrimaryKeyType.CLUSTERED, ordinal = 1)
    private UUID sessionId;
}
