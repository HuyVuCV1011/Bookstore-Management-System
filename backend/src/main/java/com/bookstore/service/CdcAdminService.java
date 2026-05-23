package com.bookstore.service;

import com.bookstore.dto.response.CdcStatusResponse;
import com.bookstore.dto.response.CdcStatsResponse;
import com.bookstore.entity.OutboxEvent;
import com.bookstore.entity.OutboxStatus;
import com.bookstore.event.ChangeType;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.mapper.BookDetailMapper;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.OutboxEventRepository;
import com.bookstore.repository.mongodb.BookDetailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CdcAdminService {

    private final BookRepository bookRepository;
    private final BookDetailRepository bookDetailRepository;
    private final BookDetailSyncService syncService;
    private final BookDetailMapper mapper;
    private final ThreadPoolTaskExecutor cdcExecutor;
    private final MongoTemplate mongoTemplate;
    private final OutboxEventRepository outboxEventRepository;
    private final OutboxEventProcessor outboxEventProcessor;

    @Value("${bookstore.cdc.auto-sync-on-startup:true}")
    private boolean autoSyncOnStartup;

    public CdcStatusResponse getStatus() {
        boolean mongoConnected = checkMongoConnection();
        long pendingCount = outboxEventRepository.countByStatus(OutboxStatus.PENDING);
        long failureCount = outboxEventRepository.countByStatus(OutboxStatus.FAILED);

        String status;
        if (!mongoConnected) {
            status = "DOWN";
        } else if (pendingCount > 50 || failureCount > 0) {
            status = "DEGRADED";
        } else {
            status = "HEALTHY";
        }

        return CdcStatusResponse.builder()
                .enabled(true)
                .mongoConnected(mongoConnected)
                .lastSyncTime(LocalDateTime.now())
                .queueDepth((int) pendingCount)
                .status(status)
                .build();
    }

    public CdcStatsResponse getStats() {
        long postgresCount = bookRepository.count();
        long mongoCount = bookDetailRepository.count();

        long successCount = outboxEventRepository.countByStatus(OutboxStatus.COMPLETED);
        long failureCount = outboxEventRepository.countByStatus(OutboxStatus.FAILED);

        double successRate = 0.0;
        long totalProcessed = successCount + failureCount;
        if (totalProcessed > 0) {
            successRate = (double) successCount / totalProcessed;
        }

        double avgDuration = 0.0;

        return CdcStatsResponse.builder()
                .totalBooksPostgres(postgresCount)
                .totalBooksMongo(mongoCount)
                .syncSuccessCount(successCount)
                .syncFailureCount(failureCount)
                .successRate(successRate)
                .avgSyncDurationMs(avgDuration)
                .build();
    }

    public List<OutboxEvent> getOutboxEvents(OutboxStatus status) {
        if (status != null) {
            return outboxEventRepository.findByStatusOrderByCreatedAtAsc(status);
        }
        return outboxEventRepository.findAll();
    }

    public void retryOutboxEvent(Integer id) {
        log.info("[CDC-Admin] Manual outbox event retry requested for id {}", id);
        OutboxEvent event = outboxEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outbox event not found: " + id));

        // Reset attempts and status to PENDING
        event.setStatus(OutboxStatus.PENDING);
        event.setAttempts(0);
        outboxEventRepository.save(event);

        // Process synchronously for immediate feedback
        outboxEventProcessor.processSingleEvent(event);
    }

    public void retryAllFailedOutboxEvents() {
        log.info("[CDC-Admin] Manual bulk retry requested for all failed outbox events");
        List<OutboxEvent> failedEvents = outboxEventRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.FAILED);
        for (OutboxEvent event : failedEvents) {
            event.setStatus(OutboxStatus.PENDING);
            event.setAttempts(0);
        }
        outboxEventRepository.saveAll(failedEvents);
        log.info("[CDC-Admin] Reset {} failed outbox events to PENDING", failedEvents.size());
    }

    public void syncSingleBook(Integer bookId) {
        log.info("[CDC-Admin] Manual sync requested for book {}", bookId);
        syncService.syncBook(bookId, ChangeType.UPDATE);
    }

    public void syncAllBooks() {
        log.info("[CDC-Admin] Full resync requested for all books");

        // Get all books from PostgreSQL with relationships
        var books = bookRepository.findAll().stream()
            .filter(book -> book.getDeletedAt() == null)
            .toList();

        log.info("[CDC-Admin] Found {} books to sync", books.size());

        // Convert to BookDetail and save to MongoDB
        var bookDetails = books.stream()
            .map(book -> {
                try {
                    var bookWithRelations = bookRepository.findByIdWithRelations(book.getId());
                    return bookWithRelations.map(mapper::toBookDetail).orElse(null);
                } catch (Exception e) {
                    log.error("[CDC-Admin] Failed to sync book {}: {}", book.getId(), e.getMessage());
                    return null;
                }
            })
            .filter(java.util.Objects::nonNull)
            .toList();

        bookDetailRepository.saveAll(bookDetails);
        log.info("[CDC-Admin] Successfully synced {} books to MongoDB", bookDetails.size());
    }

    public CdcStatsResponse checkConsistency() {
        return getStats();
    }

    private boolean checkMongoConnection() {
        try {
            mongoTemplate.getDb().getName();
            return true;
        } catch (Exception e) {
            log.error("[CDC-Admin] MongoDB connection check failed", e);
            return false;
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    @Async("cdcExecutor")
    public void onApplicationReady() {
        if (!autoSyncOnStartup) {
            log.info("[CDC-Admin] Auto-sync on startup disabled by configuration");
            return;
        }

        log.info("[CDC-Admin] Application ready - starting auto-sync of all books");
        try {
            syncAllBooks();
            log.info("[CDC-Admin] Auto-sync completed successfully");
        } catch (Exception e) {
            log.error("[CDC-Admin] Auto-sync failed: {}", e.getMessage(), e);
        }
    }
}
