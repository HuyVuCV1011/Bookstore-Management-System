package com.bookstore.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatsResponse {
    private long totalOrders;
    private long completedOrders;
    private long processingOrders;
    private long cancelledOrders;
    private long totalItems;
    private BigDecimal totalRevenue;
}
