-- V10__create_catalog_statistics_mv.sql
-- Catalog statistics materialized view (refresh every 30 minutes)

CREATE MATERIALIZED VIEW mv_catalog_statistics AS
SELECT
    c.id AS category_id,
    c.name AS category_name,
    COUNT(DISTINCT b.id) AS total_books,
    COUNT(DISTINCT b.author_id) AS total_authors,
    COUNT(DISTINCT b.publisher_id) AS total_publishers,
    SUM(b.stock_quantity) AS total_stock,
    ROUND(AVG(b.price), 2) AS average_price,
    MIN(b.price) AS min_price,
    MAX(b.price) AS max_price,
    COUNT(DISTINCT CASE WHEN b.business_status = 'ACTIVE' THEN b.id END) AS active_books,
    COUNT(DISTINCT CASE WHEN b.business_status = 'OUT_OF_STOCK' THEN b.id END) AS out_of_stock_books,
    COUNT(DISTINCT CASE WHEN b.business_status = 'DISCONTINUED' THEN b.id END) AS discontinued_books,
    NOW() AS last_refresh_time
FROM
    categories c
LEFT JOIN
    books b ON c.id = b.category_id AND b.deleted_at IS NULL
WHERE
    c.deleted_at IS NULL
GROUP BY
    c.id, c.name

UNION ALL

-- Overall statistics (category_id = NULL represents total across all categories)
SELECT
    NULL AS category_id,
    'ALL_CATEGORIES' AS category_name,
    COUNT(DISTINCT b.id) AS total_books,
    COUNT(DISTINCT b.author_id) AS total_authors,
    COUNT(DISTINCT b.publisher_id) AS total_publishers,
    SUM(b.stock_quantity) AS total_stock,
    ROUND(AVG(b.price), 2) AS average_price,
    MIN(b.price) AS min_price,
    MAX(b.price) AS max_price,
    COUNT(DISTINCT CASE WHEN b.business_status = 'ACTIVE' THEN b.id END) AS active_books,
    COUNT(DISTINCT CASE WHEN b.business_status = 'OUT_OF_STOCK' THEN b.id END) AS out_of_stock_books,
    COUNT(DISTINCT CASE WHEN b.business_status = 'DISCONTINUED' THEN b.id END) AS discontinued_books,
    NOW() AS last_refresh_time
FROM
    books b
WHERE
    b.deleted_at IS NULL;

-- Create indexes for better query performance
CREATE INDEX idx_mv_catalog_statistics_category_id ON mv_catalog_statistics(category_id);
CREATE INDEX idx_mv_catalog_statistics_last_refresh ON mv_catalog_statistics(last_refresh_time);

-- Grant permissions (adjust if needed)
GRANT SELECT ON mv_catalog_statistics TO bookstore_user;
