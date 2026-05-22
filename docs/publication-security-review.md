# Public Repository Security Review

This review was prepared before publishing the Bookstore Management System repository publicly. It focuses on secrets, local artifacts, personal data, generated files, images, and documentation risk.

## Cleanup Status

The repository working tree has been cleaned after this review:

- Reusable password/JWT defaults were removed from Spring and Docker configuration.
- Demo/mock passwords were replaced with local environment placeholders.
- The seeded admin audit user was disabled so public seed data does not create a usable admin login.
- Local environment files, logs, build outputs, dependency folders, and risky screenshots were deleted from the working tree.
- `.gitignore` and `.env.example` were updated for public publishing.

## Must Remove Before Publishing

- `frontend/.env`: committed local environment file. It currently contains only localhost values, but real environment files must not be committed.
- `backend/logs/`: generated runtime/test logs. Logs include generated Spring Security development passwords and internal stack traces.
- `backend/build/`, `backend/.gradle/`, `frontend/dist/`, `frontend/node_modules/`: generated dependency/build artifacts.
- `.vscode/`: local editor configuration.
- `backend/build_output.txt` and `backend/build_test_output.txt`: generated build/test output files.
- README-linked screenshots under `docs/screenshots/` and `docs/features/` were removed from the public docs because several showed Starbucks-like logos and synthetic user names. Add fresh generic screenshots later if needed.

## Sensitive Values Found

| Location | Value / Context | Risk | Recommended replacement |
| --- | --- | --- | --- |
| `.env.example` | Real-looking `JWT_SECRET` value | Example files should never contain reusable secrets | `JWT_SECRET=replace-with-a-random-256-bit-base64-secret` |
| `backend/src/main/resources/application.yml` | `jwt.secret` default contains a reusable base64 signing secret | Anyone running defaults shares the same JWT signing key | Require `${JWT_SECRET}` or use a clearly invalid local placeholder |
| `backend/src/main/resources/application.yml` | `POSTGRES_PASSWORD:bookstore_pass`, `NEO4J_PASSWORD:bookstore123` defaults | Public default credentials can be deployed accidentally | Remove password defaults or replace with non-production placeholders |
| `docker-compose.yml`, `docker-compose.multidb.yml`, `backend/docker-compose.yml` | `POSTGRES_PASSWORD:-bookstore_pass`, `NEO4J_PASSWORD:-bookstore123` | Public default DB credentials | Reference `.env` variables and document that users must set them locally |
| `backend/docker-compose.yml` | `ME_CONFIG_BASICAUTH_USERNAME=admin`, `ME_CONFIG_BASICAUTH_PASSWORD=admin123` | Public default admin credentials for mongo-express | Use `MONGO_EXPRESS_USERNAME` and `MONGO_EXPRESS_PASSWORD` |
| `backend/src/main/resources/db/migration/V3__seed_admin_user.sql` | Seeds `admin@bookstore.com` with known password `Admin123!` | Known administrator account in public seed data | Gate demo user seeding behind a dev profile or generate from env vars |
| `db/sample-data.sql` | Seeds the same admin user and password hash | Known administrator account in sample SQL | Use fake/non-login sample data or env-driven local seed script |
| `backend/src/test/java/com/bookstore/PasswordHashVerificationTest.java` | Verifies and prints `Admin123!` and a BCrypt hash | Leaks the known demo password in test source and test output | Replace with generated test-only value not shared with seeded admin |
| `README.md`, `frontend/README.md` | Plaintext demo passwords were present before this review | Encourages reuse and exposes known credentials | Replaced with local-development guidance |
| `frontend/src/services/authService.ts` | Mock users include `Admin123!`, `Customer123!`, fake phone numbers and addresses | Hardcoded demo credentials in source | Move mock data to a dev-only fixture or remove passwords from committed source |
| `backend/logs/bookstore.log` | Spring-generated security passwords in logs | Generated secrets committed in logs | Delete logs and keep `backend/logs/` ignored |

## Code Change Proposals

- `backend/src/main/resources/application.yml`:
  - Problem: contains reusable default credentials and JWT secret.
  - Proposed change: make secrets required through environment variables or use invalid placeholders that fail fast outside local dev.
  - Example snippet:
    ```yaml
    # before
    password: ${POSTGRES_PASSWORD:bookstore_pass}
    secret: ${JWT_SECRET:MRmHb...}

    # after
    password: ${POSTGRES_PASSWORD}
    secret: ${JWT_SECRET}
    ```

