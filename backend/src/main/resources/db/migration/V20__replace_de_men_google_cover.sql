UPDATE books
SET
    cover_url = 'https://sachtiengviet.com/cdn/shop/files/c13b99422a3a86eb1508f23f4df4d994_1024x1024.png?v=1757659729',
    updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL
  AND isbn = '9786042125345';
