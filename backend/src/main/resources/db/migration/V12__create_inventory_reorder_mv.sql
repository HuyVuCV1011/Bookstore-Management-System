-- V12__create_inventory_reorder_mv.sql
-- Inventory reorder report materialized view (refresh every 6 hours)

CREATE MATERIALIZED VIEW mv_inventory_reorder_report AS
WITH sales_velocity AS (
    -- Note: order_items table does not have deleted_at column (no soft delete support)
    SELECT
        oi.book_id,
        COUNT(DISTINCT oi.order_id) AS orders_count,
        SUM(oi.quantity) AS total_sold_30d,
        ROUND(SUM(oi.quantity) / 30.0, 2) AS avg_daily_sales,
        MAX(o.created_at) AS last_sale_date
    FROM
        order_items oi
    INNER JOIN
        orders o ON oi.order_id = o.id
    WHERE
        o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')
        AND o.deleted_at IS NULL
        AND o.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY
        oi.book_id
)
SELECT
    b.id AS book_id,
    b.title,
    b.isbn,
    b.business_status,
    c.name AS category_name,
    a.name AS author_name,
    p.name AS publisher_name,
    b.stock_quantity AS current_stock,
    0::BIGINT AS pending_purchase_quantity,
    COALESCE(sv.total_sold_30d, 0) AS total_sold_last_30_days,
    COALESCE(sv.avg_daily_sales, 0) AS avg_daily_sales,
    COALESCE(sv.orders_count, 0) AS orders_count_30d,
    sv.last_sale_date,
    -- Reorder calculations
    CASE
        WHEN COALESCE(sv.avg_daily_sales, 0) = 0 THEN 999  -- No sales, low priority
        ELSE ROUND(b.stock_quantity / NULLIF(sv.avg_daily_sales, 0), 1)
    END AS days_of_stock_remaining,
    CASE
        WHEN COALESCE(sv.avg_daily_sales, 0) > 0
        THEN GREATEST(0, CEIL(sv.avg_daily_sales * 30) - b.stock_quantity)::INTEGER
        ELSE 0
    END AS recommended_reorder_quantity,
    CASE
        WHEN b.stock_quantity = 0 THEN 'URGENT'
        WHEN COALESCE(sv.avg_daily_sales, 0) = 0 THEN 'LOW_PRIORITY'
        WHEN b.stock_quantity / NULLIF(sv.avg_daily_sales, 0) <= 7 THEN 'URGENT'
        WHEN b.stock_quantity / NULLIF(sv.avg_daily_sales, 0) <= 14 THEN 'HIGH'
        WHEN b.stock_quantity / NULLIF(sv.avg_daily_sales, 0) <= 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS reorder_priority,
    NULL::TIMESTAMP AS last_purchase_date,
    NOW() AS last_refresh_time
FROM
    books b
INNER JOIN
    categories c ON b.category_id = c.id
INNER JOIN
    authors a ON b.author_id = a.id
INNER JOIN
    publishers p ON b.publisher_id = p.id
LEFT JOIN
    sales_velocity sv ON b.id = sv.book_id
WHERE
    b.deleted_at IS NULL
    AND c.deleted_at IS NULL
    AND a.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND b.business_status IN ('ACTIVE', 'OUT_OF_STOCK')  -- Exclude discontinued
ORDER BY
    CASE
        WHEN b.stock_quantity = 0 THEN 1
        WHEN COALESCE(sv.avg_daily_sales, 0) = 0 THEN 5
        WHEN b.stock_quantity / NULLIF(sv.avg_daily_sales, 0) <= 7 THEN 1
        WHEN b.stock_quantity / NULLIF(sv.avg_daily_sales, 0) <= 14 THEN 2
        WHEN b.stock_quantity / NULLIF(sv.avg_daily_sales, 0) <= 30 THEN 3
        ELSE 4
    END,
    CASE
        WHEN COALESCE(sv.avg_daily_sales, 0) = 0 THEN 999
        ELSE ROUND(b.stock_quantity / NULLIF(sv.avg_daily_sales, 0), 1)
    END ASC;

-- Create indexes
CREATE INDEX idx_mv_inventory_reorder_book_id ON mv_inventory_reorder_report(book_id);
CREATE INDEX idx_mv_inventory_reorder_priority ON mv_inventory_reorder_report(reorder_priority);
CREATE INDEX idx_mv_inventory_reorder_stock_days ON mv_inventory_reorder_report(days_of_stock_remaining);
CREATE INDEX idx_mv_inventory_reorder_last_refresh ON mv_inventory_reorder_report(last_refresh_time);

-- Grant permissions
GRANT SELECT ON mv_inventory_reorder_report TO bookstore_user;
