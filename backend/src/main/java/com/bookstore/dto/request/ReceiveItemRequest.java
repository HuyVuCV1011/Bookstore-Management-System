package com.bookstore.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReceiveItemRequest {

    @NotNull(message = "Item ID is required")
    private Integer itemId;

    @NotNull(message = "Quantity received is required")
    @Min(value = 1, message = "Quantity received must be at least 1")
    private Integer quantityReceived;
}
