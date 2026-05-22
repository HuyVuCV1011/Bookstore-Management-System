package com.bookstore.service;

import com.bookstore.entity.Book;
import com.bookstore.entity.mongodb.BookDetail;
import com.bookstore.event.ChangeType;
import com.bookstore.mapper.BookDetailMapper;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.mongodb.BookDetailRepository;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookDetailSyncService {

    private final BookRepository bookRepository;
    private final BookDetailRepository bookDetailRepository;
    private final BookDetailMapper mapper;
    private final MongoTemplate mongoTemplate;

    @Transactional(readOnly = true)
    public void syncBook(Integer bookId, ChangeType changeType) {
        log.info("[CDC] Syncing book {} with change type {}", bookId, changeType);

        if (changeType == ChangeType.DELETE) {
            deleteBookDetail(bookId);
            return;
        }

        Optional<Book> bookOpt = bookRepository.findByIdWithRelations(bookId);
        if (bookOpt.isEmpty()) {
            log.warn("[CDC] Book {} not found in PostgreSQL, skipping sync", bookId);
            return;
        }

        Book book = bookOpt.get();
        BookDetail bookDetail = mapper.toBookDetail(book);
        bookDetailRepository.save(bookDetail);

        log.info("[CDC] Successfully synced book {} to MongoDB", bookId);
    }

    private void deleteBookDetail(Integer bookId) {
        log.info("[CDC] Deleting book detail {} from MongoDB", bookId);
        bookDetailRepository.deleteById(bookId);
    }

    @Transactional(readOnly = true)
    public void syncBooksByAuthor(Integer authorId, ChangeType changeType) {
        log.info("[CDC] Syncing books for author {} with change type {}", authorId, changeType);

        if (changeType == ChangeType.DELETE) {
            log.warn("[CDC] Author {} deleted, books will keep stale author info", authorId);
            return;
        }

        List<Book> books = bookRepository.findAllByAuthorIdWithRelations(authorId);
        batchSyncBooks(books, "author", authorId);
    }

    @Transactional(readOnly = true)
    public void syncBooksByCategory(Integer categoryId, ChangeType changeType) {
        log.info("[CDC] Syncing books for category {} with change type {}", categoryId, changeType);

        if (changeType == ChangeType.DELETE) {
            log.warn("[CDC] Category {} deleted, books will keep stale category info", categoryId);
            return;
        }

        List<Book> books = bookRepository.findAllByCategoryIdWithRelations(categoryId);
        batchSyncBooks(books, "category", categoryId);
    }

    @Transactional(readOnly = true)
    public void syncBooksByPublisher(Integer publisherId, ChangeType changeType) {
        log.info("[CDC] Syncing books for publisher {} with change type {}", publisherId, changeType);

        if (changeType == ChangeType.DELETE) {
            log.warn("[CDC] Publisher {} deleted, books will keep stale publisher info", publisherId);
            return;
        }

        List<Book> books = bookRepository.findAllByPublisherIdWithRelations(publisherId);
        batchSyncBooks(books, "publisher", publisherId);
    }

    private void batchSyncBooks(List<Book> books, String relationshipType, Integer relationshipId) {
        if (books.isEmpty()) {
            log.info("[CDC] No books found for {} {}", relationshipType, relationshipId);
            return;
        }

        log.info("[CDC] Batch syncing {} books for {} {}", books.size(), relationshipType, relationshipId);

        List<BookDetail> bookDetails = books.stream()
                .map(mapper::toBookDetail)
                .toList();

        bookDetailRepository.saveAll(bookDetails);

        log.info("[CDC] Successfully batch synced {} books", books.size());
    }

    public void updateStockQuantity(Integer bookId, Integer newQuantity) {
        log.info("[CDC] Updating stock quantity for book {} to {}", bookId, newQuantity);

        try {
            Query query = new Query(Criteria.where("_id").is(bookId));
            Update update = new Update()
                    .set("stockQuantity", newQuantity)
                    .set("lastSyncedAt", LocalDateTime.now());

            UpdateResult result = mongoTemplate.updateFirst(query, update, BookDetail.class);

            if (result.getModifiedCount() > 0) {
                log.info("[CDC] Successfully updated stock quantity for book {}", bookId);
            } else {
                log.warn("[CDC] Book {} not found in MongoDB, stock not updated", bookId);
            }
        } catch (Exception e) {
            log.error("[CDC] Failed to update stock quantity for book {}: {}", bookId, e.getMessage(), e);
            throw e;
        }
    }
}
