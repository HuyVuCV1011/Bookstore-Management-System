package com.bookstore.event;

public record BookGraphMetadataProjectionEvent(
        BookGraphMetadataProjectionType type,
        Integer id
) {}
