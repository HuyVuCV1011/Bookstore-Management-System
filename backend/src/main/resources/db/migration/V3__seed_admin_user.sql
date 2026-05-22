-- Insert a disabled placeholder admin audit user for seed ownership.
-- Create real admin accounts through a private local seed or admin workflow.
INSERT INTO users (email, password, role, is_active)
VALUES (
    'admin@bookstore.com',
    '$2y$12$EyHg7TWND2AwurwiBUZffON5CQqAY/mqUt2pKhbC35jsQEt8TcR6.',
    'ADMIN',
    false
);
