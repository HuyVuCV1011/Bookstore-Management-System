# Local and ngrok Demo Deployment Guide

This guide details the procedure for setting up, running, and exposing the Bookstore Management System locally using Docker Compose and ngrok.

---

## 1. Prerequisites

Before running the deployment commands, ensure the following are installed:
- **Docker** and **Docker Compose (v2+)**
- **ngrok** (Free or Paid subscription)
- **psql** command-line utility (optional, for seed data loading)

---

## 2. Configuration Templates

The repository contains two environment templates:
1. **`.env.example`**: Standard local development variables.
2. **`.env.demo.example`**: Configured specifically for the isolated Docker demo environment.

To run the demo, make a local copy:
```bash
cp .env.demo.example .env.demo
```

### Key Parameters in `.env.demo`
- `VITE_API_URL`: The URL used by the frontend to contact the backend. Initialized to `http://localhost:8081/api`.
- `SECURITY_CORS_ALLOWED_ORIGINS`: Origins allowed to make API requests to the backend. Initialized to `http://localhost:5174,http://localhost:5173`.
- `JWT_SECRET`: Base64 signing key (min 256-bit).

---

## 3. Running Locally with Docker Compose

To start all databases, services, backend, and frontend containers in the demo stack:

### Step 1: Start Databases and Backend First
```bash
docker compose --env-file .env.demo -f docker-compose.demo.yml up -d --build postgres mongodb redis neo4j cassandra cassandra-init backend
```

Verify backend health check endpoint:
```bash
curl http://localhost:8081/actuator/health
```

### Step 2: Seed Demo Users
Once PostgreSQL is running, populate the databases with fake credentials:
```bash
docker compose --env-file .env.demo -f docker-compose.demo.yml exec -T postgres \
  psql -U bookstore_user -d bookstore < db/demo-users.sql
```

The sql script seeds two test users:
- **Admin**: `admin.demo@example.test` (password: `Demo@12345`)
- **Customer**: `customer.demo@example.test` (password: `Demo@12345`)

---

## 4. Public Access via ngrok Tunnels

Exposing the app to external reviewers requires two active HTTP tunnels (or a single reverse proxy).

### Option A: Two Tunnels (Default)

1. **Expose the Backend**:
   Start a tunnel on backend port `8081`:
   ```bash
   ngrok http 8081
   ```
   Copy the generated forwarding URL (e.g., `https://abcdef.ngrok-free.app`).

2. **Configure Backend URL in Frontend**:
   Update `.env.demo` and set `VITE_API_URL` to the backend tunnel:
   ```env
   VITE_API_URL=https://abcdef.ngrok-free.app/api
   ```

3. **Start the Frontend**:
   Build the frontend container to bake the new `VITE_API_URL` into the production static bundle:
   ```bash
   docker compose --env-file .env.demo -f docker-compose.demo.yml up -d --build frontend
   ```

4. **Expose the Frontend**:
   Start another tunnel on frontend port `5174`:
   ```bash
   ngrok http 5174
   ```
   Copy the generated forwarding URL (e.g., `https://xyz123.ngrok-free.app`).

5. **Configure CORS**:
   Add the frontend ngrok origin to `SECURITY_CORS_ALLOWED_ORIGINS` in `.env.demo`:
   ```env
   SECURITY_CORS_ALLOWED_ORIGINS=http://localhost:5174,http://localhost:5173,https://xyz123.ngrok-free.app
   ```

6. **Restart Backend**:
   Restart the backend container to apply the new CORS origins:
   ```bash
   docker compose --env-file .env.demo -f docker-compose.demo.yml up -d backend
   ```

7. **Share Link**:
   Provide the frontend ngrok URL (`https://xyz123.ngrok-free.app`) to reviewers.

---

## 5. Security & Cookie Constraints

> [!IMPORTANT]
> **Authentication Limitation Over ngrok Tunnels**:
> The authentication cookies (refresh tokens) use `SameSite=Lax` and `Secure` attributes. When frontend and backend run on different ngrok subdomains, browsers treat requests as cross-site subresource calls and reject Lax cookies. This will cause login, refresh, or logout failures.

### Recommended Workarounds:
- **Same-Origin Reverse Proxy**: Deploy a local reverse proxy (like Nginx) that routes `/api` to `localhost:8081` and all other paths to `localhost:5174`. Open a single ngrok tunnel pointing to this proxy.
- **Local Review**: Ask the reviewer to clone the repository and run it locally using standard localhost ports (`http://localhost:5174` for frontend), which bypasses cross-origin constraints.

---

## 6. Shutdown and Cleanup

Stop the container stack and reclaim system resources:
```bash
docker compose --env-file .env.demo -f docker-compose.demo.yml down
```

To delete all persistent volumes (erasing all transactional database and projection records):
```bash
docker compose --env-file .env.demo -f docker-compose.demo.yml down -v
```
