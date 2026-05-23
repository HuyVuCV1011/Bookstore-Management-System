package com.bookstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsResponse {
    private BigDecimal totalInventoryValue;
    private Long lowStockCount;
    private Long pendingOrdersCount;
    private Long todayTransactionsCount;
    private BigDecimal todayRevenue;
    private Long totalBooksInStock;
    private Long totalUsersCount;
    private Long totalReviewsCount;
    private Long activeSessionsCount;
    private Integer projectionBacklog;
}
