-- V7__create_customers_table.sql

-- Create customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    address TEXT,
    profile_completed BOOLEAN NOT NULL DEFAULT false,
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_email ON customers(email);
