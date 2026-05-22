package com.bookstore.repository;

import com.bookstore.entity.CustomerOrder;
import com.bookstore.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface OrderRepository extends JpaRepository<CustomerOrder, UUID> {

    @EntityGraph(attributePaths = {
            "user",
            "items",
            "items.book",
            "items.book.author",
            "items.book.category",
            "items.book.publisher"
    })
    @Query("""
            SELECT DISTINCT o
            FROM CustomerOrder o
            WHERE o.deletedAt IS NULL
              AND (:userId IS NULL OR o.user.id = :userId)
              AND (:status IS NULL OR o.status = :status)
              AND (
                    :keyword IS NULL
                 OR :keyword = ''
                 OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR EXISTS (
                      SELECT i.id
                      FROM OrderItem i
                      WHERE i.order = o
                        AND (
                              LOWER(i.titleSnapshot) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR LOWER(i.isbnSnapshot) LIKE LOWER(CONCAT('%', :keyword, '%'))
                        )
                 )
              )
            """)
    Page<CustomerOrder> searchOrders(
            @Param("userId") UUID userId,
            @Param("status") OrderStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"user", "items"})
    @Query("""
            SELECT DISTINCT o
            FROM CustomerOrder o
            WHERE o.deletedAt IS NULL
              AND (:userId IS NULL OR o.user.id = :userId)
            """)
    List<CustomerOrder> findForStats(@Param("userId") UUID userId);

    @EntityGraph(attributePaths = {
            "user",
            "items",
            "items.book",
            "items.book.author",
            "items.book.category",
            "items.book.publisher"
    })
    @Query("SELECT DISTINCT o FROM CustomerOrder o WHERE o.id = :id AND o.deletedAt IS NULL")
    Optional<CustomerOrder> findDetailedById(@Param("id") UUID id);

    @EntityGraph(attributePaths = {
            "user",
            "items",
            "items.book",
            "items.book.author",
            "items.book.category",
            "items.book.publisher"
    })
    @Query("""
            SELECT DISTINCT o
            FROM CustomerOrder o
            WHERE o.deletedAt IS NULL
              AND o.status IN :statuses
            """)
    List<CustomerOrder> findGraphSyncableOrders(@Param("statuses") Collection<OrderStatus> statuses);

    @Query("""
            SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END
            FROM OrderItem i
            WHERE i.order.deletedAt IS NULL
              AND i.order.user.id = :userId
              AND i.order.status = :status
              AND LOWER(i.isbnSnapshot) = LOWER(:isbn)
            """)
    boolean existsCompletedPurchaseByUserIdAndIsbn(
            @Param("userId") UUID userId,
            @Param("isbn") String isbn,
            @Param("status") OrderStatus status
    );

    @Query(value = """
            SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN customers c ON c.user_id = o.user_id
            WHERE c.id = :customerId
              AND oi.book_id = :bookId
              AND o.status = 'COMPLETED'
            """, nativeQuery = true)
    boolean hasPurchasedBook(@Param("customerId") Integer customerId, @Param("bookId") Integer bookId);

    @Query("SELECT COUNT(o) FROM CustomerOrder o WHERE o.deletedAt IS NULL AND o.status IN :statuses")
    Long countByStatusIn(@Param("statuses") Collection<OrderStatus> statuses);

    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM CustomerOrder o
            WHERE o.deletedAt IS NULL
              AND o.status = 'COMPLETED'
              AND o.orderedAt BETWEEN :start AND :end
            """)
    BigDecimal calculateTodayRevenue(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
