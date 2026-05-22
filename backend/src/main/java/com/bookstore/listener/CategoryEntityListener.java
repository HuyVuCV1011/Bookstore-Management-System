package com.bookstore.listener;

import com.bookstore.entity.Category;
import com.bookstore.event.CategoryChangedEvent;
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
public class CategoryEntityListener {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @PostPersist
    public void onPostPersist(Category category) {
        log.debug("[CDC] Category created: id={}", category.getId());
        // No need to sync on insert - books will sync themselves
    }

    @PostUpdate
    public void onPostUpdate(Category category) {
        log.debug("[CDC] Category updated: id={}", category.getId());
        publishEvent(category, ChangeType.UPDATE);
    }

    @PostRemove
    public void onPostRemove(Category category) {
        log.debug("[CDC] Category deleted: id={}", category.getId());
        publishEvent(category, ChangeType.DELETE);
    }

    private void publishEvent(Category category, ChangeType changeType) {
        CategoryChangedEvent event = new CategoryChangedEvent(category.getId(), changeType);
        eventPublisher.publishEvent(event);
    }
}
