package com.bookstore.controller;

import com.bookstore.entity.CatalogStatistics;
import com.bookstore.entity.InventoryReorderItem;
import com.bookstore.entity.PopularBook;
import com.bookstore.repository.CatalogStatisticsRepository;
import com.bookstore.repository.InventoryReorderRepository;
import com.bookstore.repository.PopularBookRepository;
import com.bookstore.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final CatalogStatisticsRepository catalogStatisticsRepository;
    private final PopularBookRepository popularBookRepository;
    private final InventoryReorderRepository inventoryReorderRepository;
    private final AnalyticsService analyticsService;

    @GetMapping("/catalog-statistics")
    public ResponseEntity<List<CatalogStatistics>> getCatalogStatistics() {
        return ResponseEntity.ok(catalogStatisticsRepository.findAll());
    }

    @GetMapping("/catalog-statistics/category/{categoryId}")
    public ResponseEntity<CatalogStatistics> getCatalogStatisticsByCategory(@PathVariable Integer categoryId) {
        return catalogStatisticsRepository.findByCategoryId(categoryId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/popular-books")
    public ResponseEntity<List<PopularBook>> getPopularBooks() {
        return ResponseEntity.ok(popularBookRepository.findAll());
    }

    @GetMapping("/popular-books/top/{limit}")
    public ResponseEntity<List<PopularBook>> getTopPopularBooks(@PathVariable int limit) {
        List<PopularBook> books = popularBookRepository.findAll();
        return ResponseEntity.ok(books.stream().limit(limit).toList());
    }

    @GetMapping("/popular-books/category/{categoryId}")
    public ResponseEntity<List<PopularBook>> getPopularBooksByCategory(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(popularBookRepository.findByCategoryId(categoryId));
    }

    @GetMapping("/inventory-reorder")
    public ResponseEntity<List<InventoryReorderItem>> getInventoryReorderReport() {
        return ResponseEntity.ok(inventoryReorderRepository.findAll());
    }

    @GetMapping("/inventory-reorder/priority/{priority}")
    public ResponseEntity<List<InventoryReorderItem>> getInventoryReorderByPriority(@PathVariable String priority) {
        return ResponseEntity.ok(inventoryReorderRepository.findByReorderPriority(priority));
    }

    @GetMapping("/inventory-reorder/urgent")
    public ResponseEntity<List<InventoryReorderItem>> getUrgentReorders() {
        return ResponseEntity.ok(inventoryReorderRepository.findByReorderPriorityIn(List.of("URGENT", "HIGH")));
    }

    @PostMapping("/interactions/book-view/{bookId}")
    public ResponseEntity<Void> trackBookView(@PathVariable Integer bookId, @RequestParam UUID userId) {
        analyticsService.trackBookView(userId, bookId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/interactions/search")
    public ResponseEntity<Void> trackSearch(@RequestParam UUID userId, @RequestParam String keyword) {
        analyticsService.trackSearch(userId, keyword);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/interactions/add-cart/{bookId}")
    public ResponseEntity<Void> trackAddToCart(@PathVariable Integer bookId, @RequestParam UUID userId) {
        analyticsService.trackAddToCart(userId, bookId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/interactions/wishlist/{bookId}")
    public ResponseEntity<Void> trackWishlist(@PathVariable Integer bookId, @RequestParam UUID userId) {
        analyticsService.trackWishlist(userId, bookId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/interactions/review/{bookId}")
    public ResponseEntity<Void> trackReview(@PathVariable Integer bookId, @RequestParam UUID userId) {
        analyticsService.trackReview(userId, bookId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refreshMaterializedViews() {
        analyticsService.refreshMaterializedViews();
        return ResponseEntity.ok().build();
    }
}
