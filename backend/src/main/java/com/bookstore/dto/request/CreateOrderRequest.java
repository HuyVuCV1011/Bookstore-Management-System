package com.bookstore.dto.request;

import com.bookstore.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotNull(message = "Items cannot be null")
    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^0[0-9]{9,10}$", message = "Invalid Vietnamese phone number")
    private String phoneNumber;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @NotNull(message = "Shipping fee is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Shipping fee must be non-negative")
    private BigDecimal shippingFee;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        @NotNull(message = "Book ID is required")
        @Positive(message = "Book ID must be positive")
        private Integer bookId;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be greater than 0")
        private Integer quantity;
    }
}
