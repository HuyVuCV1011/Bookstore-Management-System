package com.bookstore.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterializedViewInitService {

    private final MaterializedViewRefreshService refreshService;

    @EventListener(ApplicationReadyEvent.class)
    public void initializeMaterializedViews() {
        log.info("Application ready - initializing materialized views with data");
        try {
            refreshService.refreshAllMaterializedViews();
            log.info("Materialized views initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize materialized views", e);
        }
    }
}
