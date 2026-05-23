package com.bookstore.listener;

import com.bookstore.entity.OutboxEvent;
import com.bookstore.entity.OutboxStatus;
import com.bookstore.event.*;
import com.bookstore.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxEventPublishListener {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @EventListener
    public void handleBookChangedEvent(BookChangedEvent event) {
        saveEvent(event);
    }

    @EventListener
    public void handleAuthorChangedEvent(AuthorChangedEvent event) {
        saveEvent(event);
    }

    @EventListener
    public void handleCategoryChangedEvent(CategoryChangedEvent event) {
        saveEvent(event);
    }

    @EventListener
    public void handlePublisherChangedEvent(PublisherChangedEvent event) {
        saveEvent(event);
    }

    @EventListener
    public void handleInventoryChangedEvent(InventoryChangedEvent event) {
        saveEvent(event);
    }

    @EventListener
    public void handleBookGraphProjectionEvent(BookGraphProjectionEvent event) {
        saveEvent(event);
    }

    @EventListener
    public void handleBookGraphMetadataProjectionEvent(BookGraphMetadataProjectionEvent event) {
        saveEvent(event);
    }

    @EventListener
    public void handleCustomerGraphProjectionEvent(CustomerGraphProjectionEvent event) {
        saveEvent(event);
    }

    private void saveEvent(Object event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .eventType(event.getClass().getName())
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .attempts(0)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            outboxEventRepository.save(outboxEvent);
            log.debug("[Outbox] Saved outbox event for: {}", event.getClass().getSimpleName());
        } catch (Exception e) {
            log.error("[Outbox] Failed to save event of type {} to outbox", event.getClass().getSimpleName(), e);
        }
    }
}
