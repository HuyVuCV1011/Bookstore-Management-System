package com.bookstore.service;

import com.bookstore.dto.response.DashboardStatsResponse;
import com.bookstore.entity.OrderStatus;
import com.bookstore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final BookRepository bookRepository;
    private final OrderRepository orderRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    public DashboardStatsResponse getStaffDashboardStats() {
        // Calculate total inventory value (price * stock_quantity for all books)
        BigDecimal totalInventoryValue = bookRepository.calculateTotalInventoryValue();

        // Count books with low stock (stock_quantity < 10)
        Long lowStockCount = bookRepository.countByStockQuantityLessThan(10);

        // Count pending orders (status = PENDING or PROCESSING)
        Long pendingOrdersCount = orderRepository.countByStatusIn(
                java.util.List.of(OrderStatus.PENDING, OrderStatus.PROCESSING)
        );

        // Count today's inventory transactions
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);
        Long todayTransactionsCount = inventoryTransactionRepository.countByTransactionDateBetween(
                startOfDay, endOfDay
        );

        // Calculate today's revenue (sum of completed orders today)
        BigDecimal todayRevenue = orderRepository.calculateTodayRevenue(startOfDay, endOfDay);
        if (todayRevenue == null) {
            todayRevenue = BigDecimal.ZERO;
        }

        // Total books in stock
        Long totalBooksInStock = bookRepository.sumStockQuantity();

        return DashboardStatsResponse.builder()
                .totalInventoryValue(totalInventoryValue != null ? totalInventoryValue : BigDecimal.ZERO)
                .lowStockCount(lowStockCount)
                .pendingOrdersCount(pendingOrdersCount)
                .todayTransactionsCount(todayTransactionsCount)
                .todayRevenue(todayRevenue)
                .totalBooksInStock(totalBooksInStock != null ? totalBooksInStock : 0L)
                .build();
    }
}
