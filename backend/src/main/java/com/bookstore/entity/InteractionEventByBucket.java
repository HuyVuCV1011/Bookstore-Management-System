package com.bookstore.entity;

import lombok.*;
import org.springframework.data.cassandra.core.cql.Ordering;
import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.Column;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("interaction_events_by_bucket")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractionEventByBucket {

    @PrimaryKeyColumn(name = "bucket", type = PrimaryKeyType.PARTITIONED, ordinal = 0)
    private String bucket; // always "all"

    @PrimaryKeyColumn(name = "event_time", type = PrimaryKeyType.CLUSTERED, ordinal = 1, ordering = Ordering.DESCENDING)
    private Instant eventTime;

    @PrimaryKeyColumn(name = "id", type = PrimaryKeyType.CLUSTERED, ordinal = 2)
    private UUID id;

    @Column("user_id")
    private UUID userId;

    @Column("book_id")
    private Integer bookId;

    @Column("event_type")
    private String eventType;

    @Column("metadata")
    private String metadata;
}
