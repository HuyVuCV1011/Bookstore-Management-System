package com.bookstore.dto.response;

import com.bookstore.entity.OrderStatus;
import com.bookstore.entity.PaymentMethod;
import com.bookstore.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailResponse {
    private Integer id;
    private Integer customerId;
    private String customerName;
    private String customerEmail;
    private String salesEmployeeId;
    private OrderStatus orderStatus;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private LocalDateTime paymentDate;
    private String transactionReference;
    private String shippingAddress;
    private String phoneNumber;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String notes;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
