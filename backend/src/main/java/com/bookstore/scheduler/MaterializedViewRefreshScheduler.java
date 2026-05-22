package com.bookstore.scheduler;

import com.bookstore.service.MaterializedViewRefreshService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MaterializedViewRefreshScheduler {

    private final MaterializedViewRefreshService refreshService;

    /**
     * Refresh catalog statistics every 30 minutes
     * Cron: 0 *30 * * * * = every 30 minutes at minute 0 and 30
     */
    @Scheduled(cron = "0 */30 * * * *")
    public void refreshCatalogStatisticsJob() {
        log.info("Scheduled job: Starting catalog statistics refresh");
        try {
            refreshService.refreshCatalogStatistics();
        } catch (Exception e) {
            log.error("Failed to refresh catalog statistics materialized view", e);
        }
    }

    /**
     * Refresh popular books every hour
     * Cron: 0 0 * * * * = every hour at minute 0
     */
    @Scheduled(cron = "0 0 * * * *")
    public void refreshPopularBooksJob() {
        log.info("Scheduled job: Starting popular books refresh");
        try {
            refreshService.refreshPopularBooks();
        } catch (Exception e) {
            log.error("Failed to refresh popular books materialized view", e);
        }
    }

    /**
     * Refresh inventory reorder report every 6 hours
     * Cron: 0 0 *6 * * * = every 6 hours at minute 0
     */
    @Scheduled(cron = "0 0 */6 * * *")
    public void refreshInventoryReorderReportJob() {
        log.info("Scheduled job: Starting inventory reorder report refresh");
        try {
            refreshService.refreshInventoryReorderReport();
        } catch (Exception e) {
            log.error("Failed to refresh inventory reorder report materialized view", e);
        }
    }
}
