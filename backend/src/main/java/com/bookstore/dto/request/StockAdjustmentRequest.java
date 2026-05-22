package com.bookstore.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequest {

    @NotNull(message = "Book ID is required")
    private Integer bookId;

    @NotNull(message = "Quantity change is required")
    private Integer quantityChange;

    @NotNull(message = "Reason is required")
    private String reason;
}
