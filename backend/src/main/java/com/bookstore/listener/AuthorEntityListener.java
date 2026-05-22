package com.bookstore.listener;

import com.bookstore.entity.Author;
import com.bookstore.event.AuthorChangedEvent;
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
public class AuthorEntityListener {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @PostPersist
    public void onPostPersist(Author author) {
        log.debug("[CDC] Author created: id={}", author.getId());
        // No need to sync on insert - books will sync themselves
    }

    @PostUpdate
    public void onPostUpdate(Author author) {
        log.debug("[CDC] Author updated: id={}", author.getId());
        publishEvent(author, ChangeType.UPDATE);
    }

    @PostRemove
    public void onPostRemove(Author author) {
        log.debug("[CDC] Author deleted: id={}", author.getId());
        publishEvent(author, ChangeType.DELETE);
    }

    private void publishEvent(Author author, ChangeType changeType) {
        AuthorChangedEvent event = new AuthorChangedEvent(author.getId(), changeType);
        eventPublisher.publishEvent(event);
    }
}
