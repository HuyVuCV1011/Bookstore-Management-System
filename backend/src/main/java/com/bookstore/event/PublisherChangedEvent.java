package com.bookstore.event;

public class PublisherChangedEvent extends EntityChangedEvent {

    public PublisherChangedEvent(Integer publisherId, ChangeType changeType) {
        super(publisherId, changeType);
    }
}
