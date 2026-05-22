package com.bookstore.graph.service;

import com.bookstore.entity.OrderStatus;
import com.bookstore.exception.BusinessRuleException;
import com.bookstore.graph.dto.request.RecordRatingRequest;
import com.bookstore.graph.dto.request.RecordViewRequest;
import com.bookstore.graph.dto.request.SyncBookRequest;
import com.bookstore.graph.dto.request.SyncOrderRequest;
import com.bookstore.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class GraphInteractionService {

    private final Neo4jClient neo4jClient;
    private final OrderRepository orderRepository;

    // ── FR04: Ghi nhận mua hàng (PURCHASED) + cập nhật BOUGHT_TOGETHER ──────────────

    @Transactional
    public void syncOrder(SyncOrderRequest req) {
        for (SyncOrderRequest.OrderItemRequest item : req.items()) {
            neo4jClient.query("""
                    MERGE (c:Customer {customer_id: $customerId})
                    WITH c
                    MATCH (b:Book {isbn: $isbn})
                    WHERE b.status = 'active'
                    WITH c, b
                    OPTIONAL MATCH (c)-[existing:PURCHASED {order_id: $orderId}]->(b)
                    WITH c, b, coalesce(existing.quantity, 0) AS oldQuantity
                    MERGE (c)-[r:PURCHASED {order_id: $orderId}]->(b)
                    SET r.quantity      = $quantity,
                        r.unit_price    = $unitPrice,
                        r.purchased_at  = localdatetime($purchasedAt)
                    WITH b, oldQuantity
                    SET b.purchase_count = coalesce(b.purchase_count, 0) + ($quantity - oldQuantity)
                    """)
                    .bindAll(Map.of(
                            "customerId",  req.customerId(),
                            "isbn",        item.isbn(),
                            "quantity",    item.quantity(),
                            "unitPrice",   item.unitPrice(),
                            "purchasedAt", req.purchasedAt().toString(),
                            "orderId",     req.orderId()
                    ))
                    .run();
        }

        updateBoughtTogether(req.orderId(), req.items());
        log.info("Synced order {} for customer {}", req.orderId(), req.customerId());
    }

    private void updateBoughtTogether(String orderId, List<SyncOrderRequest.OrderItemRequest> items) {
        if (items.size() < 2) return;

        List<Map<String, Object>> pairs = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            for (int j = i + 1; j < items.size(); j++) {
                pairs.add(Map.of(
                        "isbn1", items.get(i).isbn(),
                        "isbn2", items.get(j).isbn(),
                        "orderId", orderId
                ));
            }
        }

        neo4jClient.query("""
                UNWIND $pairs AS pair
                MATCH (b1:Book {isbn: pair.isbn1})
                MATCH (b2:Book {isbn: pair.isbn2})
                WHERE b1.status = 'active' AND b2.status = 'active'
                MERGE (b1)-[bt:BOUGHT_TOGETHER]-(b2)
                ON CREATE SET bt.co_occurrence_count = 0,
                              bt.order_ids           = []
                WITH bt, pair,
                     CASE WHEN pair.orderId IN coalesce(bt.order_ids, []) THEN 0 ELSE 1 END AS delta
                SET bt.order_ids = CASE
                                      WHEN delta = 1 THEN coalesce(bt.order_ids, []) + pair.orderId
                                      ELSE coalesce(bt.order_ids, [])
                                    END,
                    bt.co_occurrence_count = coalesce(bt.co_occurrence_count, 0) + delta,
                    bt.confidence          = toFloat(coalesce(bt.co_occurrence_count, 0) + delta)
                                             / (coalesce(bt.co_occurrence_count, 0) + delta + 5.0),
                    bt.last_updated        = localdatetime()
                """)
                .bindAll(Map.of("pairs", pairs))
                .run();
    }

    // ── FR05: Ghi nhận xem sách (VIEWED) ────────────────────────────────────────────

    public boolean recordView(RecordViewRequest req) {
        boolean productExists = neo4jClient.query("""
                MATCH (b:Book {isbn: $isbn})
                WHERE b.status = 'active'
                RETURN count(b) > 0 AS exists
                """)
                .bindAll(Map.of("isbn", req.isbn()))
                .fetchAs(Boolean.class)
                .mappedBy((ts, record) -> record.get("exists").asBoolean(false))
                .one()
                .orElse(false);

        if (!productExists) {
            return false;
        }

        String customerId = req.customerId() != null && !req.customerId().isBlank()
                ? req.customerId()
                : "anonymous-" + req.sessionId();

        neo4jClient.query("""
                MATCH (b:Book {isbn: $isbn})
                WHERE b.status = 'active'
                MERGE (c:Customer {customer_id: $customerId})
                WITH c, b
                OPTIONAL MATCH (c)-[existingView:VIEWED {session_id: $sessionId}]->(b)
                WITH c, b, existingView
                WHERE existingView IS NULL
                CREATE (c)-[:VIEWED {
                    session_id: $sessionId,
                    viewed_at: localdatetime(),
                    duration_seconds: $durationSeconds
                }]->(b)
                SET b.view_count = coalesce(b.view_count, 0) + 1
                """)
                .bindAll(Map.of(
                        "customerId",      customerId,
                        "isbn",            req.isbn(),
                        "durationSeconds", req.durationSeconds(),
                        "sessionId",       req.sessionId()
                ))
                .run();

        return true;
    }

    // ── FR06: Ghi nhận đánh giá sách (RATED) ────────────────────────────────────────

    public boolean canRateBook(UUID userId, String isbn) {
        if (userId == null || isbn == null || isbn.isBlank()) {
            return false;
        }

        return orderRepository.existsCompletedPurchaseByUserIdAndIsbn(userId, isbn, OrderStatus.COMPLETED);
    }

    public void recordRating(UUID authenticatedUserId, RecordRatingRequest req) {
        if (!canRateBook(authenticatedUserId, req.isbn())) {
            throw new BusinessRuleException("Only customers with a completed order for this book can rate it.");
        }

        neo4jClient.query("""
                MERGE (c:Customer {customer_id: $customerId})
                WITH c
                MATCH (b:Book {isbn: $isbn})
                WHERE b.status = 'active'
                MERGE (c)-[r:RATED]->(b)
                ON CREATE SET r.score        = $score,
                              r.review_text  = $reviewText,
                              r.rated_at     = localdatetime(),
                              r.helpful_count = 0
                ON MATCH  SET r.score        = $score,
                              r.review_text  = $reviewText,
                              r.rated_at     = localdatetime()
                WITH b
                MATCH (b)<-[allRatings:RATED]-()
                WITH b, avg(allRatings.score) AS newAvg, count(allRatings) AS cnt
                SET b.avg_rating   = round(newAvg * 10) / 10.0,
                    b.rating_count = cnt
                """)
                .bindAll(Map.of(
                        "customerId",  authenticatedUserId.toString(),
                        "isbn",        req.isbn(),
                        "score",       req.score(),
                        "reviewText",  req.reviewText() != null ? req.reviewText() : ""
                ))
                .run();
    }

    // ── Sync sách từ Postgres vào Neo4j (gọi sau khi tạo/cập nhật sách) ─────────────

    public void syncBook(SyncBookRequest req) {
        neo4jClient.query("""
                MERGE (b:Book {isbn: $isbn})
                SET b.title          = $title,
                    b.description    = $description,
                    b.language       = $language,
                    b.published_year = $publishedYear,
                    b.price          = $price,
                    b.status         = $status,
                    b.source         = 'postgres_projection',
                    b.synced_at      = localdatetime(),
                    b.cover_url      = CASE
                                         WHEN $coverUrl <> '' THEN $coverUrl
                                          ELSE coalesce(b.cover_url, '')
                                       END
                WITH b
                OPTIONAL MATCH (b)-[oldAuthor:WRITTEN_BY]->(:Author)
                DELETE oldAuthor
                WITH b
                OPTIONAL MATCH (b)-[oldCategory:BELONGS_TO]->(:Category)
                DELETE oldCategory
                WITH b
                OPTIONAL MATCH (b)-[oldPublisher:PUBLISHED_BY]->(:Publisher)
                DELETE oldPublisher
                WITH b
                MERGE (a:Author {author_id: $authorId})
                ON CREATE SET a.name = $authorName
                ON MATCH SET a.name = $authorName
                MERGE (b)-[:WRITTEN_BY]->(a)
                WITH b
                MERGE (cat:Category {category_id: $categoryId})
                ON CREATE SET cat.name = $categoryName
                ON MATCH SET cat.name = $categoryName
                MERGE (b)-[:BELONGS_TO]->(cat)
                WITH b
                MERGE (pub:Publisher {publisher_id: $publisherId})
                ON CREATE SET pub.name = $publisherName
                ON MATCH SET pub.name = $publisherName
                MERGE (b)-[:PUBLISHED_BY]->(pub)
                """)
                .bindAll(Map.ofEntries(
                        Map.entry("isbn",          req.isbn()),
                        Map.entry("title",         req.title() != null ? req.title() : ""),
                        Map.entry("description",   req.description() != null ? req.description() : ""),
                        Map.entry("language",      req.language() != null ? req.language() : "vi"),
                        Map.entry("publishedYear", req.publishedYear() != null ? req.publishedYear() : 0),
                        Map.entry("price",         req.price() != null ? req.price() : 0.0),
                        Map.entry("status",        req.status() != null ? req.status() : "active"),
                        Map.entry("coverUrl",      req.coverUrl() != null ? req.coverUrl() : ""),
                        Map.entry("authorId",      req.authorId() != null ? req.authorId() : "unknown"),
                        Map.entry("authorName",    req.authorName() != null ? req.authorName() : ""),
                        Map.entry("categoryId",    req.categoryId() != null ? req.categoryId() : "unknown"),
                        Map.entry("categoryName",  req.categoryName() != null ? req.categoryName() : ""),
                        Map.entry("publisherId",   req.publisherId() != null ? req.publisherId() : "unknown"),
                        Map.entry("publisherName", req.publisherName() != null ? req.publisherName() : "")
                ))
                .run();
        log.info("Synced book {} to Neo4j graph", req.isbn());
    }

    public void deactivateBook(String isbn) {
        if (isbn == null || isbn.isBlank()) {
            return;
        }

        neo4jClient.query("""
                MATCH (b:Book {isbn: $isbn})
                SET b.status = 'deleted',
                    b.deleted_at = localdatetime()
                """)
                .bindAll(Map.of("isbn", isbn))
                .run();
        log.info("Marked book {} as deleted in Neo4j graph projection", isbn);
    }

    public long deactivateBooksMissingFrom(Collection<String> validIsbns) {
        Collection<String> isbnList = validIsbns == null ? List.of() : validIsbns;

        return neo4jClient.query("""
                MATCH (b:Book)
                WHERE b.isbn IS NOT NULL
                  AND NOT b.isbn IN $validIsbns
                SET b.status = 'orphaned',
                    b.orphaned_at = localdatetime()
                RETURN count(b) AS affected
                """)
                .bindAll(Map.of("validIsbns", isbnList))
                .fetchAs(Long.class)
                .mappedBy((ts, record) -> record.get("affected").asLong(0L))
                .one()
                .orElse(0L);
    }

    // ── Sync khách hàng từ Postgres vào Neo4j ────────────────────────────────────────

    public void syncCustomer(String customerId, String name, String email) {
        neo4jClient.query("""
                MERGE (c:Customer {customer_id: $customerId})
                SET c.name  = $name,
                    c.email = $email,
                    c.tier  = coalesce(c.tier, 'bronze'),
                    c.status = 'active',
                    c.synced_at = localdatetime()
                """)
                .bindAll(Map.of(
                        "customerId", customerId,
                        "name",       name != null ? name : "",
                        "email",      email != null ? email : ""
                ))
                .run();
    }

    public void deactivateCustomer(String customerId) {
        if (customerId == null || customerId.isBlank()) {
            return;
        }

        neo4jClient.query("""
                MATCH (c:Customer {customer_id: $customerId})
                SET c.status = 'inactive',
                    c.deactivated_at = localdatetime()
                """)
                .bindAll(Map.of("customerId", customerId))
                .run();
    }
}
