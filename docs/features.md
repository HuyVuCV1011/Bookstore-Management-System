# Feature Inventory - Bookstore Management System

This document outlines the core functional capabilities of the Bookstore Management System.

For the latest checked behavior and test evidence, see [Feature Verification Notes](feature-verification.md).

---

## 1. Catalog & Search Management

### Search Engine (MongoDB Backed)
- **Full-Text Catalog Search**: Users can search titles, authors, and descriptions.
- **Categorization & Filters**: Dynamic category listings and price-range sorting.
- **Active Filter Constraint**: Hides discontinued and inactive books (`businessStatus != ACTIVE`) from public catalog queries to ensure out-of-circulation items do not appear.

### Book Details Screen
- **Unified Metadata Displays**: Shows author profiles, summaries, ISBN codes, pricing, stock levels, and publisher credits.
- **Interactive Reviews Feed**: Displays approved ratings and comments with sorting parameters (highest ratings first, latest reviews first).

---

## 2. Customer Shopping Tools

### Persistent Cart (Polyglot Hybrid Cart Service)
- **Guest Session Carts**: Anonymous users can add books to their cart immediately. Redis caches guest items keyed by session ID (`guest_cart:<sessionId>`) with a 7-day TTL expiration window.
- **Member Carts**: Logged-in users' shopping carts are persistently stored in MongoDB.
- **Cart Merge Logic**: Upon logging in, the frontend triggers a merge operation. Redis guest items are appended to the user's MongoDB cart.
- **Cumulative Stock Guard**: Both Redis and MongoDB cart operations perform transactional checks to ensure the total quantity does not exceed PostgreSQL warehousing levels.

### Personal Wishlists
- **Quick Save**: Customers can add items to their MongoDB-backed wishlist and retrieve them later.
- **Availability Flags**: Highlights changes in pricing or stock levels on items in the wishlist.

---

## 3. Order Processing & Transactions

### Checkout Flow
- **UUID Orders**: Instantly constructs secure, trace-ready orders in PostgreSQL.
- **Transaction Controls**: Prevents checkout if catalog items have dropped in stock below target amounts.
- **Automatic Adjustments**: Decrements Postgres warehousing counts upon order completion.

### Order History
- **Personal Log**: Customers can view past invoices, tracking statuses, and payment states.

---

## 4. Graph-Powered Recommendation System

### Neo4j Recommendation Engine
- **Item-based collaborative filtering**: Suggests books based on patterns from other buyers.
- **Author/Category Affinity**: Recommends similar materials matching the user's favorite authors or categories.

---

## 5. Review Moderation & Community

### Strict Feedback Loop
- **Verified Purchase Requirement**: Restricts reviews only to customers who have purchased the book.
- **One-per-user-per-book Constraint**: Prevents review spamming.
- **Moderation Workflow**: Hides new or modified reviews by default. Staff/Admins approve comments before they affect public summaries and rating aggregates.

---

## 6. Staff & Administrative Controls

### Inventory Control
- **Add/Modify Books**: Create new titles, adjust pricing, and toggle business visibility.
- **Stock replenishment**: Record incoming shipments and update warehousing counts.

### Order Management
- **Order tracking**: Monitor order state transitions (Pending, Processing, Completed, Cancelled).
- **Payment management**: Record payments and flag transaction outcomes.

### Analytics Dashboard
- **Relational Reporting (PostgreSQL)**: Low stock reports, daily revenue summaries, and best-selling lists.
- **Recommendation Analytics (Neo4j)**: Visualizes the purchase interest network and recommendation path effectiveness.