- `docker-compose.yml`, `docker-compose.multidb.yml`, `backend/docker-compose.yml`:
  - Problem: public default database/admin passwords are embedded as Compose fallbacks.
  - Proposed change: remove password fallbacks and load values from `.env`.
  - Example snippet:
    ```yaml
    # before
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-bookstore_pass}

    # after
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ```

- `backend/docker-compose.yml`:
  - Problem: mongo-express default credentials are `admin` / `admin123`.
  - Proposed change: use environment variables documented in `.env.example`.
  - Example snippet:
    ```yaml
    ME_CONFIG_BASICAUTH_USERNAME: ${MONGO_EXPRESS_USERNAME}
    ME_CONFIG_BASICAUTH_PASSWORD: ${MONGO_EXPRESS_PASSWORD}
    ```

- `backend/src/main/resources/db/migration/V3__seed_admin_user.sql` and `db/sample-data.sql`:
  - Problem: admin user seed documents the known password `Admin123!`.
  - Proposed change: move admin creation to a dev-only seed script or require `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD_HASH` in local setup.
  - Example snippet:
    ```sql
    -- before
    -- Insert admin user with BCrypt hashed password for 'Admin123!'

    -- after
    -- Development-only admin seed. Do not use in production.
    ```

- `frontend/src/services/authService.ts`:
  - Problem: mock accounts include hardcoded passwords, names, phone numbers, and addresses.
  - Proposed change: remove committed mock credentials or move them to a dev-only fixture generated from local env.
  - Example snippet:
    ```ts
    // before
    password: 'Admin123!'

    // after
    // read mock credentials from local-only env or remove mock login passwords entirely
    ```

- `backend/src/test/java/com/bookstore/PasswordHashVerificationTest.java`:
  - Problem: the test hardcodes and prints the known admin password and hash.
  - Proposed change: remove console output and verify only a generated test-only password/hash pair.
  - Example snippet:
    ```java
    // before
    String password = "Admin123!";

    // after
    String password = "test-only-password";
    ```

- `frontend/public/icons.svg` and README screenshots:
  - Problem: screenshots include Starbucks-like marks/logos and synthetic personal names.
  - Proposed change: replace with generic bookstore/library iconography and anonymized names such as `Demo User`.

## Files To Keep With Caution

- `design.md`: safe to keep from a secrets/privacy perspective. I found no credentials, emails, student IDs, or internal team notes in it. It is a design reference, not a config file. It does repeatedly reference Starbucks design tokens and proprietary fonts, so keep the README disclaimer and avoid committing official Starbucks assets.
- `db/postgres/schema.sql`, `db/cassandra/schema.cql`, `db/mongodb/schema.js`, `db/neo4j/schema.cypher`: schema-only files are safe if they stay free of real data.
- `db/sample-data.sql` and Flyway seed migrations: data appears synthetic or public book/publisher metadata, but the known seeded admin account should be removed or dev-gated.

## Image Review

The removed README images did not show real API keys, passwords, internal URLs, or real customer records. They were removed because:

- `docs/screenshots/dashboard.png`, `docs/screenshots/recommendations.png`, and `docs/features/cart.png` showed Starbucks-like logos or marks.
- `docs/screenshots/dashboard.png`, `docs/features/reviews.png`, and other screenshots showed synthetic personal names such as `Alex P.`, `Sarah M.`, and `James Chen`.
- `docs/features/checkout.png` showed empty payment fields and was safe from credential exposure, but still used card-network/payment branding.

Resolution: README image references were removed, and the risky screenshot files were deleted from the working tree. Add fresh app-generated screenshots later using generic branding and anonymized sample users.

## Git History Risk

This workspace is not currently inside a Git repository, so repository history could not be inspected. If these files were ever committed previously, clean history before publishing:

- `.env`, `.env.*`
- `backend/logs/`
- build artifacts and dependency folders
- any seeded passwords or real JWT secrets

Use a history scanner such as `gitleaks`, `trufflehog`, or GitHub secret scanning before pushing.

## Manual Pre-Push Checklist

- [x] Delete generated and local-only folders: `frontend/node_modules/`, `frontend/dist/`, `backend/build/`, `backend/.gradle/`, `backend/logs/`, `.vscode/`.
- [x] Remove committed real environment files; keep only `.env.example`.
- [x] Replace all reusable defaults for `JWT_SECRET`, database passwords, Neo4j password, and mongo-express credentials.
- [x] Remove or dev-gate seeded admin/demo passwords.
- [x] Remove screenshots that included Starbucks-like logos or synthetic personal names.
- [ ] Confirm `design.md` remains a generic design reference and contains no internal notes.
- [ ] Run a secret scanner on the final repository and, if applicable, its Git history.
- [ ] Confirm `LICENSE` and README setup instructions are accurate and do not publish real credentials.
