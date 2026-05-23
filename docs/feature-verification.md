# Feature Verification Notes

This file records the feature checks performed against the current changed logic. It is documentation only; no application code is added here.

## Verification Summary

| Area | Feature | Verification |
| :--- | :--- | :--- |
| Security | Public catalog access and protected catalog writes | Covered by `SecurityBoundaryTest`. Anonymous users can read catalog data, anonymous writes are rejected, customers cannot delete books, and admins can delete books. |
| Checkout | Order creation, stock deduction, cancellation, and ownership boundaries | Covered by `OrderServiceTest`. Successful orders reduce stock, insufficient stock is rejected, cancellation restores stock, shipped orders cannot be cancelled, and customers cannot read or cancel another customer's order. |
| Purchase orders | Goods receiving and over-receive protection | Covered by `PurchaseOrderServiceTest`. Receiving submitted purchase-order items increases stock, and receiving more than the ordered quantity is rejected. |
| Authenticated cart | MongoDB cart quantity and merge rules | Covered by `CartServiceTest`. Adds items, rejects quantities above PostgreSQL stock, merges guest cart items, and skips merge items that would exceed stock. |
| Guest cart | Redis guest-cart TTL and stock rules | Covered by `GuestCartServiceTest`. Adds guest cart items under `guest_cart:<sessionId>`, renews the seven-day TTL, rejects missing sessions, and rejects cumulative quantities above stock. |
| Wishlist | MongoDB saved-book list | Covered by `WishlistServiceTest`. Adds valid books to a user's wishlist and detects saved books. |
| Reviews | Verified-purchase review flow and moderation | Covered by `ReviewServiceTest`. Purchased customers can create unmoderated reviews, non-purchasers are rejected, and approving a review marks it moderated. |
| Search | Redis autocomplete and trending counters | Covered by `SearchAutocompleteServiceTest`. Empty prefixes return no suggestions, valid prefixes map Redis entries to autocomplete results, and keyword/book counters increment in Redis sorted sets. |
| Reporting | PostgreSQL materialized-view refreshes | Covered by `MaterializedViewRefreshServiceTest`. Catalog statistics, popular books, and inventory reorder report refresh commands are executed. |
| Repository integration | Purchase-order repository behavior on PostgreSQL | Covered by `PurchaseOrderRepositoryTest` using Testcontainers PostgreSQL. |
| Frontend dark mode | Cart, navigation, fast search, order history, profile, admin analytics, and staff reorder screens | Reviewed from changed React/Tailwind files. Build verification could not run because `npm` and `frontend/node_modules` are unavailable in the current shell. |

## Commands Run

```bash
cd backend
./gradlew test --rerun-tasks
```

Result: `BUILD SUCCESSFUL` with all test tasks executed.

```bash
cd frontend
npm run build
```

Result: not executed because `npm` is not available in the current shell and `frontend/node_modules` is not installed. The changed frontend files were reviewed statically.

## Feature Details

### Security Boundaries

The new security checks focus on catalog access:

- `GET /api/books` remains public.
- Anonymous `POST /api/books` is rejected with a client error.
- A customer role cannot delete catalog records.
- An admin role can delete catalog records.

This protects the catalog management surface while preserving public storefront browsing.

### Checkout And Order Ownership

The checkout tests verify the transactional behavior around orders and stock:

- Creating an order stores a processing order and reduces stock.
- Cash payment creates an unpaid payment state.
- An insufficient-stock order is rejected and leaves stock unchanged.
- Cancelling an eligible order restores stock and marks the order cancelled.
- Shipped orders cannot be cancelled.
- A customer cannot fetch or cancel another customer's order.

These checks are important because PostgreSQL is the source of truth for order history and inventory quantities.

### Purchase-Order Receiving

The receiving tests verify staff-side inventory replenishment:

- A submitted purchase order can receive a partial quantity.
- Received quantity increases the book stock.
- Receiving more than the ordered quantity is rejected.
- Failed receiving does not change stock.

This keeps supplier purchasing aligned with warehouse inventory.

### Cart And Wishlist Rules

The cart tests cover both persistence paths:

- Authenticated carts use MongoDB documents.
- Guest carts use Redis hashes and expire after seven days.
- Both paths validate against PostgreSQL stock before saving quantities.
- Guest-cart merge skips invalid items instead of corrupting the authenticated cart.

Wishlist tests verify the MongoDB saved-book flow for valid catalog items.

### Reviews And Moderation

Review tests confirm the verified-purchase rule:

- A customer must have purchased the book before creating a review.
- New reviews are saved as unmoderated.
- Approved reviews become moderated and can be projected to graph rating logic.

This keeps public rating summaries from being polluted by unverified or unapproved reviews.

### Search And Reporting

Search tests verify Redis behavior:

- Autocomplete returns mapped title/book ID suggestions.
- Search keywords and selected books increment Redis sorted-set scores.

Reporting tests verify that the service issues the expected PostgreSQL materialized-view refresh commands for:

- Catalog statistics.
- Popular books.
- Inventory reorder report.

### Frontend Dark-Mode Review

The changed frontend files mainly improve text contrast and dark-mode styling in:

- Shared admin table rows and empty states.
- Cart item and cart summary surfaces.
- Main navigation and footer.
- Payment method descriptions.
- Fast search suggestions, trending chips, result rows, and timing indicator.
- Order history loading, empty, summary, and item-count states.
- Profile loading text.
- Catalog statistics cards.
- Popular books analytics table, filter buttons, and KPI cards.
- Inventory reorder dashboard table, priority filters, and empty state.

Static review found these changes are presentation-only and do not alter API contracts or business rules.
