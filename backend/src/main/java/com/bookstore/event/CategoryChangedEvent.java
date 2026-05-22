package com.bookstore.event;

public class CategoryChangedEvent extends EntityChangedEvent {

    public CategoryChangedEvent(Integer categoryId, ChangeType changeType) {
        super(categoryId, changeType);
    }
}
