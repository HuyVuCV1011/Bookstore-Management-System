package com.bookstore.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Immutable
@Table(name = "mv_catalog_statistics")
@Data
public class CatalogStatistics {

    @Id
    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "category_name")
    private String categoryName;

    @Column(name = "total_books")
    private Long totalBooks;

    @Column(name = "total_authors")
    private Long totalAuthors;

    @Column(name = "total_publishers")
    private Long totalPublishers;

    @Column(name = "total_stock")
    private Long totalStock;

    @Column(name = "average_price")
    private BigDecimal averagePrice;

    @Column(name = "min_price")
    private BigDecimal minPrice;

    @Column(name = "max_price")
    private BigDecimal maxPrice;

    @Column(name = "active_books")
    private Long activeBooks;

    @Column(name = "out_of_stock_books")
    private Long outOfStockBooks;

    @Column(name = "discontinued_books")
    private Long discontinuedBooks;

    @Column(name = "last_refresh_time")
    private LocalDateTime lastRefreshTime;
}
