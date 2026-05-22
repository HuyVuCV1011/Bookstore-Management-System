-- V23__create_purchase_orders_tables.sql
-- Create purchase orders tables for inventory management

-- Create purchase_orders table
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INT NOT NULL REFERENCES suppliers(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'RECEIVING', 'COMPLETED', 'CANCELLED')),
    order_date TIMESTAMP,
    expected_delivery_date DATE,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    received_by UUID REFERENCES users(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL
);

-- Create purchase_order_items table
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT NOT NULL REFERENCES purchase_orders(id),
    book_id INT NOT NULL REFERENCES books(id),
    quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INT NOT NULL DEFAULT 0 CHECK (quantity_received >= 0 AND quantity_received <= quantity_ordered),
    unit_cost DECIMAL(18,2) NOT NULL CHECK (unit_cost >= 0),
    line_total DECIMAL(18,2) NOT NULL CHECK (line_total >= 0),
    notes TEXT
);

-- Create indexes for purchase_orders
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders(created_by);

-- Create indexes for purchase_order_items
CREATE INDEX idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_book_id ON purchase_order_items(book_id);
