package com.bookstore.listener;

import com.bookstore.entity.Book;
import com.bookstore.event.BookChangedEvent;
import com.bookstore.event.ChangeType;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class BookEntityListener {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @PostPersist
    public void onPostPersist(Book book) {
        log.debug("[CDC] Book created: id={}", book.getId());
        publishEvent(book, ChangeType.INSERT);
    }

    @PostUpdate
    public void onPostUpdate(Book book) {
        log.debug("[CDC] Book updated: id={}", book.getId());
        publishEvent(book, ChangeType.UPDATE);
    }

    @PostRemove
    public void onPostRemove(Book book) {
        log.debug("[CDC] Book deleted: id={}", book.getId());
        publishEvent(book, ChangeType.DELETE);
    }

    private void publishEvent(Book book, ChangeType changeType) {
        BookChangedEvent event = new BookChangedEvent(book.getId(), changeType);
        eventPublisher.publishEvent(event);
    }
}
