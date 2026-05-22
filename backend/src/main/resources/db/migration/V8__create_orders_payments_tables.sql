-- V8__create_orders_tables.sql

-- Create orders table matching CustomerOrder entity
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL,
    ordered_at TIMESTAMP NOT NULL,
    subtotal_amount DECIMAL(18,2) NOT NULL,
    shipping_fee DECIMAL(18,2) NOT NULL,
    total_amount DECIMAL(18,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    shipping_address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

-- Create order_items table matching OrderItem entity
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(id),
    isbn_snapshot VARCHAR(20) NOT NULL,
    title_snapshot VARCHAR(255) NOT NULL,
    author_snapshot VARCHAR(255),
    category_snapshot VARCHAR(255),
    cover_url_snapshot TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(18,2) NOT NULL,
    line_total DECIMAL(18,2) NOT NULL,
    discount DECIMAL(18,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

-- Create indexes for orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_ordered_at ON orders(ordered_at DESC);
CREATE INDEX idx_orders_deleted_at ON orders(deleted_at) WHERE deleted_at IS NULL;

-- Create indexes for order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_book_id ON order_items(book_id);
CREATE INDEX idx_order_items_isbn_snapshot ON order_items(isbn_snapshot);
CREATE INDEX idx_order_items_deleted_at ON order_items(deleted_at) WHERE deleted_at IS NULL;
