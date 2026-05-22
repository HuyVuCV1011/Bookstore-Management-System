package com.bookstore.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Immutable
@Table(name = "mv_popular_books")
@Data
public class PopularBook {

    @Id
    @Column(name = "book_id")
    private Integer bookId;

    @Column(name = "title")
    private String title;

    @Column(name = "isbn")
    private String isbn;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @Column(name = "business_status")
    private String businessStatus;

    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "category_name")
    private String categoryName;

    @Column(name = "author_id")
    private Integer authorId;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "publisher_id")
    private Integer publisherId;

    @Column(name = "publisher_name")
    private String publisherName;

    @Column(name = "total_quantity_sold")
    private Long totalQuantitySold;

    @Column(name = "total_orders")
    private Long totalOrders;

    @Column(name = "total_revenue")
    private BigDecimal totalRevenue;

    @Column(name = "average_selling_price")
    private BigDecimal averageSellingPrice;

    @Column(name = "last_order_date")
    private LocalDateTime lastOrderDate;

    @Column(name = "last_refresh_time")
    private LocalDateTime lastRefreshTime;
}
