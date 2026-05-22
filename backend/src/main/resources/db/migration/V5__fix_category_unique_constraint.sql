-- Remove unique constraint on categories.name to allow soft-deleted duplicates
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Add partial unique index that only applies to non-deleted records
CREATE UNIQUE INDEX idx_categories_name_unique ON categories(name) WHERE deleted_at IS NULL;
