package com.bookstore.controller;

import com.bookstore.dto.response.AuthorResponse;
import com.bookstore.dto.response.AutocompleteResponse;
import com.bookstore.dto.response.BookResponse;
import com.bookstore.dto.response.CategoryResponse;
import com.bookstore.dto.response.PublisherResponse;
import com.bookstore.entity.Book;
import com.bookstore.repository.BookRepository;
import com.bookstore.service.SearchAutocompleteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Redis-based fast search API with autocomplete
 */
@Slf4j
@RestController
@RequestMapping("/api/redis-search")
@RequiredArgsConstructor
public class RedisSearchController {

    private final SearchAutocompleteService autocompleteService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final BookRepository bookRepository;

    private static final String AC_KEY = "search:autocomplete";

    /**
     * Fast search with Redis autocomplete + PostgreSQL book details
     * GET /api/redis-search?q=harry&limit=10
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> fastSearch(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "10") int limit
    ) {
        long startTime = System.currentTimeMillis();

        Map<String, Object> response = new HashMap<>();

        if (q == null || q.trim().isEmpty()) {
            response.put("results", Collections.emptyList());
            response.put("count", 0);
            response.put("query", "");
            response.put("source", "redis");
            response.put("responseTime", 0);
            return ResponseEntity.ok(response);
        }

        try {
            // 1. Record search keyword in Redis
            autocompleteService.recordSearchKeyword(q);

            // 2. Get autocomplete suggestions from Redis
            List<AutocompleteResponse> suggestions = autocompleteService.getSuggestions(q);

            // 3. Extract book IDs and fetch from PostgreSQL
            List<BookResponse> books = new ArrayList<>();
            for (AutocompleteResponse suggestion : suggestions) {
                if (suggestion.getBookId() != null && !suggestion.getBookId().isEmpty()) {
                    try {
                        Integer bookId = Integer.parseInt(suggestion.getBookId());
                        Optional<Book> bookOpt = bookRepository.findById(bookId);

                        if (bookOpt.isPresent()) {
                            Book book = bookOpt.get();
                            BookResponse bookResponse = BookResponse.builder()
                                    .id(book.getId())
                                    .isbn(book.getIsbn())
                                    .title(book.getTitle())
                                    .price(book.getPrice())
                                    .stockQuantity(book.getStockQuantity())
                                    .category(book.getCategory() != null ?
                                            CategoryResponse.builder()
                                                    .id(book.getCategory().getId())
                                                    .name(book.getCategory().getName())
                                                    .build() : null)
                                    .author(book.getAuthor() != null ?
                                            AuthorResponse.builder()
                                                    .id(book.getAuthor().getId())
                                                    .name(book.getAuthor().getName())
                                                    .build() : null)
                                    .publisher(book.getPublisher() != null ?
                                            PublisherResponse.builder()
                                                    .id(book.getPublisher().getId())
                                                    .name(book.getPublisher().getName())
                                                    .build() : null)
                                    .publicationYear(book.getPublicationYear())
                                    .businessStatus(book.getBusinessStatus())
                                    .build();
                            books.add(bookResponse);

                            if (books.size() >= limit) {
                                break;
                            }
                        }
                    } catch (NumberFormatException e) {
                        log.warn("Invalid book ID in autocomplete: {}", suggestion.getBookId());
                    }
                }
            }

            long responseTime = System.currentTimeMillis() - startTime;

            response.put("results", books);
            response.put("count", books.size());
            response.put("query", q);
            response.put("source", "redis+postgres");
            response.put("responseTime", responseTime);
            response.put("suggestions", suggestions.stream().limit(5).collect(Collectors.toList()));

            log.info("Redis search for '{}' returned {} results in {}ms", q, books.size(), responseTime);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error in Redis search", e);
            response.put("results", Collections.emptyList());
            response.put("count", 0);
            response.put("query", q);
            response.put("error", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Get autocomplete suggestions only (lightweight)
     * GET /api/redis-search/autocomplete?q=harry
     */
    @GetMapping("/autocomplete")
    public ResponseEntity<List<AutocompleteResponse>> getAutocomplete(
            @RequestParam String q
    ) {
        return ResponseEntity.ok(autocompleteService.getSuggestions(q));
    }

    /**
     * Get trending keywords
     * GET /api/redis-search/trending/keywords?limit=10
     */
    @GetMapping("/trending/keywords")
    public ResponseEntity<List<String>> getTrendingKeywords(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(autocompleteService.getTrendingKeywords(limit));
    }

    /**
     * Get trending books
     * GET /api/redis-search/trending/books?limit=10
     */
    @GetMapping("/trending/books")
    public ResponseEntity<List<AutocompleteResponse>> getTrendingBooks(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(autocompleteService.getTrendingBooks(limit));
    }

    /**
     * Rebuild the autocomplete index from PostgreSQL
     * POST /api/redis-search/rebuild-index
     */
    @PostMapping("/rebuild-index")
    public ResponseEntity<Map<String, Object>> rebuildIndex() {
        try {
            log.info("Starting Redis autocomplete index rebuild from PostgreSQL...");

            // Clear existing autocomplete data
            redisTemplate.delete(AC_KEY);

            // Fetch all active books from PostgreSQL
            List<Book> books = bookRepository.findAll();

            int indexed = 0;
            for (Book book : books) {
                if (book.getBusinessStatus() != null &&
                    book.getBusinessStatus().toString().equals("ACTIVE")) {
                    // Store as normalized_title:id
                    String value = book.getTitle().toLowerCase() + ":" + book.getId();
                    redisTemplate.opsForZSet().add(AC_KEY, value, 0);
                    indexed++;
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Autocomplete index rebuilt successfully");
            response.put("totalBooks", books.size());
            response.put("indexedBooks", indexed);
            response.put("source", "postgresql");

            log.info("✅ Rebuilt autocomplete index with {} active books", indexed);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error rebuilding autocomplete index", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Get Redis search statistics
     * GET /api/redis-search/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            // Autocomplete index size
            Long autocompleteSize = redisTemplate.opsForZSet().size(AC_KEY);
            stats.put("autocompleteIndexSize", autocompleteSize != null ? autocompleteSize : 0);

            // Trending keywords count
            Long trendingKeywordsCount = redisTemplate.opsForZSet().size("search:trending:keywords");
            stats.put("trendingKeywordsCount", trendingKeywordsCount != null ? trendingKeywordsCount : 0);

            // Trending books count
            Long trendingBooksCount = redisTemplate.opsForZSet().size("search:trending:books");
            stats.put("trendingBooksCount", trendingBooksCount != null ? trendingBooksCount : 0);

            // Sample autocomplete entries
            Set<Object> sampleEntries = redisTemplate.opsForZSet().range(AC_KEY, 0, 4);
            stats.put("sampleAutocompleteEntries", sampleEntries);

            stats.put("status", "healthy");

        } catch (Exception e) {
            log.error("Error fetching Redis stats", e);
            stats.put("status", "error");
            stats.put("error", e.getMessage());
        }

        return ResponseEntity.ok(stats);
    }
}
