package com.bookstore.controller;

import com.bookstore.dto.request.BookRequest;
import com.bookstore.dto.response.BookResponse;
import com.bookstore.dto.response.PageResponse;
import com.bookstore.entity.mongodb.BookDetail;
import com.bookstore.mapper.BookDetailMapper;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.BookSearchService;
import com.bookstore.service.BookService;
import com.bookstore.service.InteractionEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final BookSearchService bookSearchService;
    private final BookDetailMapper bookDetailMapper;
    private final InteractionEventService interactionEventService;

    @Value("${bookstore.cdc.use-mongo-for-reads:true}")
    private boolean useMongoForReads;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<BookResponse> create(@Valid @RequestBody BookRequest request) {
        BookResponse response = bookService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookResponse> getById(@PathVariable Integer id) {
        // Track view event
        try {
            UUID userId = getCurrentUserId();
            if (userId != null) {
                interactionEventService.trackView(userId, id);
            }
        } catch (Exception e) {
            // Don't fail the request if tracking fails
        }

        if (useMongoForReads) {
            Optional<BookDetail> bookDetail = bookSearchService.getBookDetailById(id);
            if (bookDetail.isPresent()) {
                BookResponse response = bookDetailMapper.toBookResponse(bookDetail.get());
                return ResponseEntity.ok(response);
            }
        }
        // Fallback to PostgreSQL
        BookResponse response = bookService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<BookResponse> getByIsbn(@PathVariable String isbn) {
        BookResponse response = bookService.getByIsbn(isbn);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<BookResponse>> getAll(
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword
    ) {
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
                    UUID userId = getCurrentUserId();
                    if (userId != null) {
                        interactionEventService.trackSearch(userId, keyword, (int) bookDetails.getTotalElements());
                    }
                } catch (Exception e) {
                    // Don't fail the request if tracking fails
                }
            }
        } else {
            // Fallback to PostgreSQL
            Page<BookResponse> pgResult = bookService.getAll(pageable, keyword);
            result = pgResult;

            // Track search event if keyword is provided
            if (keyword != null && !keyword.isBlank()) {
                try {
                    UUID userId = getCurrentUserId();
                    if (userId != null) {
                        interactionEventService.trackSearch(userId, keyword, (int) pgResult.getTotalElements());
                    }
                } catch (Exception e) {
                    // Don't fail the request if tracking fails
                }
            }
        }

        return ResponseEntity.ok(PageResponse.of(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<BookResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody BookRequest request
    ) {
        BookResponse response = bookService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        bookService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            return ((CustomUserDetails) auth.getPrincipal()).getUserId();
        }
        return null;
    }
}
