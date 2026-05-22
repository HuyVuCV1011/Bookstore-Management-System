package com.bookstore.event;

public class BookChangedEvent extends EntityChangedEvent {

    public BookChangedEvent(Integer bookId, ChangeType changeType) {
        super(bookId, changeType);
    }
}
