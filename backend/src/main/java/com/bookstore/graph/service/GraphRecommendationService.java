package com.bookstore.graph.service;

import com.bookstore.graph.dto.response.BookDetailResponse;
import com.bookstore.graph.dto.response.BookRecommendationResponse;
import com.bookstore.graph.dto.response.BookReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GraphRecommendationService {

    private final Neo4jClient neo4jClient;

    // ── Lấy chi tiết một cuốn sách ───────────────────────────────────────────────────

    public Optional<BookDetailResponse> getBookDetail(String isbn) {
        String cypher = """
                MATCH (b:Book {isbn: $isbn})
                OPTIONAL MATCH (b)-[:WRITTEN_BY]->(a:Author)
                OPTIONAL MATCH (b)-[:BELONGS_TO]->(cat:Category)
                OPTIONAL MATCH (b)-[:PUBLISHED_BY]->(pub:Publisher)
                OPTIONAL MATCH (b)<-[v:VIEWED]-(:Customer)
                WITH b, a, cat, pub, COUNT(v) AS relationshipViewCount
                RETURN b.isbn           AS isbn,
                       b.title          AS title,
                       b.description    AS description,
                       b.price          AS price,
                       b.avg_rating     AS avgRating,
                       b.rating_count   AS ratingCount,
                       b.purchase_count AS purchaseCount,
                       coalesce(b.view_count, relationshipViewCount) AS viewCount,
                       b.cover_url      AS coverUrl,
                       b.status         AS status,
                       b.language       AS language,
                       b.published_year AS publishedYear,
                       a.author_id      AS authorId,
                       a.name           AS authorName,
                       cat.category_id  AS categoryId,
                       cat.name         AS categoryName,
                       pub.publisher_id AS publisherId,
                       pub.name         AS publisherName
                LIMIT 1
                """;

        return neo4jClient.query(cypher)
                .bindAll(Map.of("isbn", isbn))
                .fetchAs(BookDetailResponse.class)
                .mappedBy((ts, record) -> new BookDetailResponse(
                        record.get("isbn").asString(null),
                        record.get("title").asString(null),
                        record.get("description").asString(null),
                        record.get("price").isNull() ? null : record.get("price").asDouble(),
                        record.get("avgRating").isNull() ? null : record.get("avgRating").asDouble(),
                        record.get("ratingCount").isNull() ? null : record.get("ratingCount").asInt(),
                        record.get("purchaseCount").isNull() ? null : record.get("purchaseCount").asInt(),
                        record.get("viewCount").isNull() ? null : record.get("viewCount").asInt(),
                        record.get("coverUrl").asString(null),
                        record.get("status").asString(null),
                        record.get("language").asString(null),
                        record.get("publishedYear").isNull() ? null : record.get("publishedYear").asInt(),
                        record.get("authorId").asString(null),
                        record.get("authorName").asString(null),
                        record.get("categoryId").asString(null),
                        record.get("categoryName").asString(null),
                        record.get("publisherId").asString(null),
                        record.get("publisherName").asString(null)
                ))
                .one();
    }

    public List<BookReviewResponse> getBookReviews(String isbn) {
        String cypher = """
                MATCH (b:Book {isbn: $isbn})<-[r:RATED]-(c:Customer)
                RETURN coalesce(c.name, 'Customer') AS customerName,
                       r.score AS score,
                       r.review_text AS reviewText,
                       toString(r.rated_at) AS ratedAt
                ORDER BY r.rated_at DESC
                LIMIT 50
                """;

        Collection<BookReviewResponse> result = neo4jClient.query(cypher)
                .bindAll(Map.of("isbn", isbn))
                .fetchAs(BookReviewResponse.class)
                .mappedBy((ts, record) -> new BookReviewResponse(
                        record.get("customerName").asString(null),
                        record.get("score").isNull() ? null : record.get("score").asDouble(),
                        record.get("reviewText").asString(null),
                        record.get("ratedAt").asString(null)
                ))
                .all();

        return List.copyOf(result);
    }

    // ── FR01: Gợi ý sách theo khách hàng tương đồng (Collaborative Filtering) ──────

    public List<BookRecommendationResponse> getCollaborativeRecommendations(String customerId) {
        // Q1 – Collaborative Filtering:
        // Find customers who bought at least one same book, then recommend books they bought
        // that the current customer has not purchased yet.
        String cypher = """
                MATCH (me:Customer {customer_id: $customerId})-[:PURCHASED]->(purchased:Book)
                WHERE purchased.status = 'active'
                MATCH (similar:Customer)-[:PURCHASED]->(purchased)
                WHERE similar <> me
                MATCH (similar)-[:PURCHASED]->(rec:Book)
                WHERE NOT (me)-[:PURCHASED]->(rec)
                  AND rec.status = 'active'
                WITH rec,
                     COUNT(DISTINCT similar)   AS similarCount,
                     COUNT(DISTINCT purchased) AS sharedBookCount,
                     rec.avg_rating            AS avgRating
                WHERE similarCount >= 1
                RETURN rec.isbn      AS isbn,
                       rec.title     AS title,
                       rec.price     AS price,
                       avgRating     AS avgRating,
                       rec.cover_url AS coverUrl,
                       (sharedBookCount * 1.0 + similarCount * 0.7 + coalesce(avgRating, 0.0) * 0.3) AS score
                ORDER BY score DESC LIMIT 10
                """;

        Collection<BookRecommendationResponse> result = neo4jClient.query(cypher)
                .bindAll(Map.of("customerId", customerId))
                .fetchAs(BookRecommendationResponse.class)
                .mappedBy((ts, record) -> new BookRecommendationResponse(
                        record.get("isbn").asString(null),
                        record.get("title").asString(null),
                        record.get("price").isNull() ? null : record.get("price").asDouble(),
                        record.get("avgRating").isNull() ? null : record.get("avgRating").asDouble(),
                        record.get("coverUrl").asString(null),
                        record.get("score").asDouble(0.0),
                        "collaborative"
                ))
                .all();

        return List.copyOf(result);
    }

    // ── FR02: Gợi ý sách cùng thể loại / tác giả (Content-Based Filtering) ─────────

    public List<BookRecommendationResponse> getContentBasedRecommendations(String isbn) {
        // Q2 – Content-Based Filtering (README spec)
        // author weight = 3, category weight = 1; book matching both gets score 4
        String cypher = """
                MATCH (b:Book {isbn: $isbn})
                WHERE b.status = 'active'
                OPTIONAL MATCH (b)-[:WRITTEN_BY]->(a:Author)<-[:WRITTEN_BY]-(rec1:Book)
                  WHERE rec1.isbn <> $isbn AND rec1.status = 'active'
                WITH b, collect(DISTINCT rec1) AS authorRecs
                OPTIONAL MATCH (b)-[:BELONGS_TO]->(cat:Category)<-[:BELONGS_TO]-(rec2:Book)
                  WHERE rec2.isbn <> $isbn AND rec2.status = 'active'
                WITH authorRecs, collect(DISTINCT rec2) AS catRecs
                WITH authorRecs + [r IN catRecs WHERE NOT r IN authorRecs] AS allRecs,
                     authorRecs, catRecs
                UNWIND allRecs AS rec
                WITH rec,
                     (CASE WHEN rec IN authorRecs THEN 3 ELSE 0 END +
                      CASE WHEN rec IN catRecs    THEN 1 ELSE 0 END) AS score,
                     CASE WHEN rec IN authorRecs AND rec IN catRecs THEN 'both'
                          WHEN rec IN authorRecs THEN 'author'
                          ELSE 'category' END AS basis
                RETURN rec.isbn       AS isbn,
                       rec.title      AS title,
                       rec.price      AS price,
                       rec.avg_rating AS avgRating,
                       rec.cover_url  AS coverUrl,
                       score, basis
                ORDER BY score DESC, rec.avg_rating DESC LIMIT 8
                """;

        Collection<BookRecommendationResponse> result = neo4jClient.query(cypher)
                .bindAll(Map.of("isbn", isbn))
                .fetchAs(BookRecommendationResponse.class)
                .mappedBy((ts, record) -> new BookRecommendationResponse(
                        record.get("isbn").asString(null),
                        record.get("title").asString(null),
                        record.get("price").isNull() ? null : record.get("price").asDouble(),
                        record.get("avgRating").isNull() ? null : record.get("avgRating").asDouble(),
                        record.get("coverUrl").asString(null),
                        record.get("score").asDouble(0.0),
                        record.get("basis").asString(null)
                ))
                .all();

        return List.copyOf(result);
    }

    // ── FR03: Gợi ý mua kèm (Market Basket Analysis) ────────────────────────────────

    public List<BookRecommendationResponse> getBoughtTogetherRecommendations(String isbn) {
        String cypher = """
                MATCH (b:Book {isbn: $isbn})-[bt:BOUGHT_TOGETHER]-(rec:Book)
                WHERE b.status = 'active' AND rec.status = 'active'
                RETURN rec.isbn      AS isbn,
                       rec.title     AS title,
                       rec.price     AS price,
                       rec.avg_rating AS avgRating,
                       rec.cover_url AS coverUrl,
                       bt.confidence AS score
                ORDER BY bt.confidence DESC LIMIT 5
                """;

        Collection<BookRecommendationResponse> result = neo4jClient.query(cypher)
                .bindAll(Map.of("isbn", isbn))
                .fetchAs(BookRecommendationResponse.class)
                .mappedBy((ts, record) -> new BookRecommendationResponse(
                        record.get("isbn").asString(null),
                        record.get("title").asString(null),
                        record.get("price").isNull() ? null : record.get("price").asDouble(),
                        record.get("avgRating").isNull() ? null : record.get("avgRating").asDouble(),
                        record.get("coverUrl").asString(null),
                        record.get("score").isNull() ? 0.0 : record.get("score").asDouble(),
                        "co-purchase"
                ))
                .all();

        return List.copyOf(result);
    }
}
