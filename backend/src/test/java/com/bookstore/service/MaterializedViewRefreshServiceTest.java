package com.bookstore.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaterializedViewRefreshServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private MaterializedViewRefreshService service;

    @Test
    void refreshCatalogStatistics_shouldExecuteRefreshCommand() {
        // When
        service.refreshCatalogStatistics();

        // Then
        verify(jdbcTemplate, times(1))
            .execute(eq("REFRESH MATERIALIZED VIEW mv_catalog_statistics"));
    }

    @Test
    void refreshPopularBooks_shouldExecuteRefreshCommand() {
        // When
        service.refreshPopularBooks();

        // Then
        verify(jdbcTemplate, times(1))
            .execute(eq("REFRESH MATERIALIZED VIEW mv_popular_books"));
    }

    @Test
    void refreshInventoryReorderReport_shouldExecuteRefreshCommand() {
        // When
        service.refreshInventoryReorderReport();

        // Then
        verify(jdbcTemplate, times(1))
            .execute(eq("REFRESH MATERIALIZED VIEW mv_inventory_reorder_report"));
    }

    @Test
    void refreshAllMaterializedViews_shouldRefreshAllViews() {
        // When
        service.refreshAllMaterializedViews();

        // Then
        verify(jdbcTemplate, times(1))
            .execute(eq("REFRESH MATERIALIZED VIEW mv_catalog_statistics"));
        verify(jdbcTemplate, times(1))
            .execute(eq("REFRESH MATERIALIZED VIEW mv_popular_books"));
        verify(jdbcTemplate, times(1))
            .execute(eq("REFRESH MATERIALIZED VIEW mv_inventory_reorder_report"));
    }
}
