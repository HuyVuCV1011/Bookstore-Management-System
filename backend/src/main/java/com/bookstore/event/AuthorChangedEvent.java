package com.bookstore.event;

public class AuthorChangedEvent extends EntityChangedEvent {

    public AuthorChangedEvent(Integer authorId, ChangeType changeType) {
        super(authorId, changeType);
    }
}
