package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractionEventDTO {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private Integer bookId;
    private String bookTitle;
    private String eventType;
    private LocalDateTime eventTime;
    private String metadata;
    private Boolean flagged;
    private String flagReason;
    private LocalDateTime flaggedAt;
    private String flaggedByEmail;
}
