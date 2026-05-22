package com.bookstore.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterializedViewRefreshService {

    private final JdbcTemplate jdbcTemplate;

    public void refreshCatalogStatistics() {
        log.info("Refreshing catalog statistics materialized view");
        jdbcTemplate.execute("REFRESH MATERIALIZED VIEW mv_catalog_statistics");
        log.info("Catalog statistics materialized view refreshed successfully");
    }

    public void refreshPopularBooks() {
        log.info("Refreshing popular books materialized view");
        jdbcTemplate.execute("REFRESH MATERIALIZED VIEW mv_popular_books");
        log.info("Popular books materialized view refreshed successfully");
    }

    public void refreshInventoryReorderReport() {
        log.info("Refreshing inventory reorder report materialized view");
        jdbcTemplate.execute("REFRESH MATERIALIZED VIEW mv_inventory_reorder_report");
        log.info("Inventory reorder report materialized view refreshed successfully");
    }

    public void refreshAllMaterializedViews() {
        log.info("Starting refresh of all materialized views");
        refreshCatalogStatistics();
        refreshPopularBooks();
        refreshInventoryReorderReport();
        log.info("All materialized views refreshed successfully");
    }
}
