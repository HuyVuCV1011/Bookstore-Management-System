package com.bookstore.controller;

import com.bookstore.entity.mongodb.BookSearch;
import com.bookstore.repository.mongodb.BookSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class BookSearchController {
    private static final String ACTIVE_STATUS = "ACTIVE";

    private final BookSearchRepository bookSearchRepository;
    private final com.bookstore.service.SearchAutocompleteService autocompleteService;

    @GetMapping
    public ResponseEntity<Page<BookSearch>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        
        if (q != null && !q.isEmpty()) {
            autocompleteService.recordSearchKeyword(q);
            return ResponseEntity.ok(bookSearchRepository.searchByText(q, pageable));
        }
        
        if (category != null && !category.isEmpty()) {
            return ResponseEntity.ok(bookSearchRepository.findByCategoryNameAndBusinessStatus(category, ACTIVE_STATUS, pageable));
        }

        if (minPrice != null && maxPrice != null) {
            return ResponseEntity.ok(bookSearchRepository.findByPriceBetweenAndBusinessStatus(minPrice, maxPrice, ACTIVE_STATUS, pageable));
        }

        return ResponseEntity.ok(bookSearchRepository.findByBusinessStatus(ACTIVE_STATUS, pageable));
    }
}
