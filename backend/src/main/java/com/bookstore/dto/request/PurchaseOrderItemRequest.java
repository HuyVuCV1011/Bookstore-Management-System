package com.bookstore.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderItemRequest {

    @NotNull(message = "Book ID is required")
    private Integer bookId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotNull(message = "Unit cost is required")
    @DecimalMin(value = "0.00", message = "Unit cost must be non-negative")
    private BigDecimal unitCost;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
