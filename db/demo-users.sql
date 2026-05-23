-- Demo users for local ngrok demo.
-- These accounts are for local demo only. Do not use in production.
INSERT INTO users (email, password, role, is_active)
VALUES
  ('admin.demo@example.test', '$2y$12$xmAWL6/CpLFsI3h7p1RdV.0XvVHcwMjeyeFQo9M5nCl.oaJwWu1kq', 'ADMIN', true),
  ('customer.demo@example.test', '$2y$12$xmAWL6/CpLFsI3h7p1RdV.0XvVHcwMjeyeFQo9M5nCl.oaJwWu1kq', 'CUSTOMER', true)
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = true,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO customers (user_id, full_name, phone_number, email, address, profile_completed)
SELECT id, 'Demo Customer', '+84000000000', email, 'Demo Address', true
FROM users
WHERE email = 'customer.demo@example.test'
ON CONFLICT (user_id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    address = EXCLUDED.address,
    profile_completed = true,
    updated_at = CURRENT_TIMESTAMP;
