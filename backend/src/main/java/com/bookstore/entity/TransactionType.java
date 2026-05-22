package com.bookstore.entity;

public enum TransactionType {
    PURCHASE_IN,    // Stock added from purchase order
    SALE_OUT,       // Stock sold via customer order
    ADJUSTMENT      // Manual stock adjustment
}
