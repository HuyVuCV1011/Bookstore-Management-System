package com.bookstore.service;

import com.bookstore.dto.response.AdminBookOverview;
import com.bookstore.entity.Book;
import com.bookstore.graph.repository.BookGraphRepository;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.mongodb.BookDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCatalogOverviewService {

    private final BookRepository bookRepository;
    private final BookDetailRepository bookDetailRepository;
    private final BookGraphRepository bookGraphRepository;

    public Page<AdminBookOverview> getCatalogOverview(Pageable pageable, String keyword) {
        Page<Book> booksPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            booksPage = bookRepository.findByKeyword(keyword.trim(), pageable);
        } else {
            booksPage = bookRepository.findAll(pageable);
        }

        List<Book> books = booksPage.getContent();
        if (books.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, booksPage.getTotalElements());
        }

        List<Integer> bookIds = books.stream().map(Book::getId).collect(Collectors.toList());
        List<String> isbns = books.stream()
                .map(Book::getIsbn)
                .filter(Objects::nonNull)
                .filter(isbn -> !isbn.isBlank())
                .collect(Collectors.toList());

        // Batch find in Mongo
        Set<Integer> mongoBookIds = bookDetailRepository.findAllById(bookIds).stream()
                .map(detail -> detail.getId())
                .collect(Collectors.toSet());

        // Batch find in Neo4j
        Set<String> neo4jIsbns = new HashSet<>();
        if (!isbns.isEmpty()) {
            try {
                neo4jIsbns.addAll(bookGraphRepository.findExistingIsbns(isbns));
            } catch (Exception e) {
                // Fallback / ignore Neo4j error
            }
        }

        List<AdminBookOverview> overviewList = books.stream().map(book -> {
            boolean mongoSynced = mongoBookIds.contains(book.getId());
            boolean neo4jSynced = book.getIsbn() != null && neo4jIsbns.contains(book.getIsbn());

            return AdminBookOverview.builder()
                    .id(book.getId())
                    .title(book.getTitle())
                    .isbn(book.getIsbn())
                    .price(book.getPrice())
                    .stockQuantity(book.getStockQuantity())
                    .isActive(book.getDeletedAt() == null && book.getBusinessStatus() == com.bookstore.entity.BusinessStatus.ACTIVE)
                    .authorName(book.getAuthor() != null ? book.getAuthor().getName() : null)
                    .publisherName(book.getPublisher() != null ? book.getPublisher().getName() : null)
                    .categoryName(book.getCategory() != null ? book.getCategory().getName() : null)
                    .mongoSynced(mongoSynced)
                    .neo4jSynced(neo4jSynced)
                    .build();
        }).collect(Collectors.toList());

        return new PageImpl<>(overviewList, pageable, booksPage.getTotalElements());
    }
}
