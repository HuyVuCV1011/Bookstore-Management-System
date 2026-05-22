package com.bookstore.repository;

import com.bookstore.entity.PurchaseOrder;
import com.bookstore.entity.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Integer> {

    @Query("SELECT po FROM PurchaseOrder po WHERE po.id = :id AND po.deletedAt IS NULL")
    Optional<PurchaseOrder> findById(@Param("id") Integer id);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.poNumber = :poNumber AND po.deletedAt IS NULL")
    Optional<PurchaseOrder> findByPoNumber(@Param("poNumber") String poNumber);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.deletedAt IS NULL")
    Page<PurchaseOrder> findAll(Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.status = :status AND po.deletedAt IS NULL")
    Page<PurchaseOrder> findByStatus(@Param("status") PurchaseOrderStatus status, Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.supplier.id = :supplierId AND po.deletedAt IS NULL")
    Page<PurchaseOrder> findBySupplierId(@Param("supplierId") Integer supplierId, Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "(LOWER(po.poNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(po.supplier.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "po.deletedAt IS NULL")
    Page<PurchaseOrder> findByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
