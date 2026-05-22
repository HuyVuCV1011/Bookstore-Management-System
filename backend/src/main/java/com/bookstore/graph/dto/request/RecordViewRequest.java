package com.bookstore.graph.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RecordViewRequest(
        String customerId,
        @NotBlank String isbn,
        int durationSeconds,
        @NotBlank String sessionId
) {}
