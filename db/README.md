# Database Schema Guide

This folder contains schema references for the databases used by Siren Reads. The application runs the active configuration through Spring Boot and Docker Compose, while these files document the intended structures and manual setup commands.

## Files

| File | Database | Purpose |
| :--- | :--- | :--- |
| `postgres/schema.sql` | PostgreSQL | Relational schema reference for transactional bookstore data. |
| `sample-data.sql` | PostgreSQL | Example seed data for catalog and related relational records. |
| `mongodb/schema.js` | MongoDB | Collection and index reference for document read models. |
| `neo4j/schema.cypher` | Neo4j | Constraint and index setup for graph nodes. |
| `cassandra/schema.cql` | Cassandra | Keyspace and table setup for event/session-style wide-column data. |

## Placement Rationale

### PostgreSQL

PostgreSQL stores the authoritative relational model: users, roles, customers, books, authors, publishers, categories, inventory, orders, order items, suppliers, purchase orders, sessions, and reporting views.

Use PostgreSQL here because:

- Checkout and inventory updates need transactions.
- Order items need durable snapshots for audit/history.
- Catalog management benefits from foreign keys and relational constraints.
- Staff/admin reports benefit from SQL aggregation and materialized views.

### MongoDB

MongoDB stores document-shaped read and user interaction models: `book_details`, `books_search`, `reviews`, `carts`, and `wishlists`.

Use MongoDB here because:

- Book detail/search documents can denormalize author, category, publisher, status, and price fields for frontend reads.
- Carts and wishlists are naturally fetched as one user document.
- Reviews can carry moderation state, text, rating, display name, and timestamps without expanding the relational schema.
- Text indexes support catalog search across title, author, and category fields.

### Redis

Redis does not have a schema file because its data is key-based and created by services at runtime. The main keys are:

- `guest_cart:<sessionId>`: Redis hash of book ID to quantity with a seven-day TTL.
- `search:autocomplete`: sorted set of normalized autocomplete entries.
- `search:trending:keywords`: sorted set scored by keyword search count.
- `search:trending:books`: sorted set scored by selected book count.

Use Redis here because:

- Guest cart cleanup is automatic through TTL.
- Hash updates are fast for anonymous cart quantities.
- Sorted sets are a compact fit for autocomplete/trending features.
- Losing Redis data is recoverable because critical state lives in PostgreSQL or MongoDB.

### Cassandra

Cassandra stores append-style interaction events. The current reference schema defines `interaction_events` with a UUID primary key and event metadata fields.

Use Cassandra here because:

- Interaction telemetry can grow much faster than transactional data.
- Writes should be append-friendly and separate from user-facing transactions.
- Event failures should not block search, cart, checkout, or review workflows.

### Neo4j

Neo4j stores graph projections of books, customers, authors, categories, publishers, purchases, ratings, views, and bought-together relationships.

Use Neo4j here because:

- Recommendation queries are relationship traversals.
- Co-purchase and similar-customer paths are easier to score as graph patterns.
- Graph edges can carry recommendation-specific weights and counters.
- The graph can be rebuilt from PostgreSQL/MongoDB facts if needed.

## Operational Notes

- PostgreSQL is the source of truth for business transactions.
- MongoDB, Redis, and Neo4j read models should be treated as projections or specialized stores.
- Cassandra interaction data is useful for analytics and behavior tracking, but service methods intentionally avoid failing the main request when event writes fail.
- Keep secrets and default passwords in `.env`, not in schema or documentation files.
