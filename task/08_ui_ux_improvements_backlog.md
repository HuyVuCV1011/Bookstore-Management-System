# UI/UX & Feature Expansion Backlog

This backlog documents visual, layout, and functional user experience enhancements that should be implemented in future runs. These are structured as actionable developer tasks with clear requirements, scopes, and priorities.

---

## 1. UI & Visual Polish Tasks

### ID: UI-01
#### Title
Form Input Validation Feedback & Error Contrast

#### Context
Currently, input validation on the auth pages (login/register) and profile page is handled by `react-hook-form` and Zod, but validation error messaging is basic. The error styles and validation border/background changes do not fully reflect the Starbucks design language (which specifies customized pastel background tints for valid and invalid inputs), and the red text can sometimes suffer from low readability on certain layouts.

#### Requirements / Acceptance Criteria
- Implement the invalid field background tint `hsl(4 82% 43% / 5%)` (Red Tint) dynamically on input containers in [Input.tsx](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source%20Code/frontend/src/components/common/Input.tsx) when the `error` prop is present.
- Implement the valid field background tint `hsl(160 32% 87% / 33%)` (Green Light Tint) when the input is dirty and valid.
- Ensure the error icon and text color conform to Starbucks Red (`#c82014`) for WCAG-friendly contrast.
- Ensure transitions between validation states are smooth (`0.2s ease-in-out`).

#### Scope
UI-Only

#### Priority
Medium

---

### ID: UI-02
#### Title
Skeleton Loading States & Empty-State Placeholders

#### Context
Data fetching across the catalog (`BooksPage`), book details (`BookDetailPage`), and orders history displays a raw spinning SVG loader. This creates a jarring layout shift when data loads, which breaks the premium feel of the system. Additionally, empty states (e.g. empty cart or no books found in search) are basic text messages.

#### Requirements / Acceptance Criteria
- Create a reusable `SkeletonCard` component in `components/common/SkeletonCard.tsx` that mimics the book card size, layout, and shadow, with a pulsing gray opacity animation.
- Replace the raw loading spinners in [BooksPage.tsx](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source%20Code/frontend/src/pages/BooksPage.tsx) with a grid of 8-10 pulsing `SkeletonCard` components.
- Replace the raw spinner in [BookDetailPage.tsx](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source%20Code/frontend/src/pages/BookDetailPage.tsx) with a layout skeleton (left block for cover, right block for text).
- Design and integrate illustrated empty-state panels in [CartPage.tsx](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source%20Code/frontend/src/pages/CartPage.tsx) and [OrdersPage.tsx](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source%20Code/frontend/src/pages/OrdersPage.tsx) with friendly illustrations/SVGs and call-to-action buttons (e.g. "Duyệt sách ngay", "Quay lại").

#### Scope
UI-Only

#### Priority
High

---

## 2. Feature & UX Enhancements

### ID: FEATURE-01
#### Title
Wishlist Guest-Mode Syncing and Authenticated Merging

#### Context
Currently, the bookstore supports guest wishlist storage via `localStorage` and authenticated wishlist storage via database API endpoints (`wishlistApi`). However, when a guest adds books to their wishlist, logs in, and continues browsing, the guest items are ignored rather than synced to their user profile.

#### Requirements / Acceptance Criteria
- Modify [LoginForm.tsx](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source%20Code/frontend/src/components/auth/LoginForm.tsx) to check for the presence of `bookstore_guest_wishlist` in `localStorage` upon successful login.
- If guest wishlist items are present, send sequential requests or a batch API call (if backend supports it) to `wishlistApi.addItem` to add these book IDs to the authenticated user's database wishlist.
- Clear the `bookstore_guest_wishlist` from `localStorage` after successful merging.
- Ensure the wishlist count in [Navbar.tsx](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source%20Code/frontend/src/components/layout/Navbar.tsx) updates dynamically.

#### Scope
UI+API

#### Priority
Medium

---

### ID: FEATURE-02
#### Title
Multi-Faceted Catalog Filtering & Advanced Search

#### Context
The `BooksPage` catalog currently supports only one filter dimension (a single active category tab) and basic sorting (best seller, rating, price, title). Users cannot narrow down their search by combining multiple authors, publishers, price ranges, rating ranges, or stock availability.

#### Requirements / Acceptance Criteria
- Design a collapsible Sidebar Filter Panel in [BooksPage.tsx](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source%20Code/frontend/src/pages/BooksPage.tsx) (desktop: left-side sidebar; mobile: slide-out drawer).
- Implement interactive filters:
  - Price Range Slider / Inputs (Min - Max)
  - Rating Tiers (4★ and up, 3★ and up, etc.)
  - Multi-select Checkboxes for Authors, Publishers, and Categories
  - Toggle Switch for "Còn hàng" (In stock only)
- Synchronize active filter states to URL search parameters (`?category=1&author=2&minPrice=10000`) using `react-router-dom` search params, allowing bookmarking and sharing of specific views.
- Ensure performance remains fast by optimizing the in-memory sorting/filtering logic or integrating with backend paginated search endpoints.

#### Scope
UI+API (if backend-supported search is used) / UI-Only (if in-memory filtering of 500 books is kept)

#### Priority
High

---

### ID: FEATURE-03
#### Title
Low-Stock Alerts & Direct Reorder Shortcuts on Staff Dashboard

#### Context
Staff members currently have to navigate to `/staff/inventory` or `/staff/analytics/inventory-reorder` to see which books are running low or out of stock. There is no high-priority warning dashboard widget visible on login to alert them immediately to inventory gaps.

#### Requirements / Acceptance Criteria
- Add a new "Cảnh báo hết hàng / Tồn kho thấp" widget on the [StaffDashboard.tsx](file:///Users/mac/Data/HCMUS/Thạc sĩ/Hệ CSDL nâng cao/N01_Final_Project/Source%20Code/frontend/src/pages/staff/StaffDashboard.tsx).
- Fetch catalog items where `stockQuantity < 5` (or a customizable low-stock threshold).
- Display a list of the top 5 low-stock items with an badge indicating the remaining quantity (e.g. `Hết hàng` or `Chỉ còn 2`).
- Provide a direct action shortcut button "Tạo phiếu đặt hàng" (Create Purchase Order) next to each item, which redirects to the PO Form Page `/staff/purchase-orders/create` with the `bookId` and default supplier pre-filled.

#### Scope
UI+API

#### Priority
High
