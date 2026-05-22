package com.bookstore.entity;

import lombok.*;
import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InteractionEventKey {

    @PrimaryKeyColumn(
            name = "user_id",
            type = PrimaryKeyType.PARTITIONED
    )
    private UUID userId;

    @PrimaryKeyColumn(
            name = "event_time",
            ordinal = 0,
            type = PrimaryKeyType.CLUSTERED
    )
    private Instant eventTime;
}
