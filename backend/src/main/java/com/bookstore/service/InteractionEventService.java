package com.bookstore.service;

import com.bookstore.entity.InteractionEvent;
import com.bookstore.repository.InteractionEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InteractionEventService {

    private final InteractionEventRepository interactionEventRepository;

    /**
     * Track user interaction event asynchronously
     */
    @Async
    public void trackEvent(UUID userId, Integer bookId, String eventType, String metadata) {
        try {
            log.info("=== TRACKING EVENT START === type: {}, userId: {}, bookId: {}", eventType, userId, bookId);

            InteractionEvent event = InteractionEvent.builder()
                    .id(UUID.randomUUID())
                    .userId(userId)
                    .bookId(bookId)
                    .eventType(eventType)
                    .eventTime(Instant.now())
                    .metadata(metadata != null ? metadata : "{}")
                    .build();

            log.info("Event object created: {}", event);
            interactionEventRepository.save(event);
            log.info("=== TRACKING EVENT SUCCESS === Tracked {} event - userId: {}, bookId: {}", eventType, userId, bookId);
        } catch (Exception e) {
            log.error("=== TRACKING EVENT FAILED === type: {}, userId: {}, bookId: {}",
                    eventType, userId, bookId, e);
            // Don't fail the main request if event tracking fails
        }
    }

    /**
     * Track VIEW event
     */
    public void trackView(UUID userId, Integer bookId) {
        trackEvent(userId, bookId, "VIEW", null);
    }

    /**
     * Track CLICK event
     */
    public void trackClick(UUID userId, Integer bookId) {
        trackEvent(userId, bookId, "CLICK", null);
    }

    /**
     * Track ADD_TO_CART event
     */
    public void trackAddToCart(UUID userId, Integer bookId, int quantity) {
        String metadata = String.format("{\"quantity\":%d}", quantity);
        trackEvent(userId, bookId, "ADD_TO_CART", metadata);
    }

    /**
     * Track PURCHASE event
     */
    public void trackPurchase(UUID userId, Integer bookId, String orderId, double amount) {
        String metadata = String.format("{\"orderId\":\"%s\",\"amount\":%.2f}", orderId, amount);
        trackEvent(userId, bookId, "PURCHASE", metadata);
    }

    /**
     * Track REVIEW event
     */
    public void trackReview(UUID userId, Integer bookId, int rating) {
        String metadata = String.format("{\"rating\":%d}", rating);
        trackEvent(userId, bookId, "REVIEW", metadata);
    }

    /**
     * Track LIKE event
     */
    public void trackLike(UUID userId, Integer bookId) {
        trackEvent(userId, bookId, "LIKE", null);
    }

    /**
     * Track SEARCH event
     */
    public void trackSearch(UUID userId, String query, int resultsCount) {
        String metadata = String.format("{\"query\":\"%s\",\"results\":%d}", query, resultsCount);
        trackEvent(userId, 0, "SEARCH", metadata);
    }

    /**
     * Track BOOKMARK event
     */
    public void trackBookmark(UUID userId, Integer bookId) {
        trackEvent(userId, bookId, "BOOKMARK", null);
    }

    /**
     * Track SHARE event
     */
    public void trackShare(UUID userId, Integer bookId, String platform) {
        String metadata = String.format("{\"platform\":\"%s\"}", platform);
        trackEvent(userId, bookId, "SHARE", metadata);
    }
}
