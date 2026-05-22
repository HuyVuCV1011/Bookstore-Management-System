package com.bookstore.repository;

import com.bookstore.entity.InventoryTransaction;
import com.bookstore.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    @Query("SELECT it FROM InventoryTransaction it WHERE it.book.id = :bookId ORDER BY it.transactionDate DESC")
    Page<InventoryTransaction> findByBookId(Integer bookId, Pageable pageable);

    @Query("SELECT it FROM InventoryTransaction it WHERE " +
           "it.transactionDate >= :startDate AND it.transactionDate <= :endDate " +
           "ORDER BY it.transactionDate DESC")
    Page<InventoryTransaction> findByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    @Query("SELECT it FROM InventoryTransaction it WHERE " +
           "it.transactionType = :transactionType " +
           "ORDER BY it.transactionDate DESC")
    Page<InventoryTransaction> findByTransactionType(TransactionType transactionType, Pageable pageable);

    @Query("SELECT COUNT(it) FROM InventoryTransaction it WHERE " +
           "it.transactionDate BETWEEN :startDate AND :endDate")
    Long countByTransactionDateBetween(LocalDateTime startDate, LocalDateTime endDate);
}
