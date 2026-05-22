package com.bookstore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_transactions")
@EntityListeners(com.bookstore.listener.InventoryTransactionListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private TransactionType transactionType;

    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", length = 50)
    private ReferenceType referenceType;

    @Column(name = "reference_id")
    private Integer referenceId;

    @Column(name = "old_quantity", nullable = false)
    private Integer oldQuantity;

    @Column(name = "new_quantity", nullable = false)
    private Integer newQuantity;

    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "transaction_date", nullable = false)
    @Builder.Default
    private LocalDateTime transactionDate = LocalDateTime.now();
}
