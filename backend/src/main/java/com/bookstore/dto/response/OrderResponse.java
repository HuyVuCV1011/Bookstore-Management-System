package com.bookstore.dto.response;

import com.bookstore.entity.OrderStatus;
import com.bookstore.entity.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private UUID id;
    private String orderCode;
    private UUID userId;
    private String customerName;
    private String customerEmail;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private LocalDateTime orderedAt;
    private BigDecimal subtotalAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String shippingAddress;
    private String notes;
    private Integer itemCount;
    private List<OrderItemResponse> items;
}
