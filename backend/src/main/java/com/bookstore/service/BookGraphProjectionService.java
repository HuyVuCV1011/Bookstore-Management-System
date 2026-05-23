package com.bookstore.service;

import com.bookstore.entity.Book;
import com.bookstore.entity.BusinessStatus;
import com.bookstore.event.BookGraphMetadataProjectionEvent;
import com.bookstore.event.BookGraphProjectionAction;
import com.bookstore.event.BookGraphProjectionEvent;
import com.bookstore.exception.ResourceNotFoundException;
import com.bookstore.graph.dto.request.SyncBookRequest;
import com.bookstore.graph.service.GraphInteractionService;
import com.bookstore.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class BookGraphProjectionService {

    private final BookRepository bookRepository;
    private final GraphInteractionService graphInteractionService;

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public void handleBookProjectionEvent(BookGraphProjectionEvent event) {
        try {
            if (event.action() == BookGraphProjectionAction.DEACTIVATE) {
                graphInteractionService.deactivateBook(event.isbn());
                return;
            }

            bookRepository.findById(event.bookId())
                    .filter(this::hasIsbn)
                    .ifPresent(book -> graphInteractionService.syncBook(toSyncRequest(book)));
        } catch (Exception ex) {
            log.warn("Postgres book data remains valid, but Neo4j projection sync failed for event {}", event, ex);
        }
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public void handleBookMetadataProjectionEvent(BookGraphMetadataProjectionEvent event) {
        try {
            List<Book> relatedBooks = switch (event.type()) {
                case AUTHOR -> bookRepository.findAllActiveByAuthorId(event.id());
                case CATEGORY -> bookRepository.findAllActiveByCategoryId(event.id());
                case PUBLISHER -> bookRepository.findAllActiveByPublisherId(event.id());
            };
            syncBooks(relatedBooks);
        } catch (Exception ex) {
            log.warn("Postgres metadata remains valid, but Neo4j projection sync failed for metadata event {}", event, ex);
        }
    }

    @Order(Ordered.HIGHEST_PRECEDENCE)
    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void syncAllBooksOnStartup() {
        syncAllFromPostgres();
    }

    @Transactional(readOnly = true)
    public int syncAllFromPostgres() {
        var books = bookRepository.findAllActive();
        List<String> postgresIsbns = new ArrayList<>();
        int synced = syncBooks(books, postgresIsbns);

        long orphaned = graphInteractionService.deactivateBooksMissingFrom(postgresIsbns);
        log.info("Synced {} Postgres books to Neo4j graph projection; marked {} non-Postgres graph books as orphaned",
                synced, orphaned);
        return synced;
    }

    private int syncBooks(List<Book> books) {
        return syncBooks(books, new ArrayList<>());
    }

    private int syncBooks(List<Book> books, List<String> postgresIsbns) {
        int synced = 0;
        for (Book book : books) {
            if (!hasIsbn(book)) {
                continue;
            }
            postgresIsbns.add(book.getIsbn());
            try {
                graphInteractionService.syncBook(toSyncRequest(book));
                synced++;
            } catch (Exception ex) {
                log.warn("Failed to sync book {} from Postgres to Neo4j projection", book.getId(), ex);
            }
        }
        return synced;
    }

    @Transactional(readOnly = true)
    public void syncFromPostgresByIsbn(String isbn) {
        Book book = bookRepository.findActiveByIsbn(isbn)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found in PostgreSQL with ISBN: " + isbn));
        graphInteractionService.syncBook(toSyncRequest(book));
    }

    private SyncBookRequest toSyncRequest(Book book) {
        return new SyncBookRequest(
                book.getIsbn(),
                book.getTitle(),
                book.getDescription(),
                "vi",
                book.getPublicationYear(),
                book.getPrice() == null ? null : book.getPrice().doubleValue(),
                toGraphStatus(book.getBusinessStatus()),
                book.getCoverUrl(),
                "PG-AUTHOR-" + book.getAuthor().getId(),
                book.getAuthor().getName(),
                "PG-CATEGORY-" + book.getCategory().getId(),
                book.getCategory().getName(),
                "PG-PUBLISHER-" + book.getPublisher().getId(),
                book.getPublisher().getName()
        );
    }

    private boolean hasIsbn(Book book) {
        return book.getIsbn() != null && !book.getIsbn().isBlank();
    }

    private String toGraphStatus(BusinessStatus status) {
        if (status == BusinessStatus.ACTIVE) {
            return "active";
        }
        if (status == BusinessStatus.OUT_OF_STOCK) {
            return "out_of_stock";
        }
        return "discontinued";
    }
}
