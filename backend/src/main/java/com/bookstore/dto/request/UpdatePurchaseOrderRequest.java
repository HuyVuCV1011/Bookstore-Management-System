package com.bookstore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePurchaseOrderRequest {

    @NotNull(message = "Supplier ID is required")
    private Integer supplierId;

    private LocalDate expectedDeliveryDate;

    @Size(max = 5000, message = "Notes must not exceed 5000 characters")
    private String notes;

    @NotNull(message = "Items are required")
    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<PurchaseOrderItemRequest> items;
}
