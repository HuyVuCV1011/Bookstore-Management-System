-- Cleanup synthetic Postgres catalog seed.
-- This removes books with ISBN prefix 979910... and unused NFR authors/categories/publishers.

DELETE FROM books
WHERE isbn LIKE '979910%';

DELETE FROM authors a
WHERE a.name LIKE 'NFR Author %'
  AND NOT EXISTS (
      SELECT 1 FROM books b WHERE b.author_id = a.id
  );

DELETE FROM publishers p
WHERE p.name LIKE 'NFR Publisher %'
  AND NOT EXISTS (
      SELECT 1 FROM books b WHERE b.publisher_id = p.id
  );

DELETE FROM categories c
WHERE c.name LIKE 'NFR Category %'
  AND NOT EXISTS (
      SELECT 1 FROM books b WHERE b.category_id = c.id
  );
