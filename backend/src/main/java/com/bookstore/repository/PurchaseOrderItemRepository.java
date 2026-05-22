package com.bookstore.repository;

import com.bookstore.entity.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Integer> {

    @Query("SELECT poi FROM PurchaseOrderItem poi WHERE poi.purchaseOrder.id = :purchaseOrderId")
    List<PurchaseOrderItem> findByPurchaseOrderId(@Param("purchaseOrderId") Integer purchaseOrderId);
}
