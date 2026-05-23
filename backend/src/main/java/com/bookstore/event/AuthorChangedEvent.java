package com.bookstore.event;

import lombok.NoArgsConstructor;

@NoArgsConstructor(force = true, access = lombok.AccessLevel.PRIVATE)
public class AuthorChangedEvent extends EntityChangedEvent {

    public AuthorChangedEvent(Integer authorId, ChangeType changeType) {
        super(authorId, changeType);
    }
}
