package com.bookstore.event;

import lombok.NoArgsConstructor;

@NoArgsConstructor(force = true, access = lombok.AccessLevel.PRIVATE)
public class CategoryChangedEvent extends EntityChangedEvent {

    public CategoryChangedEvent(Integer categoryId, ChangeType changeType) {
        super(categoryId, changeType);
    }
}
