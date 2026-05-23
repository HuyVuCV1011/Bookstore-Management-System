-- V26__alter_inventory_transactions_reference_id_to_varchar.sql
-- Alter reference_id column to support UUID strings for customer orders and integer strings for purchase orders
ALTER TABLE inventory_transactions
ALTER COLUMN reference_id TYPE VARCHAR(100);
