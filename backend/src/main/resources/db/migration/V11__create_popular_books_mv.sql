-- V11__create_popular_books_mv.sql
-- Popular books materialized view (refresh every hour)

CREATE MATERIALIZED VIEW mv_popular_books AS
SELECT
    b.id AS book_id,
    b.title,
    b.isbn,
    b.price,
    b.stock_quantity,
    b.business_status,
    c.id AS category_id,
    c.name AS category_name,
    a.id AS author_id,
    a.name AS author_name,
    p.id AS publisher_id,
    p.name AS publisher_name,
    COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
    COALESCE(COUNT(DISTINCT oi.order_id), 0) AS total_orders,
    COALESCE(SUM(oi.line_total - oi.discount), 0) AS total_revenue,
    ROUND(COALESCE(AVG(oi.unit_price), b.price), 2) AS average_selling_price,
    MAX(o.created_at) AS last_order_date,
    NOW() AS last_refresh_time
FROM
    books b
INNER JOIN
    categories c ON b.category_id = c.id
INNER JOIN
    authors a ON b.author_id = a.id
INNER JOIN
    publishers p ON b.publisher_id = p.id
-- Note: order_items table does not have deleted_at column (no soft delete support)
LEFT JOIN
    order_items oi ON b.id = oi.book_id
LEFT JOIN
    orders o ON oi.order_id = o.id
        AND o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')
        AND o.deleted_at IS NULL
        AND o.created_at >= NOW() - INTERVAL '90 days'  -- Last 90 days
WHERE
    b.deleted_at IS NULL
    AND c.deleted_at IS NULL
    AND a.deleted_at IS NULL
    AND p.deleted_at IS NULL
GROUP BY
    b.id, b.title, b.isbn, b.price, b.stock_quantity, b.business_status,
    c.id, c.name, a.id, a.name, p.id, p.name
ORDER BY
    total_quantity_sold DESC,
    total_revenue DESC
LIMIT 100;  -- Top 100 popular books

-- Create indexes
CREATE INDEX idx_mv_popular_books_book_id ON mv_popular_books(book_id);
CREATE INDEX idx_mv_popular_books_category_id ON mv_popular_books(category_id);
CREATE INDEX idx_mv_popular_books_total_sold ON mv_popular_books(total_quantity_sold DESC);
CREATE INDEX idx_mv_popular_books_last_refresh ON mv_popular_books(last_refresh_time);

-- Performance: composite index for orders filtering
CREATE INDEX idx_orders_status_created ON orders(status, created_at) WHERE deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON mv_popular_books TO bookstore_user;
