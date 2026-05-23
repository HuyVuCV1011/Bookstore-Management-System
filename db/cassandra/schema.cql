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

-- 3. interaction_events_by_type table
CREATE TABLE IF NOT EXISTS interaction_events_by_type (
    event_type text,
    event_time timestamp,
    id uuid,
    user_id uuid,
    book_id int,
    metadata text,
    PRIMARY KEY ((event_type), event_time, id)
) WITH CLUSTERING ORDER BY (event_time DESC, id ASC);

-- 4. interaction_events_by_bucket table
CREATE TABLE IF NOT EXISTS interaction_events_by_bucket (
    bucket text,
    event_time timestamp,
    id uuid,
    user_id uuid,
    book_id int,
    event_type text,
    metadata text,
    PRIMARY KEY ((bucket), event_time, id)
) WITH CLUSTERING ORDER BY (event_time DESC, id ASC);

-- 5. user_sessions_by_bucket table
CREATE TABLE IF NOT EXISTS user_sessions_by_bucket (
    bucket text,
    expires_at timestamp,
    session_id uuid,
    user_id uuid,
    refresh_token text,
    revoked boolean,
    device_info text,
    ip_address text,
    created_at timestamp,
    PRIMARY KEY ((bucket), expires_at, session_id)
) WITH CLUSTERING ORDER BY (expires_at DESC, session_id ASC);

-- 6. user_sessions_by_status table
CREATE TABLE IF NOT EXISTS user_sessions_by_status (
    status text,
    session_id uuid,
    PRIMARY KEY ((status), session_id)
);

-- 7. interaction_events_by_user table
CREATE TABLE IF NOT EXISTS interaction_events_by_user (
    user_id uuid,
    event_time timestamp,
    id uuid,
    book_id int,
    event_type text,
    metadata text,
    PRIMARY KEY ((user_id), event_time, id)
) WITH CLUSTERING ORDER BY (event_time DESC, id ASC);
