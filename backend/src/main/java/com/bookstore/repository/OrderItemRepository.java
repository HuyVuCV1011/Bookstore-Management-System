package com.bookstore.repository;

import com.bookstore.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId")
    List<OrderItem> findByOrderId(@Param("orderId") Integer orderId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.book.id = :bookId")
    List<OrderItem> findByBookId(@Param("bookId") Integer bookId);
}
