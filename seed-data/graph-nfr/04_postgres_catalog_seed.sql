-- Postgres catalog seed for GraphDB sync tests.
-- This creates synthetic catalog books with ISBN prefix 979910...
-- Run manually. This file is intentionally not a Flyway migration.

DO $$
DECLARE
    admin_user_id UUID;
    i INT;
    category_id INT;
    author_id INT;
    publisher_id INT;
    generated_isbn VARCHAR(13);
BEGIN
    SELECT id INTO admin_user_id
    FROM users
    WHERE email = 'admin@bookstore.com'
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'admin@bookstore.com not found. Run app migrations first.';
    END IF;

    FOR i IN 1..8 LOOP
        INSERT INTO categories (name, description, created_by, updated_by)
        VALUES (
            'NFR Category ' || i,
            'Synthetic category for GraphDB NFR sync tests',
            admin_user_id,
            admin_user_id
        )
        ON CONFLICT (name) DO UPDATE
        SET description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = admin_user_id;
    END LOOP;

    FOR i IN 1..20 LOOP
        IF NOT EXISTS (
            SELECT 1 FROM authors
            WHERE deleted_at IS NULL AND name = 'NFR Author ' || i
        ) THEN
            INSERT INTO authors (name, biography, created_by, updated_by)
            VALUES (
                'NFR Author ' || i,
                'Synthetic author for GraphDB NFR sync tests',
                admin_user_id,
                admin_user_id
            );
        END IF;
    END LOOP;

    FOR i IN 1..5 LOOP
        IF NOT EXISTS (
            SELECT 1 FROM publishers
            WHERE deleted_at IS NULL AND name = 'NFR Publisher ' || i
        ) THEN
            INSERT INTO publishers (name, address, phone, email, created_by, updated_by)
            VALUES (
                'NFR Publisher ' || i,
                'Synthetic publisher address',
                '',
                '',
                admin_user_id,
                admin_user_id
            );
        END IF;
    END LOOP;

    FOR i IN 1..100 LOOP
        generated_isbn := (9799100000000::BIGINT + i)::TEXT;

        SELECT id INTO category_id
        FROM categories
        WHERE deleted_at IS NULL AND name = 'NFR Category ' || (((i - 1) % 8) + 1)
        LIMIT 1;

        SELECT id INTO author_id
        FROM authors
        WHERE deleted_at IS NULL AND name = 'NFR Author ' || (((i - 1) % 20) + 1)
        LIMIT 1;

        SELECT id INTO publisher_id
        FROM publishers
        WHERE deleted_at IS NULL AND name = 'NFR Publisher ' || (((i - 1) % 5) + 1)
        LIMIT 1;

        INSERT INTO books (
            category_id,
            author_id,
            publisher_id,
            title,
            isbn,
            publication_year,
            price,
            stock_quantity,
            description,
            cover_url,
            business_status,
            storage_location,
            created_by,
            updated_by
        )
        VALUES (
            category_id,
            author_id,
            publisher_id,
            'NFR Postgres Book ' || i,
            generated_isbn,
            2000 + (i % 25),
            50000 + (i % 80) * 1000,
            20 + (i % 90),
            'Synthetic Postgres catalog book for GraphDB sync tests',
            '',
            'ACTIVE',
            'NFR-ZONE-' || (((i - 1) % 8) + 1),
            admin_user_id,
            admin_user_id
        )
        ON CONFLICT (isbn) DO UPDATE
        SET category_id = EXCLUDED.category_id,
            author_id = EXCLUDED.author_id,
            publisher_id = EXCLUDED.publisher_id,
            title = EXCLUDED.title,
            publication_year = EXCLUDED.publication_year,
            price = EXCLUDED.price,
            stock_quantity = EXCLUDED.stock_quantity,
            description = EXCLUDED.description,
            cover_url = EXCLUDED.cover_url,
            business_status = EXCLUDED.business_status,
            storage_location = EXCLUDED.storage_location,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = admin_user_id,
            deleted_at = NULL;
    END LOOP;

    RAISE NOTICE 'Seeded 100 NFR Postgres catalog books with ISBN prefix 979910';
END $$;
