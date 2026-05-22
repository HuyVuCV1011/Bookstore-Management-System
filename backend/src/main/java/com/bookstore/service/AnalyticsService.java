package com.bookstore.service;

import com.bookstore.entity.InteractionEvent;
import com.bookstore.entity.InteractionType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.cassandra.core.CassandraTemplate;
import org.springframework.data.cassandra.core.InsertOptions;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final CassandraTemplate cassandraTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    public void trackBookView(UUID userId, Integer bookId) {
        saveEvent(userId, bookId, null, InteractionType.VIEW_BOOK);
    }

    public void trackSearch(UUID userId, String keyword) {
        saveEvent(userId, null, keyword, InteractionType.SEARCH);
    }

    public void trackAddToCart(UUID userId, Integer bookId) {
        saveEvent(userId, bookId, null, InteractionType.ADD_TO_CART);
    }

    public void trackWishlist(UUID userId, Integer bookId) {
        saveEvent(userId, bookId, null, InteractionType.WISHLIST);
    }

    public void trackReview(UUID userId, Integer bookId) {
        saveEvent(userId, bookId, null, InteractionType.REVIEW);
    }

    private void saveEvent(UUID userId, Integer bookId, String keyword, InteractionType type) {
        try {
            InteractionEvent event = InteractionEvent.builder()
                    .id(UUID.randomUUID())
                    .userId(userId)
                    .bookId(bookId)
                    .eventType(String.valueOf(type))
                    .eventTime(Instant.now())
                    .metadata(keyword)
                    .build();

            InsertOptions options = InsertOptions.builder()
                    .ttl(60 * 60 * 24 * 90)
                    .build();
            log.error("Before saving event for userId: {}, bookId: {}", userId, bookId);
            cassandraTemplate.insert(event, options);
            log.error("Saving event for userId: {}, bookId: {}", userId, bookId);
        } catch (Exception e) {
            log.error("Cassandra save failed", e);
        }
    }

    @Transactional
    public void refreshMaterializedViews() {
        log.info("Refreshing materialized views...");
        try {
            // Refresh inventory reorder report
            entityManager.createNativeQuery(
                "REFRESH MATERIALIZED VIEW mv_inventory_reorder_report"
            ).executeUpdate();
            log.info("Refreshed mv_inventory_reorder_report");

            // Refresh catalog statistics
            entityManager.createNativeQuery(
                "REFRESH MATERIALIZED VIEW mv_catalog_statistics"
            ).executeUpdate();
            log.info("Refreshed mv_catalog_statistics");

            // Refresh popular books
            entityManager.createNativeQuery(
                "REFRESH MATERIALIZED VIEW mv_popular_books"
            ).executeUpdate();
            log.info("Refreshed mv_popular_books");

        } catch (Exception e) {
            log.error("Failed to refresh materialized views", e);
            throw new RuntimeException("Failed to refresh materialized views", e);
        }
    }
}