UPDATE books
SET
    cover_url = 'https://static.oreka.vn/800-800_ecfeacf7-9a96-4052-9b65-65ee4199edbc.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL
  AND isbn = '9786043046410';
