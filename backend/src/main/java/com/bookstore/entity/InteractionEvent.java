package com.bookstore.entity;

import lombok.*;
import org.springframework.data.cassandra.core.mapping.Column;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("interaction_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractionEvent {

    @PrimaryKey
    private UUID id;

    @Column("user_id")
    private UUID userId;

    @Column("book_id")
    private Integer bookId;

    @Column("event_type")
    private String eventType;

    @Column("event_time")
    private Instant eventTime;

    @Column("metadata")
    private String metadata;
}