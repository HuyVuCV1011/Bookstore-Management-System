package com.bookstore.service;

import com.bookstore.dto.response.AutocompleteResponse;
import com.bookstore.entity.mongodb.BookSearch;
import com.bookstore.repository.mongodb.BookSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.data.redis.connection.RedisZSetCommands;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class SearchAutocompleteService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final BookSearchRepository bookSearchRepository;

    private static final String AC_KEY = "search:autocomplete";
    private static final String TRENDING_KEYWORDS_KEY = "search:trending:keywords";
    private static final String TRENDING_BOOKS_KEY = "search:trending:books";

    /**
     * Get autocomplete suggestions based on prefix.
     * Uses ZRANGE with BYSCORE to get all entries, then filters by prefix.
     */
    public List<AutocompleteResponse> getSuggestions(String prefix) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String normalizedPrefix = prefix.trim().toLowerCase();
        try {
            // Get all entries from the sorted set
            Set<Object> allEntries = redisTemplate.opsForZSet().range(AC_KEY, 0, -1);

            if (allEntries == null || allEntries.isEmpty()) {
                log.warn("Autocomplete index is empty");
                return Collections.emptyList();
            }

            // Filter entries that start with the prefix
            return allEntries.stream()
                    .map(obj -> (String) obj)
                    .filter(entry -> entry.startsWith(normalizedPrefix))
                    .limit(10)
                    .map(val -> {
                        int lastColon = val.lastIndexOf(":");
                        if (lastColon > 0) {
                            String title = val.substring(0, lastColon);
                            String bookId = val.substring(lastColon + 1);
                            return new AutocompleteResponse(bookId, title);
                        }
                        return new AutocompleteResponse(null, val);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching autocomplete suggestions from Redis", e);
            return Collections.emptyList();
        }
    }

    /**
     * Record a search keyword.
     */
    public void recordSearchKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return;
        }
        try {
            redisTemplate.opsForZSet().incrementScore(TRENDING_KEYWORDS_KEY, keyword.trim().toLowerCase(), 1);
        } catch (Exception e) {
            log.error("Error recording search keyword in Redis", e);
        }
    }

    /**
     * Record a book selection (click).
     */
    public void recordBookSelection(String bookId) {
        if (bookId == null || bookId.isEmpty()) {
            return;
        }
        try {
            redisTemplate.opsForZSet().incrementScore(TRENDING_BOOKS_KEY, bookId, 1);
        } catch (Exception e) {
            log.error("Error recording book selection in Redis", e);
        }
    }

    /**
     * Get trending keywords.
     */
    public List<String> getTrendingKeywords(int limit) {
        try {
            Set<Object> keywords = redisTemplate.opsForZSet().reverseRange(TRENDING_KEYWORDS_KEY, 0, limit - 1);
            if (keywords == null) return Collections.emptyList();
            return keywords.stream().map(Object::toString).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching trending keywords from Redis", e);
            return Collections.emptyList();
        }
    }

    /**
     * Get trending books.
     */
    public List<AutocompleteResponse> getTrendingBooks(int limit) {
        try {
            Set<Object> bookIds = redisTemplate.opsForZSet().reverseRange(TRENDING_BOOKS_KEY, 0, limit - 1);
            if (bookIds == null || bookIds.isEmpty()) return Collections.emptyList();

            List<String> ids = bookIds.stream().map(Object::toString).collect(Collectors.toList());
            
            // Fetch titles from MongoDB or Postgres. For simplicity and keeping it "read model" style, use MongoDB.
            List<AutocompleteResponse> trendingBooks = new ArrayList<>();
            for (String id : ids) {
                bookSearchRepository.findById(Integer.parseInt(id)).ifPresent(book -> 
                    trendingBooks.add(new AutocompleteResponse(String.valueOf(book.getId()), book.getTitle()))
                );
            }
            return trendingBooks;
        } catch (Exception e) {
            log.error("Error fetching trending books from Redis", e);
            return Collections.emptyList();
        }
    }

    /**
     * Rebuild the autocomplete index from MongoDB.
     */
    public void rebuildAutocompleteIndex() {
        try {
            redisTemplate.delete(AC_KEY);
            List<BookSearch> books = bookSearchRepository.findAll();
            for (BookSearch book : books) {
                // Store as normalized_title:id
                String value = book.getTitle().toLowerCase() + ":" + book.getId();
                redisTemplate.opsForZSet().add(AC_KEY, value, 0);
            }
            log.info("Successfully rebuilt autocomplete index with {} books", books.size());
        } catch (Exception e) {
            log.error("Error rebuilding autocomplete index in Redis", e);
        }
    }
}
