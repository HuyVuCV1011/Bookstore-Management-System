# Security Architecture and Policies

This document outlines the authentication, authorization, session, rate-limiting, and general security policies implemented within the Bookstore Management System.

---

## 1. Authentication & Role-Based Access Control (RBAC)

The application implements a stateless JWT-based authentication system paired with Spring Security.

### Roles and Privileges

The system recognizes three roles:

- **`ROLE_CUSTOMER`**: Customers browsing the storefront. Customers can manage their profile, cart (stored in MongoDB), wishlist, and view/cancel their own orders. They are restricted from editing books, categories, publishers, or viewing administrative metrics.
- **`ROLE_STAFF`**: Staff members managing inventory. Staff can perform write operations on books, categories, authors, and publishers. They can view, create, and receive purchase orders. They are restricted from admin-only system configurations and metrics.
- **`ROLE_ADMIN`**: System administrators. Admins possess superuser privileges, including catalog deletion, user management, session management, CDC outbox retry/monitoring, and access to system dashboards/analytics.

### Security Configurations

The security policies are configured in [SecurityConfig.java](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source Code/backend/src/main/java/com/bookstore/config/SecurityConfig.java):
1. **Public Read-Only Access**: `GET` requests to catalog endpoints (`/api/books/**`, `/api/categories/**`, `/api/authors/**`, `/api/publishers/**`), search (`/api/search/**`), and reviews feed (`/api/reviews/book/**`) are public.
2. **Authenticated Carts**: Cart endpoints (`/api/cart/**`) are public to support both anonymous guest cart (via Redis) and authenticated member cart (via MongoDB).
3. **Write/Mutating Boundaries**:
   - `POST`/`PUT`/`DELETE` operations on books, categories, authors, and publishers require `ADMIN` or `STAFF` roles.
   - Catalog `DELETE` operations strictly require `ADMIN` role.
   - All admin endpoints (`/api/admin/**`) require the `ADMIN` role.

---

## 2. JWT and Cookie Management

Authentication uses two types of JSON Web Tokens:
1. **Access Token (Short-lived)**: Returned directly in the response payload upon login/refresh. Transmitted in the `Authorization: Bearer <token>` header for subsequent requests.
2. **Refresh Token (Long-lived)**: Stored in a secure cookie to refresh access tokens without requiring re-authentication.

### Secure Cookie Policy

The refresh token cookie is created, managed, and deleted via [RefreshTokenCookieService.java](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source Code/backend/src/main/java/com/bookstore/service/RefreshTokenCookieService.java) with strict configuration:
- **`HttpOnly`**: Enabled. The cookie is inaccessible to client-side scripts, protecting it from cross-site scripting (XSS) attacks.
- **`Secure`**: Set to `true` (can be configured in production via `security.cookie.secure`). This ensures the cookie is only sent over HTTPS.
- **`SameSite`**: Set to `Lax` (configurable) to defend against Cross-Site Request Forgery (CSRF).
- **Path Isolation**: Scoped strictly to the authentication endpoints (default `/api/auth`) to minimize cookie exposure on unrelated REST API calls.

---

## 3. Session Revocation & Fail-Closed Strategy

For compliance and threat-mitigation, access tokens contain a session identifier (`sid`). The session state is persisted in Cassandra.

### Session Validation

For every authenticated request, the [JwtAuthenticationFilter](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source Code/backend/src/main/java/com/bookstore/security/JwtAuthenticationFilter.java) extracts the session ID from the JWT payload and verifies it against Cassandra:
1. If the session is flagged as `revoked` in Cassandra, the request is rejected.
2. If the session is expired, the request is rejected.
3. If the session does not exist in Cassandra, the request is rejected.

### Cassandra Downtime Fail-Closed Policy

If Cassandra becomes unavailable, session lookup fails. To maintain security integrity without completely breaking public catalog usage, the system adopts a hybrid **fail-closed** policy:
- **High-Risk Endpoints (Fail-Closed)**: If session lookup fails, requests to privileged endpoints starting with `/api/admin`, `/api/inventory`, `/api/suppliers`, `/api/purchase-orders`, `/api/analytics`, or `/api/dashboard`, OR requests made by users possessing `ADMIN` or `STAFF` roles, are immediately rejected with a `503 Service Unavailable` response.
- **Low-Risk Endpoints (Fail-Open)**: Public storefront queries or customer self-actions (like catalog reading or cart browsing) are allowed to proceed to avoid total business downtime.

---

## 4. IP-Based Distributed Rate Limiting

To prevent brute-force attacks on credentials, login endpoints are protected by a distributed rate limiter backed by Redis.

### Rate Limiting Logic

Managed by [RateLimitService.java](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source Code/backend/src/main/java/com/bookstore/service/RateLimitService.java):
- **Redis Storage**: Login attempts are recorded in Redis under `rate:limit:login:<client_ip>`.
- **Sliding Expiration**: The limit automatically expires after a configured TTL window (e.g. 15 minutes).
- **Lockout**: Exceeding the maximum allowed attempts throws `RateLimitException`, which maps to a `429 Too Many Requests` API response containing the remaining lockout time.
- **Proxy Support**: Under proxy environments (e.g. Docker, reverse proxies, or ngrok), IP extraction parses `X-Forwarded-For` when `security.rate-limit.trust-proxy` is enabled.
