# Service Layer Database Decisions

This folder contains most of the application logic that crosses database boundaries. The database choices below are tied to the services that use them, so readers can inspect the code and the rationale together.

## PostgreSQL: Transactional Source Of Truth

Used by: `OrderService`, `InventoryService`, `PurchaseOrderService`, `BookService`, `CustomerService`, `SupplierService`, `AuthService`, `SessionService`, reporting/materialized-view services.

PostgreSQL is used where correctness matters more than document flexibility:

- `OrderService.createOrder` validates customer profile state, checks stock, deducts inventory, snapshots item fields, calculates totals, and saves the order in one transactional flow.
- Review eligibility checks use PostgreSQL order history through `OrderRepository.hasPurchasedBook(...)` and `existsCompletedPurchaseByUserIdAndIsbn(...)`.
- Cart and guest-cart services query PostgreSQL books before accepting quantities, so Redis or MongoDB never become the authority for stock.
- Reporting services and materialized views depend on relational joins across orders, inventory, books, suppliers, and customers.

Benefits in these locations:

- ACID transactions protect checkout and inventory.
- Foreign keys and relationships model users, orders, order items, books, categories, authors, publishers, and purchase orders clearly.
- SQL queries and materialized views are a good fit for operational reporting.
- PostgreSQL remains the repair source if MongoDB, Redis, or Neo4j projections need rebuilding.

## MongoDB: User Documents And Catalog Read Models

Used by: `CartService`, `WishlistService`, `ReviewService`, `BookSearchService`, `BookDetailSyncService`, `BookSyncService`.

MongoDB is used for data that is read as whole documents or benefits from flexible nested shapes:

- `CartService` stores one cart document per authenticated user. The cart can hold a variable number of item objects without joining a cart table and cart-item table on every user interaction.
- `WishlistService` stores a compact user document with saved book IDs.
- `ReviewService` stores review text, rating, moderation status, and user display data as review documents while still relying on PostgreSQL to verify purchases.
- `BookSearchService` reads denormalized book detail documents for full-text search and filter screens.
- `BookSyncService` projects PostgreSQL book records into MongoDB at startup, then triggers Redis autocomplete rebuilds.

Benefits in these locations:

- Nested cart, wishlist, review, and book-detail records are simple to fetch and update as documents.
- Catalog search can read denormalized fields without expensive joins at page-render time.
- Review and book-detail documents can evolve without changing every core transactional table.
- MongoDB read models are rebuildable from PostgreSQL when catalog source data changes.

## Redis: Expiring Guest State And Fast Ranked Lookups

Used by: `GuestCartService`, `SearchAutocompleteService`, `RateLimitService`, `RedisSearchController`.

Redis is used where short-lived state, sorted scores, and low-latency reads matter:

- `GuestCartService` stores anonymous carts under `guest_cart:<sessionId>` as Redis hashes. Each write renews a seven-day TTL, so abandoned carts expire automatically.
- `SearchAutocompleteService` stores normalized title entries in `search:autocomplete` and uses sorted sets for `search:trending:keywords` and `search:trending:books`.
- Trending counters are incremented directly in Redis, avoiding write pressure on PostgreSQL or MongoDB for every search keystroke or selection.
- Rate-limit counters fit Redis because they are naturally temporary and keyed by user/IP/window.

Benefits in these locations:

- TTL support makes guest cart cleanup automatic.
- Hashes are efficient for cart item quantity updates.
- Sorted sets make trending keyword/book counters straightforward.
- Redis can be flushed and rebuilt from MongoDB/PostgreSQL projections without losing critical transactional state.

## Cassandra: Append-Only Interaction Events

Used by: `InteractionEventService`, `InteractionEventRepository`, `InteractionEvent`.

Cassandra is used for user interaction telemetry:

- `InteractionEventService.trackEvent` writes asynchronously so telemetry failures do not block the user-facing request.
- Events include `VIEW`, `CLICK`, `ADD_TO_CART`, `PURCHASE`, `REVIEW`, `LIKE`, `SEARCH`, `BOOKMARK`, and `SHARE`.
- Each event is inserted as an independent row with a UUID primary key and metadata payload.

Benefits in this location:

- High-volume append writes stay separate from checkout and catalog operations.
- Event data can grow quickly without bloating transactional tables.
- The write path is tolerant of occasional failures because analytics events are useful but not required for request success.

## Neo4j Projection Touchpoints

Used from services such as `ReviewService`, `BookGraphProjectionService`, `CustomerGraphProjectionService`, and `OrderGraphProjectionService`.

The regular service layer does not treat Neo4j as the source of truth. Instead, it projects facts from PostgreSQL or approved MongoDB review documents into graph relationships:

- Catalog changes become `Book`, `Author`, `Category`, and `Publisher` nodes.
- Orders become `Customer` to `Book` `PURCHASED` relationships and `BOUGHT_TOGETHER` book relationships.
- Approved reviews become `RATED` relationships.
- Book views become `VIEWED` relationships.

Benefits in this location:

- Recommendation queries can traverse native relationships instead of repeatedly joining transaction tables.
- Graph projection failures can be logged and retried without invalidating the PostgreSQL transaction.
- The graph can contain recommendation-specific counters and relationship weights without polluting core catalog tables.

See [../graph/README.md](../graph/README.md) for Cypher query behavior and recommendation logic.
