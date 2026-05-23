package com.bookstore.event;

import lombok.NoArgsConstructor;

@NoArgsConstructor(force = true, access = lombok.AccessLevel.PRIVATE)
public class BookChangedEvent extends EntityChangedEvent {

    public BookChangedEvent(Integer bookId, ChangeType changeType) {
        super(bookId, changeType);
    }
}
