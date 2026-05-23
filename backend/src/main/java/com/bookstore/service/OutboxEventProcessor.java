package com.bookstore.service;

import com.bookstore.entity.OutboxEvent;
import com.bookstore.entity.OutboxStatus;
import com.bookstore.event.*;
import com.bookstore.handler.BookDetailEventHandler;
import com.bookstore.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxEventProcessor {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final BookDetailEventHandler bookDetailEventHandler;
    private final BookGraphProjectionService bookGraphProjectionService;
    private final CustomerGraphProjectionService customerGraphProjectionService;

    @Autowired
    @Lazy
    private OutboxEventProcessor self;

    private static final int MAX_ATTEMPTS = 5;

    @Scheduled(
        fixedDelayString = "${app.outbox.scheduler.delay-ms:1000}",
        initialDelayString = "${app.outbox.scheduler.initial-delay-ms:1000}"
    )
    public void processUnprocessedEvents() {
        log.trace("Polling outbox events for background processing...");
        List<OutboxEvent> events = outboxEventRepository.findUnprocessedEvents(MAX_ATTEMPTS);
        if (events.isEmpty()) {
            return;
        }

        log.debug("Found {} unprocessed outbox events", events.size());
        for (OutboxEvent event : events) {
            try {
                self.processSingleEvent(event);
            } catch (Exception e) {
                log.error("Unexpected error processing event: id={}", event.getId(), e);
            }
        }
    }

    public void processSingleEvent(OutboxEvent event) {
        log.debug("Processing outbox event: id={}, type={}", event.getId(), event.getEventType());
        try {
            self.executeHandler(event);
            self.updateStatus(event, OutboxStatus.COMPLETED, null);
        } catch (Throwable t) {
            log.error("Failed to process outbox event: id={}", event.getId(), t);
            self.updateStatus(event, OutboxStatus.FAILED, t.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void executeHandler(OutboxEvent outboxEvent) throws Exception {
        Class<?> eventClass = Class.forName(outboxEvent.getEventType());
        Object event = objectMapper.readValue(outboxEvent.getPayload(), eventClass);

        if (event instanceof BookChangedEvent e) {
            bookDetailEventHandler.handleBookChanged(e);
        } else if (event instanceof AuthorChangedEvent e) {
            bookDetailEventHandler.handleAuthorChanged(e);
        } else if (event instanceof CategoryChangedEvent e) {
            bookDetailEventHandler.handleCategoryChanged(e);
        } else if (event instanceof PublisherChangedEvent e) {
            bookDetailEventHandler.handlePublisherChanged(e);
        } else if (event instanceof InventoryChangedEvent e) {
            bookDetailEventHandler.handleInventoryChanged(e);
        } else if (event instanceof BookGraphProjectionEvent e) {
            bookGraphProjectionService.handleBookProjectionEvent(e);
        } else if (event instanceof BookGraphMetadataProjectionEvent e) {
            bookGraphProjectionService.handleBookMetadataProjectionEvent(e);
        } else if (event instanceof CustomerGraphProjectionEvent e) {
            customerGraphProjectionService.handleCustomerProjectionEvent(e);
        } else {
            throw new IllegalArgumentException("Unknown event type: " + outboxEvent.getEventType());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateStatus(OutboxEvent event, OutboxStatus status, String errorMessage) {
        OutboxEvent entity = outboxEventRepository.findById(event.getId()).orElse(event);
        entity.setStatus(status);
        entity.setAttempts(entity.getAttempts() + 1);
        entity.setUpdatedAt(LocalDateTime.now());
        if (status == OutboxStatus.COMPLETED) {
            entity.setProcessedAt(LocalDateTime.now());
            entity.setLastError(null);
        } else {
            // Keep status as FAILED if we hit max attempts or the event failed
            entity.setLastError(errorMessage);
        }
        outboxEventRepository.save(entity);
    }
}
