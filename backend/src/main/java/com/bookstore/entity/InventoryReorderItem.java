package com.bookstore.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Immutable
@Table(name = "mv_inventory_reorder_report")
@Data
public class InventoryReorderItem {

    @Id
    @Column(name = "book_id")
    private Integer bookId;

    @Column(name = "title")
    private String title;

    @Column(name = "isbn")
    private String isbn;

    @Column(name = "business_status")
    private String businessStatus;

    @Column(name = "category_name")
    private String categoryName;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "publisher_name")
    private String publisherName;

    @Column(name = "current_stock")
    private Integer currentStock;

    @Column(name = "pending_purchase_quantity")
    private Long pendingPurchaseQuantity;

    @Column(name = "total_sold_last_30_days")
    private Long totalSoldLast30Days;

    @Column(name = "avg_daily_sales")
    private BigDecimal avgDailySales;

    @Column(name = "orders_count_30d")
    private Long ordersCount30d;

    @Column(name = "last_sale_date")
    private LocalDateTime lastSaleDate;

    @Column(name = "days_of_stock_remaining")
    private BigDecimal daysOfStockRemaining;

    @Column(name = "recommended_reorder_quantity")
    private Integer recommendedReorderQuantity;

    @Column(name = "reorder_priority")
    private String reorderPriority;

    @Column(name = "last_purchase_date")
    private LocalDateTime lastPurchaseDate;

    @Column(name = "last_refresh_time")
    private LocalDateTime lastRefreshTime;
}
