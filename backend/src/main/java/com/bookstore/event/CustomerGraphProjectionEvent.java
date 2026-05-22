package com.bookstore.event;

import com.bookstore.entity.Role;

import java.util.UUID;

public record CustomerGraphProjectionEvent(
        UUID userId,
        String fullName,
        String email,
        Role role,
        Boolean active,
        CustomerGraphProjectionAction action
) {}
