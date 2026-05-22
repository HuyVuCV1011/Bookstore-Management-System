package com.bookstore.service;

import com.bookstore.entity.mongodb.BookDetail;
import com.bookstore.repository.mongodb.BookDetailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookSearchService {

    private final BookDetailRepository bookDetailRepository;

    public Optional<BookDetail> getBookDetailById(Integer id) {
        log.debug("Fetching book detail {} from MongoDB", id);
        return bookDetailRepository.findById(id);
    }

    public Page<BookDetail> searchBooks(String keyword, Pageable pageable) {
        log.debug("Searching books with keyword: {}", keyword);
        if (keyword == null || keyword.isBlank()) {
            return bookDetailRepository.findAll(pageable);
        }
        return bookDetailRepository.searchByText(keyword, pageable);
    }

    public Page<BookDetail> getBooksByCategory(Integer categoryId, Pageable pageable) {
        log.debug("Fetching books by category: {}", categoryId);
        return bookDetailRepository.findByCategoryId(categoryId, pageable);
    }

    public Page<BookDetail> getBooksByAuthor(Integer authorId, Pageable pageable) {
        log.debug("Fetching books by author: {}", authorId);
        return bookDetailRepository.findByAuthorId(authorId, pageable);
    }

    public Page<BookDetail> getBooksByPublisher(Integer publisherId, Pageable pageable) {
        log.debug("Fetching books by publisher: {}", publisherId);
        return bookDetailRepository.findByPublisherId(publisherId, pageable);
    }

    public Page<BookDetail> getBooksByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        log.debug("Fetching books in price range: {} - {}", minPrice, maxPrice);
        return bookDetailRepository.findByPriceBetween(minPrice, maxPrice, pageable);
    }

    public Page<BookDetail> getBooksByStatus(String status, Pageable pageable) {
        log.debug("Fetching books with status: {}", status);
        return bookDetailRepository.findByBusinessStatus(status, pageable);
    }

    public Page<BookDetail> getAllBooks(Pageable pageable) {
        log.debug("Fetching all books");
        return bookDetailRepository.findAll(pageable);
    }
}
