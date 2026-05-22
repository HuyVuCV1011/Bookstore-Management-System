package com.bookstore.graph.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public record SyncOrderRequest(

        @NotBlank String customerId,
        @NotBlank String orderId,
        @NotNull LocalDateTime purchasedAt,
        @NotEmpty @Valid List<OrderItemRequest> items
) {
    public record OrderItemRequest(
            @NotBlank String isbn,
            int quantity,
            double unitPrice
    ) {}
}
