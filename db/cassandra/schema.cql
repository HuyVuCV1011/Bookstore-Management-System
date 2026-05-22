-- Cassandra Keyspace and Table Definitions
-- Run inside cqlsh to initialize the keyspace and tables.

CREATE KEYSPACE IF NOT EXISTS bookstore_events
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE bookstore_events;

-- 1. user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    sessionId uuid,
    userId uuid,
    refreshToken text,
    revoked boolean,
    deviceInfo text,
    ipAddress text,
    createdAt timestamp,
    expiresAt timestamp,
    PRIMARY KEY (sessionId)
);

-- 2. interaction_events table
CREATE TABLE IF NOT EXISTS interaction_events (
    id uuid,
    user_id uuid,
    book_id int,
    event_type text,
    event_time timestamp,
    metadata text,
    PRIMARY KEY (id)
);
