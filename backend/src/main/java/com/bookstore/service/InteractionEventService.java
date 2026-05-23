package com.bookstore.service;

import com.bookstore.entity.InteractionEvent;
import com.bookstore.entity.InteractionEventByType;
import com.bookstore.entity.InteractionEventByBucket;
import com.bookstore.entity.InteractionEventByUser;
import com.bookstore.repository.cassandra.InteractionEventRepository;
import com.bookstore.repository.cassandra.InteractionEventByTypeRepository;
import com.bookstore.repository.cassandra.InteractionEventByBucketRepository;
import com.bookstore.repository.cassandra.InteractionEventByUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InteractionEventService {

    private final InteractionEventRepository interactionEventRepository;
    private final InteractionEventByTypeRepository interactionEventByTypeRepository;
    private final InteractionEventByBucketRepository interactionEventByBucketRepository;
    private final InteractionEventByUserRepository interactionEventByUserRepository;
    private final StringRedisTemplate redisTemplate;

    /**
     * Track user interaction event asynchronously
     */
    @Async
    public void trackEvent(UUID userId, Integer bookId, String eventType, String metadata) {
        try {
            log.debug("=== TRACKING EVENT START === type: {}, userId: {}, bookId: {}", eventType, userId, bookId);

            UUID id = UUID.randomUUID();
            Instant eventTime = Instant.now();
            String meta = metadata != null ? metadata : "{}";

            // 1. Save to primary table
            InteractionEvent event = InteractionEvent.builder()
                    .id(id)
                    .userId(userId)
                    .bookId(bookId)
                    .eventType(eventType)
                    .eventTime(eventTime)
                    .metadata(meta)
                    .build();
            interactionEventRepository.save(event);

            // 2. Save to query-oriented type table
            InteractionEventByType typeEvent = InteractionEventByType.builder()
                    .eventType(eventType)
                    .eventTime(eventTime)
                    .id(id)
                    .userId(userId)
                    .bookId(bookId)
                    .metadata(meta)
                    .build();
            interactionEventByTypeRepository.save(typeEvent);

            // 3. Save to query-oriented bucket table
            InteractionEventByBucket bucketEvent = InteractionEventByBucket.builder()
                    .bucket("all")
                    .eventTime(eventTime)
                    .id(id)
                    .userId(userId)
                    .bookId(bookId)
                    .eventType(eventType)
                    .metadata(meta)
                    .build();
            interactionEventByBucketRepository.save(bucketEvent);

            // 4. Save to query-oriented user table
            if (userId != null) {
                InteractionEventByUser userEvent = InteractionEventByUser.builder()
                        .userId(userId)
                        .eventTime(eventTime)
                        .id(id)
                        .bookId(bookId)
                        .eventType(eventType)
                        .metadata(meta)
                        .build();
                interactionEventByUserRepository.save(userEvent);
            }

            // 5. Maintain Redis aggregates for high-speed admin stats
            maintainRedisMetrics(userId, bookId, eventType);

            log.debug("=== TRACKING EVENT SUCCESS === Tracked {} event - userId: {}, bookId: {}", eventType, userId, bookId);
        } catch (Exception e) {
            log.error("=== TRACKING EVENT FAILED === type: {}, userId: {}, bookId: {}",
                    eventType, userId, bookId, e);
        }
    }

    private void maintainRedisMetrics(UUID userId, Integer bookId, String eventType) {
        try {
            // General counters
            redisTemplate.opsForValue().increment("stats:events:total");

            String todayStr = LocalDate.now().toString();
            String todayKey = "stats:events:today:" + todayStr;
            Long todayCount = redisTemplate.opsForValue().increment(todayKey);
            if (todayCount != null && todayCount == 1) {
                redisTemplate.expire(todayKey, Duration.ofHours(48));
            }

            if (userId != null) {
                redisTemplate.opsForSet().add("stats:events:unique_users", userId.toString());
            }

            // Event distribution hash
            redisTemplate.opsForHash().increment("stats:events:distribution", eventType, 1L);

            // Top Books ZSets
            if (bookId != null && bookId > 0) {
                String metric = switch (eventType) {
                    case "VIEW" -> "views";
                    case "CLICK" -> "clicks";
                    case "ADD_TO_CART" -> "cart";
                    case "PURCHASE" -> "purchases";
                    case "BOOKMARK" -> "wishlist";
                    default -> null;
                };
                if (metric != null) {
                    redisTemplate.opsForZSet().incrementScore("stats:books:" + metric, bookId.toString(), 1.0);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to maintain Redis metrics for event: {}", eventType, e);
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
