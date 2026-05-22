package com.bookstore.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Log4j2
public class OrderGraphProjectionService {

    private final BookGraphProjectionService bookGraphProjectionService;
    private final OrderHistoryService orderHistoryService;

    @EventListener(ApplicationReadyEvent.class)
    public void syncOrderHistoryOnStartup() {
        try {
            bookGraphProjectionService.syncAllFromPostgres();
            int synced = orderHistoryService.syncCompletedOrdersToGraph();
            log.info("Synced {} completed PostgreSQL orders to Neo4j purchase graph", synced);
        } catch (Exception ex) {
            log.warn("PostgreSQL order data remains valid, but Neo4j order projection sync failed", ex);
        }
    }
}
