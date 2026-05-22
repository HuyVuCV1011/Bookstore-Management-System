package com.bookstore.graph.service;

import com.bookstore.graph.dto.response.BestsellerResponse;
import com.bookstore.graph.dto.response.BookListResponse;
import com.bookstore.graph.dto.response.CategoryGrowthResponse;
import com.bookstore.graph.dto.response.CustomerClusterResponse;
import com.bookstore.graph.dto.response.InfluentialBookResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class GraphAnalyticsService {

    private final Neo4jClient neo4jClient;

    // ── FR07: Xem thể loại tăng trưởng trong 30 ngày ────────────────────────────────

    public List<CategoryGrowthResponse> getCategoryGrowth() {
        String cypher = """
                MATCH (c:Customer)-[p:PURCHASED]->(b:Book)-[:BELONGS_TO]->(cat:Category)
                WHERE b.status = 'active'
                  AND p.purchased_at >= localdatetime() - duration('P30D')
                WITH cat.category_id  AS categoryId,
                     cat.name         AS categoryName,
                     SUM(p.quantity * p.unit_price)  AS revenue,
                     COUNT(DISTINCT c)               AS customerCount,
                     SUM(p.quantity)                 AS totalSold,
                     max(p.purchased_at)             AS latestPurchasedAt
                RETURN categoryId, categoryName, revenue, customerCount, totalSold, latestPurchasedAt
                ORDER BY totalSold DESC LIMIT 10
                """;

        Collection<CategoryGrowthResponse> result = neo4jClient.query(cypher)
                .fetchAs(CategoryGrowthResponse.class)
                .mappedBy((ts, record) -> new CategoryGrowthResponse(
                        record.get("categoryId").asString(null),
                        record.get("categoryName").asString(null),
                        record.get("revenue").isNull() ? 0.0 : record.get("revenue").asDouble(),
                        record.get("customerCount").isNull() ? 0L : record.get("customerCount").asLong(),
                        record.get("totalSold").isNull() ? 0L : record.get("totalSold").asLong(),
                        record.get("latestPurchasedAt").isNull()
                                ? null
                                : record.get("latestPurchasedAt").asLocalDateTime().toString()
                ))
                .all();

        return List.copyOf(result);
    }

    // ── FR08: Xác định sách có ảnh hưởng trong mạng lưới (PageRank proxy) ────────────

    public List<InfluentialBookResponse> getInfluentialBooks() {
        String cypher = """
                MATCH (b:Book)
                WHERE b.status = 'active'
                OPTIONAL MATCH (b)<-[:PURCHASED]-(buyer:Customer)
                WITH b,
                     COUNT(DISTINCT CASE
                         WHEN buyer.customer_id IS NOT NULL
                          AND NOT buyer.customer_id STARTS WITH 'anonymous-'
                         THEN buyer
                     END) AS buyerCount
                OPTIONAL MATCH (b)<-[:VIEWED]-(viewer:Customer)
                WITH b, buyerCount,
                     COUNT(DISTINCT CASE
                         WHEN viewer.customer_id IS NOT NULL
                          AND NOT viewer.customer_id STARTS WITH 'anonymous-'
                         THEN viewer
                     END) AS viewerCount
                OPTIONAL MATCH (connectedCustomer:Customer)-[:PURCHASED|VIEWED|RATED]->(b)
                WITH b, buyerCount, viewerCount,
                     COUNT(DISTINCT CASE
                         WHEN connectedCustomer.customer_id IS NOT NULL
                          AND NOT connectedCustomer.customer_id STARTS WITH 'anonymous-'
                         THEN connectedCustomer
                     END) AS connectionCount
                WITH b,
                     (buyerCount * 3.0 + viewerCount * 1.0 + connectionCount * 2.0) AS influenceScore
                RETURN b.isbn       AS isbn,
                       b.title      AS title,
                       b.avg_rating AS avgRating,
                       b.cover_url  AS coverUrl,
                       influenceScore AS score
                ORDER BY influenceScore DESC LIMIT 10
                """;

        Collection<InfluentialBookResponse> result = neo4jClient.query(cypher)
                .fetchAs(InfluentialBookResponse.class)
                .mappedBy((ts, record) -> new InfluentialBookResponse(
                        record.get("isbn").asString(null),
                        record.get("title").asString(null),
                        record.get("avgRating").isNull() ? null : record.get("avgRating").asDouble(),
                        record.get("coverUrl").asString(null),
                        record.get("score").asDouble(0.0)
                ))
                .all();

        return List.copyOf(result);
    }

    // ── FR09: Phân nhóm khách hàng cùng sở thích (Community Detection proxy) ─────────

    public List<CustomerClusterResponse> getCustomerClusters() {
        // Simplified community detection: group customers by their most-purchased category
        String cypher = """
                MATCH (c:Customer)-[:PURCHASED]->(b:Book)-[:BELONGS_TO]->(cat:Category)
                WHERE b.status = 'active'
                WITH c, cat, COUNT(*) AS purchases
                ORDER BY c.customer_id, purchases DESC
                WITH c, COLLECT(cat.name)[0] AS topCategory
                WITH topCategory,
                     COLLECT(c.customer_id) AS customerIds,
                     COUNT(c)               AS clusterSize
                RETURN topCategory  AS clusterName,
                       customerIds,
                       clusterSize
                ORDER BY clusterSize DESC
                """;

        Collection<CustomerClusterResponse> result = neo4jClient.query(cypher)
                .fetchAs(CustomerClusterResponse.class)
                .mappedBy((ts, record) -> {
                    List<String> ids = record.get("customerIds").asList(v -> v.asString());
                    return new CustomerClusterResponse(
                            record.get("clusterName").asString("Unknown"),
                            ids,
                            record.get("clusterSize").asLong(0L)
                    );
                })
                .all();

        return List.copyOf(result);
    }

    // ── Lấy toàn bộ sách (dùng cho sort/filter ở frontend) ───────────────────────────

    public List<BookListResponse> getAllBooks(int limit) {
        String cypher = """
                MATCH (b:Book)
                WHERE b.status = 'active'
                OPTIONAL MATCH (b)-[:BELONGS_TO]->(cat:Category)
                OPTIONAL MATCH (b)-[:WRITTEN_BY]->(a:Author)
                OPTIONAL MATCH (b)-[:PUBLISHED_BY]->(p:Publisher)
                OPTIONAL MATCH (b)<-[v:VIEWED]-(:Customer)
                WITH b, cat, a, p, COUNT(v) AS relationshipViewCount
                RETURN b.isbn           AS isbn,
                       b.title          AS title,
                       b.price          AS price,
                       b.avg_rating     AS avgRating,
                       b.rating_count   AS ratingCount,
                       b.purchase_count AS purchaseCount,
                       coalesce(b.view_count, relationshipViewCount) AS viewCount,
                       b.cover_url      AS coverUrl,
                       cat.category_id  AS categoryId,
                       cat.name         AS categoryName,
                       a.name           AS authorName,
                       p.name           AS publisherName,
                       b.published_year AS publishedYear,
                       b.language       AS language
                LIMIT $limit
                """;

        Collection<BookListResponse> result = neo4jClient.query(cypher)
                .bindAll(Map.of("limit", limit))
                .fetchAs(BookListResponse.class)
                .mappedBy((ts, r) -> new BookListResponse(
                        r.get("isbn").asString(null),
                        r.get("title").asString(null),
                        r.get("price").isNull() ? null : r.get("price").asDouble(),
                        r.get("avgRating").isNull() ? null : r.get("avgRating").asDouble(),
                        r.get("ratingCount").isNull() ? 0 : r.get("ratingCount").asInt(),
                        r.get("purchaseCount").isNull() ? 0 : r.get("purchaseCount").asInt(),
                        r.get("viewCount").isNull() ? 0 : r.get("viewCount").asInt(),
                        r.get("coverUrl").asString(null),
                        r.get("categoryId").asString(null),
                        r.get("categoryName").asString(null),
                        r.get("authorName").asString(null),
                        r.get("publisherName").asString(null),
                        r.get("publishedYear").isNull() ? null : r.get("publishedYear").asInt(),
                        r.get("language").asString(null)
                ))
                .all();

        return List.copyOf(result);
    }

    // ── FR10: Xác định sách bán chạy ────────────────────────────────────────────────

    public List<BestsellerResponse> getBestsellers(int limit) {
        String cypher = """
                MATCH (b:Book)
                WHERE b.status = 'active'
                  AND b.purchase_count IS NOT NULL
                  AND b.purchase_count > 0
                WITH b ORDER BY b.purchase_count DESC LIMIT $limit
                OPTIONAL MATCH (b)-[:WRITTEN_BY]->(a:Author)
                OPTIONAL MATCH (b)-[:BELONGS_TO]->(cat:Category)
                RETURN b.isbn           AS isbn,
                       b.title          AS title,
                       b.price          AS price,
                       b.avg_rating     AS avgRating,
                       b.cover_url      AS coverUrl,
                       b.purchase_count AS totalSold,
                       b.rating_count   AS ratingCount,
                       b.view_count     AS viewCount,
                       a.name           AS authorName,
                       cat.name         AS categoryName
                """;

        AtomicInteger rank = new AtomicInteger(1);
        Collection<BestsellerResponse> result = neo4jClient.query(cypher)
                .bindAll(Map.of("limit", limit))
                .fetchAs(BestsellerResponse.class)
                .mappedBy((ts, record) -> new BestsellerResponse(
                        record.get("isbn").asString(null),
                        record.get("title").asString(null),
                        record.get("price").isNull() ? null : record.get("price").asDouble(),
                        record.get("avgRating").isNull() ? null : record.get("avgRating").asDouble(),
                        record.get("coverUrl").asString(null),
                        record.get("totalSold").isNull() ? 0 : record.get("totalSold").asInt(),
                        rank.getAndIncrement(),
                        record.get("ratingCount").isNull() ? null : record.get("ratingCount").asInt(),
                        record.get("viewCount").isNull() ? null : record.get("viewCount").asInt(),
                        record.get("authorName").asString(null),
                        record.get("categoryName").asString(null)
                ))
                .all();

        return List.copyOf(result);
    }
}
