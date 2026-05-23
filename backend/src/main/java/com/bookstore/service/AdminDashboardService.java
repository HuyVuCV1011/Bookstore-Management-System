package com.bookstore.service;

import com.bookstore.dto.response.AdminDashboardStatsResponse;
import com.bookstore.dto.response.DashboardStatsResponse;
import com.bookstore.entity.OutboxStatus;
import com.bookstore.repository.OutboxEventRepository;
import com.bookstore.repository.UserRepository;
import com.bookstore.repository.cassandra.UserSessionByStatusRepository;
import com.bookstore.repository.mongodb.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final UserSessionByStatusRepository sessionStatusRepository;
    private final OutboxEventRepository outboxEventRepository;

    public AdminDashboardStatsResponse getStats() {
        DashboardStatsResponse staffStats = dashboardService.getStaffDashboardStats();

        long totalUsers = userRepository.count();
        long totalReviews = reviewRepository.count();

        long activeSessions = 0L;
        try {
            activeSessions = sessionStatusRepository.countByStatus("active");
        } catch (Exception e) {
            // Fallback if Cassandra fails
        }

        long pendingOutbox = outboxEventRepository.countByStatus(OutboxStatus.PENDING);
        long failedOutbox = outboxEventRepository.countByStatus(OutboxStatus.FAILED);
        int projectionBacklog = (int) (pendingOutbox + failedOutbox);

        return AdminDashboardStatsResponse.builder()
                .totalInventoryValue(staffStats.getTotalInventoryValue())
                .lowStockCount(staffStats.getLowStockCount())
                .pendingOrdersCount(staffStats.getPendingOrdersCount())
                .todayTransactionsCount(staffStats.getTodayTransactionsCount())
                .todayRevenue(staffStats.getTodayRevenue())
                .totalBooksInStock(staffStats.getTotalBooksInStock())
                .totalUsersCount(totalUsers)
                .totalReviewsCount(totalReviews)
                .activeSessionsCount(activeSessions)
                .projectionBacklog(projectionBacklog)
                .build();
    }
}
