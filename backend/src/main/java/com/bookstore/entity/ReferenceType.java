package com.bookstore.entity;

public enum ReferenceType {
    PURCHASE_ORDER,  // References purchase_orders table
    ORDER,           // References orders table
    MANUAL           // Manual adjustment, no reference
}
