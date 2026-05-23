package com.bookstore.service;

import com.bookstore.dto.response.BookResponse;
import com.bookstore.entity.mongodb.BookDetail;
import com.bookstore.mapper.BookDetailMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogQueryService {

    private final BookService bookService;
    private final BookSearchService bookSearchService;
    private final BookDetailMapper bookDetailMapper;
    private final InteractionEventService interactionEventService;

    @Value("${bookstore.cdc.use-mongo-for-reads:true}")
    private boolean useMongoForReads;

    public BookResponse getBookById(Integer id, UUID userId) {
        // Track view event
        try {
            if (userId != null) {
                interactionEventService.trackView(userId, id);
            }
        } catch (Exception e) {
            log.warn("Failed to track view event for bookId: {}, userId: {}", id, userId, e);
        }

        if (useMongoForReads) {
            Optional<BookDetail> bookDetail = bookSearchService.getBookDetailById(id);
            if (bookDetail.isPresent()) {
                return bookDetailMapper.toBookResponse(bookDetail.get());
            }
        }
        // Fallback to PostgreSQL
        return bookService.getById(id);
    }

    public Page<BookResponse> getAllBooks(Integer page, Integer size, String keyword, UUID userId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<BookResponse> result;

        if (useMongoForReads) {
            Page<BookDetail> bookDetails = (keyword != null && !keyword.isBlank()) ?
                    bookSearchService.searchBooks(keyword, pageable) :
                    bookSearchService.getAllBooks(pageable);

            result = bookDetails.map(bookDetailMapper::toBookResponse);

            // Track search event if keyword is provided
            if (keyword != null && !keyword.isBlank()) {
                try {
                    if (userId != null) {
                        interactionEventService.trackSearch(userId, keyword, (int) bookDetails.getTotalElements());
                    }
                } catch (Exception e) {
                    log.warn("Failed to track search event for keyword: {}, userId: {}", keyword, userId, e);
                }
            }
        } else {
            // Fallback to PostgreSQL
            Page<BookResponse> pgResult = bookService.getAll(pageable, keyword);
            result = pgResult;

            // Track search event if keyword is provided
            if (keyword != null && !keyword.isBlank()) {
                try {
                    if (userId != null) {
                        interactionEventService.trackSearch(userId, keyword, (int) pgResult.getTotalElements());
                    }
                } catch (Exception e) {
                    log.warn("Failed to track search event for keyword: {}, userId: {}", keyword, userId, e);
                }
            }
        }

        return result;
    }
}
