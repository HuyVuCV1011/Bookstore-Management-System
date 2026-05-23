package com.bookstore.entity;

public enum PaymentStatus {
    UNPAID,    // No payments received
    PENDING,   // Payment is pending gateway/callback confirmation
    PARTIAL,   // Partially paid
    PAID,      // Fully paid
    REFUNDED   // Refunded
}
