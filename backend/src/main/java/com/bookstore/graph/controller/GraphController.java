package com.bookstore.graph.controller;

import com.bookstore.graph.dto.request.RecordRatingRequest;
import com.bookstore.graph.dto.request.RecordViewRequest;
import com.bookstore.graph.dto.request.SyncBookRequest;
import com.bookstore.graph.dto.request.SyncOrderRequest;
import com.bookstore.graph.dto.response.*;
import com.bookstore.graph.service.GraphAnalyticsService;
import com.bookstore.graph.service.GraphInteractionService;
import com.bookstore.graph.service.GraphRecommendationService;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.BookGraphProjectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/graph")
@RequiredArgsConstructor
public class GraphController {

    private final GraphRecommendationService recommendationService;
    private final GraphInteractionService interactionService;
    private final GraphAnalyticsService analyticsService;
    private final BookGraphProjectionService bookGraphProjectionService;

    // ════════════════════════════════════════
    //  RECOMMENDATIONS (FR01 · FR02 · FR03)
    // ════════════════════════════════════════

    /** Danh sách tất cả sách (dùng cho sort/filter) */
    @GetMapping("/books")
    public ResponseEntity<List<?>> getAllBooks(
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(analyticsService.getAllBooks(Math.min(limit, 200)));
    }

    /** Chi tiết một cuốn sách */
    @GetMapping("/books/{isbn}")
    public ResponseEntity<?> getBookDetail(@PathVariable String isbn) {
        return recommendationService.getBookDetail(isbn)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Lịch sử đánh giá của một cuốn sách */
    @GetMapping("/books/{isbn}/reviews")
    public ResponseEntity<List<BookReviewResponse>> getBookReviews(@PathVariable String isbn) {
        return ResponseEntity.ok(recommendationService.getBookReviews(isbn));
    }

    /** FR01 – Gợi ý sách cho tài khoản đang đăng nhập */
    @GetMapping("/recommendations/collaborative/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookRecommendationResponse>> collaborativeForCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(
                recommendationService.getCollaborativeRecommendations(userDetails.getUserId().toString())
        );
    }

    /** FR01 – Gợi ý sách theo khách hàng tương đồng (Staff/Admin demo) */
    @GetMapping("/recommendations/collaborative/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<BookRecommendationResponse>> collaborative(
            @PathVariable String customerId) {
        return ResponseEntity.ok(recommendationService.getCollaborativeRecommendations(customerId));
    }

    /** FR02 – Gợi ý sách cùng thể loại / tác giả (Content-Based Filtering) */
    @GetMapping("/recommendations/content-based/{isbn}")
    public ResponseEntity<List<BookRecommendationResponse>> contentBased(
            @PathVariable String isbn) {
        return ResponseEntity.ok(recommendationService.getContentBasedRecommendations(isbn));
    }

    /** FR03 – Gợi ý mua kèm (Market Basket Analysis) */
    @GetMapping("/recommendations/bought-together/{isbn}")
    public ResponseEntity<List<BookRecommendationResponse>> boughtTogether(
            @PathVariable String isbn) {
        return ResponseEntity.ok(recommendationService.getBoughtTogetherRecommendations(isbn));
    }

    // ════════════════════════════════════════
    //  INTERACTIONS  (FR04 · FR05 · FR06)
    // ════════════════════════════════════════

    /** FR04 – Ghi nhận đơn hàng: tạo PURCHASED + cập nhật BOUGHT_TOGETHER */
    @PostMapping("/interactions/order")
    public ResponseEntity<Void> syncOrder(@Valid @RequestBody SyncOrderRequest req) {
        interactionService.syncOrder(req);
        return ResponseEntity.ok().build();
    }

    /** FR05 – Ghi nhận xem sách (VIEWED) */
    @PostMapping("/interactions/view")
    public ResponseEntity<Void> recordView(@Valid @RequestBody RecordViewRequest req) {
        return interactionService.recordView(req)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    /** FR06 – Ghi nhận đánh giá sách (RATED) */
    @GetMapping("/interactions/rating/eligibility/{isbn}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> canRateBook(
            @PathVariable String isbn,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        boolean canRate = interactionService.canRateBook(userDetails.getUserId(), isbn);
        return ResponseEntity.ok(Map.of(
                "canRate", canRate,
                "message", canRate
                        ? "Eligible to rate this book."
                        : "Only customers with a completed order for this book can rate it."
        ));
    }

    @PostMapping("/interactions/rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> recordRating(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody RecordRatingRequest req) {
        interactionService.recordRating(userDetails.getUserId(), req);
        return ResponseEntity.ok().build();
    }

    // ════════════════════════════════════════
    //  SYNC  (Postgres → Neo4j)
    // ════════════════════════════════════════

    /** Đồng bộ thông tin sách từ Postgres vào Neo4j */
    @PostMapping("/sync/book")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Void> syncBook(@Valid @RequestBody SyncBookRequest req) {
        bookGraphProjectionService.syncFromPostgresByIsbn(req.isbn());
        return ResponseEntity.ok().build();
    }

    /** Đồng bộ lại toàn bộ projection sách từ Postgres vào Neo4j */
    @PostMapping("/sync/books")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Integer> syncAllBooks() {
        return ResponseEntity.ok(bookGraphProjectionService.syncAllFromPostgres());
    }

    /** Đồng bộ lại một cuốn sách từ Postgres vào Neo4j theo ISBN */
    @PostMapping("/sync/books/{isbn}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Void> syncBookByIsbn(@PathVariable String isbn) {
        bookGraphProjectionService.syncFromPostgresByIsbn(isbn);
        return ResponseEntity.ok().build();
    }

    // ════════════════════════════════════════
    //  ANALYTICS  (FR07 · FR08 · FR09 · FR10)
    // ════════════════════════════════════════

    /** FR07 – Top 10 thể loại tăng trưởng trong 30 ngày */
    @GetMapping("/analytics/category-growth")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<CategoryGrowthResponse>> categoryGrowth() {
        return ResponseEntity.ok(analyticsService.getCategoryGrowth());
    }

    /** FR08 – Sách có ảnh hưởng cao trong mạng lưới mua sắm */
    @GetMapping("/analytics/influential-books")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<InfluentialBookResponse>> influentialBooks() {
        return ResponseEntity.ok(analyticsService.getInfluentialBooks());
    }

    /** FR09 – Phân nhóm khách hàng cùng sở thích */
    @GetMapping("/analytics/customer-clusters")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<CustomerClusterResponse>> customerClusters() {
        return ResponseEntity.ok(analyticsService.getCustomerClusters());
    }

    /** FR10 – Sách bán chạy nhất */
    @GetMapping("/analytics/bestsellers")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<BestsellerResponse>> bestsellers(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getBestsellers(Math.min(limit, 50)));
    }
}
