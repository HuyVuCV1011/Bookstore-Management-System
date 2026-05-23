package com.bookstore.event;

import lombok.NoArgsConstructor;

@NoArgsConstructor(force = true, access = lombok.AccessLevel.PRIVATE)
public class PublisherChangedEvent extends EntityChangedEvent {

    public PublisherChangedEvent(Integer publisherId, ChangeType changeType) {
        super(publisherId, changeType);
    }
}
