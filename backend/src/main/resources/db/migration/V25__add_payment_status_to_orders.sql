-- Add payment_status column to orders table
ALTER TABLE orders
ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID';

-- Add comment for clarity
COMMENT ON COLUMN orders.payment_status IS 'Payment status: UNPAID, PARTIAL, PAID, REFUNDED';

-- Update existing orders to have UNPAID status if not paid
UPDATE orders SET payment_status = 'UNPAID' WHERE payment_status IS NULL;
