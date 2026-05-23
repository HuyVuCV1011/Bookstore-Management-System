package com.bookstore.handler;

import com.bookstore.event.AuthorChangedEvent;
import com.bookstore.event.BookChangedEvent;
import com.bookstore.event.CategoryChangedEvent;
import com.bookstore.event.InventoryChangedEvent;
import com.bookstore.event.PublisherChangedEvent;
import com.bookstore.service.BookDetailSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookDetailEventHandler {

    private final BookDetailSyncService syncService;

    public void handleBookChanged(BookChangedEvent event) {
        log.debug("[CDC] Received BookChangedEvent: id={}, type={}",
                  event.getEntityId(), event.getChangeType());

        try {
            syncService.syncBook(event.getEntityId(), event.getChangeType());
        } catch (Exception e) {
            log.error("[CDC] Failed to sync book {}: {}", event.getEntityId(), e.getMessage(), e);
        }
    }

    public void handleAuthorChanged(AuthorChangedEvent event) {
        log.debug("[CDC] Received AuthorChangedEvent: id={}, type={}",
                  event.getEntityId(), event.getChangeType());

        try {
            syncService.syncBooksByAuthor(event.getEntityId(), event.getChangeType());
        } catch (Exception e) {
            log.error("[CDC] Failed to sync books for author {}: {}",
                      event.getEntityId(), e.getMessage(), e);
        }
    }

    public void handleCategoryChanged(CategoryChangedEvent event) {
        log.debug("[CDC] Received CategoryChangedEvent: id={}, type={}",
                  event.getEntityId(), event.getChangeType());

        try {
            syncService.syncBooksByCategory(event.getEntityId(), event.getChangeType());
        } catch (Exception e) {
            log.error("[CDC] Failed to sync books for category {}: {}",
                      event.getEntityId(), e.getMessage(), e);
        }
    }

    public void handlePublisherChanged(PublisherChangedEvent event) {
        log.debug("[CDC] Received PublisherChangedEvent: id={}, type={}",
                  event.getEntityId(), event.getChangeType());

        try {
            syncService.syncBooksByPublisher(event.getEntityId(), event.getChangeType());
        } catch (Exception e) {
            log.error("[CDC] Failed to sync books for publisher {}: {}",
                      event.getEntityId(), e.getMessage(), e);
        }
    }

    public void handleInventoryChanged(InventoryChangedEvent event) {
        log.debug("[CDC] Received InventoryChangedEvent: bookId={}, newQuantity={}",
                  event.getBookId(), event.getNewQuantity());

        try {
            syncService.updateStockQuantity(event.getBookId(), event.getNewQuantity());
        } catch (Exception e) {
            log.error("[CDC] Failed to update stock for book {}: {}",
                      event.getBookId(), e.getMessage(), e);
        }
    }
}
