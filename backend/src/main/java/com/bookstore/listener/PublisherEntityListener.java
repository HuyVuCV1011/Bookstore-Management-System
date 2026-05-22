package com.bookstore.listener;

import com.bookstore.entity.Publisher;
import com.bookstore.event.PublisherChangedEvent;
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
public class PublisherEntityListener {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @PostPersist
    public void onPostPersist(Publisher publisher) {
        log.debug("[CDC] Publisher created: id={}", publisher.getId());
        // No need to sync on insert - books will sync themselves
    }

    @PostUpdate
    public void onPostUpdate(Publisher publisher) {
        log.debug("[CDC] Publisher updated: id={}", publisher.getId());
        publishEvent(publisher, ChangeType.UPDATE);
    }

    @PostRemove
    public void onPostRemove(Publisher publisher) {
        log.debug("[CDC] Publisher deleted: id={}", publisher.getId());
        publishEvent(publisher, ChangeType.DELETE);
    }

    private void publishEvent(Publisher publisher, ChangeType changeType) {
        PublisherChangedEvent event = new PublisherChangedEvent(publisher.getId(), changeType);
        eventPublisher.publishEvent(event);
    }
}
