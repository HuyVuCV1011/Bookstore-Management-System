-- V9__create_warehouse_inventory_tables.sql

-- Create suppliers table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    payment_terms TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

-- Create warehouse_staff table (consolidated - no separate employees table)
CREATE TABLE warehouse_staff (
    id UUID PRIMARY KEY REFERENCES users(id),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    area_responsible VARCHAR(100),
    hire_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_warehouse_staff_email ON warehouse_staff(email);

-- Purchase orders tables removed as per requirements

-- Create inventory_transactions table
CREATE TABLE inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('PURCHASE_IN', 'SALE_OUT', 'ADJUSTMENT')),
    quantity_change INT NOT NULL,
    reference_type VARCHAR(50) CHECK (reference_type IN ('PURCHASE_ORDER', 'ORDER', 'MANUAL')),
    reference_id INT,
    old_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for suppliers
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- Purchase order indexes removed

-- Create indexes for inventory_transactions
CREATE INDEX idx_inventory_transactions_book_id ON inventory_transactions(book_id);
CREATE INDEX idx_inventory_transactions_transaction_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_inventory_transactions_transaction_type ON inventory_transactions(transaction_type);
