package com.bookstore.event;

public record BookGraphProjectionEvent(
        Integer bookId,
        String isbn,
        BookGraphProjectionAction action
) {}
