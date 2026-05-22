package com.bookstore.service;

import com.bookstore.entity.Book;
import com.bookstore.entity.mongodb.BookSearch;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.mongodb.BookSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookSyncService {
    private final BookRepository bookRepository;
    private final BookSearchRepository bookSearchRepository;
    private final SearchAutocompleteService autocompleteService;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void syncBooksToMongo() {
        log.info("Starting initial sync of books from PostgreSQL to MongoDB...");
        List<Book> postgresBooks = bookRepository.findAll();
        
        List<BookSearch> mongoBooks = postgresBooks.stream()
                .map(this::convertToSearchModel)
                .collect(Collectors.toList());
        
        bookSearchRepository.saveAll(mongoBooks);
        log.info("Successfully synced {} books to MongoDB.", mongoBooks.size());

        // Rebuild autocomplete index in Redis
        autocompleteService.rebuildAutocompleteIndex();
    }

    private BookSearch convertToSearchModel(Book book) {
        return BookSearch.builder()
                .id(book.getId())
                .title(book.getTitle())
                .authorName(book.getAuthor().getName())
                .categoryName(book.getCategory().getName())
                .isbn(book.getIsbn())
                .price(book.getPrice())
                .publicationYear(book.getPublicationYear())
                .businessStatus(book.getBusinessStatus().name())
                .build();
    }
}
