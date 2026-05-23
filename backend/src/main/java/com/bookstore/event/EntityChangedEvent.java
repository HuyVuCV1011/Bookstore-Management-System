package com.bookstore.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@NoArgsConstructor(force = true, access = lombok.AccessLevel.PROTECTED)
public abstract class EntityChangedEvent {
    private final Integer entityId;
    private final ChangeType changeType;
    private final LocalDateTime timestamp;

    protected EntityChangedEvent(Integer entityId, ChangeType changeType) {
        this.entityId = entityId;
        this.changeType = changeType;
        this.timestamp = LocalDateTime.now();
    }
}
