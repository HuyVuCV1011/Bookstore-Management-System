package com.bookstore.graph.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

public record RecordRatingRequest(
        @NotBlank String customerId,
        @NotBlank String isbn,
        @DecimalMin("1.0") @DecimalMax("5.0") double score,
        String reviewText
) {}
