# Siren Reads Frontend

React + TypeScript storefront and operations UI for the Siren Reads bookstore system.

## Quick Start

```bash
npm install
npm run dev
```

Common scripts:

```bash
npm run build
npm run lint
npm run preview
```

## Environment

Create `frontend/.env` when running outside Docker:

```env
VITE_API_URL=http://localhost:8080/api
VITE_INACTIVITY_TIMEOUT=1800000
```

In Docker Compose, `VITE_API_URL` is passed as a build argument and points to the backend container through the host-exposed API port.

## Main User Areas

- Storefront catalog, search, recommendations, book detail, cart, wishlist, checkout, profile, and order history.
- Staff inventory, suppliers, purchase orders, receiving, reorder dashboard, and transaction history.
- Admin catalog management, user management, review moderation, session monitoring, CDC status, and analytics.

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- React Router 7
- Axios
- React Hook Form + Zod
- Framer Motion
- Recharts
- Material UI
- Tailwind CSS

## Project Structure

```text
src/
+-- components/      Shared, auth, cart, admin, analytics, staff, and domain widgets
+-- contexts/        Authentication and cart state providers
+-- hooks/           Reusable React hooks
+-- pages/           Route-level screens
+-- services/        API clients and backend integration helpers
+-- types/           TypeScript domain contracts
+-- utils/           Formatting, axios config, and helper functions
+-- App.tsx          Route shell
`-- main.tsx         Vite entry point
```

## Integration Notes

The frontend treats the backend as the source of business rules. Stock validation, verified-purchase review checks, cart merge behavior, and database-specific workflows are enforced by backend services and surfaced through API responses.

Local demo accounts are for development only. Configure reusable credentials through private seed data or local environment files, not committed documentation.
