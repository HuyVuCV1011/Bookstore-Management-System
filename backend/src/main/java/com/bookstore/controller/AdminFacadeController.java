package com.bookstore.controller;

import com.bookstore.dto.response.*;
import com.bookstore.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFacadeController {

    private final AdminDashboardService dashboardFacadeService;
    private final AdminCatalogOverviewService catalogFacadeService;
    private final AdminCustomerOverviewService customerFacadeService;
    private final AdminSystemHealthService systemHealthService;
    private final AdminAnalyticsFacadeService analyticsFacadeService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminDashboardStatsResponse> getDashboardStats() {
        log.info("Fetching unified admin dashboard stats");
        return ResponseEntity.ok(dashboardFacadeService.getStats());
    }

    @GetMapping("/catalog/overview")
    public ResponseEntity<Page<AdminBookOverview>> getCatalogOverview(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword
    ) {
        log.info("Fetching unified catalog overview - page: {}, size: {}, keyword: {}", page, size, keyword);
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return ResponseEntity.ok(catalogFacadeService.getCatalogOverview(pageable, keyword));
    }

    @GetMapping("/customers/overview")
    public ResponseEntity<Page<AdminCustomerOverview>> getCustomersOverview(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword
    ) {
        log.info("Fetching unified customer overview - page: {}, size: {}, keyword: {}", page, size, keyword);
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return ResponseEntity.ok(customerFacadeService.getCustomersOverview(pageable, keyword));
    }

    @GetMapping("/system/health")
    public ResponseEntity<AdminSystemHealthResponse> getSystemHealth() {
        log.info("Checking datastore health and outbox status");
        return ResponseEntity.ok(systemHealthService.getHealth());
    }

    @GetMapping("/analytics/overview")
    public ResponseEntity<AdminAnalyticsOverviewResponse> getAnalyticsOverview() {
        log.info("Fetching unified analytics overview stats");
        return ResponseEntity.ok(analyticsFacadeService.getOverview());
    }
}
