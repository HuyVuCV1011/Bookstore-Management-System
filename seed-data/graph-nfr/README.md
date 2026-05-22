# GraphDB NFR Seed Data

Folder này chứa seed data thủ công để test các yêu cầu phi chức năng của module GraphDB.
Các file này **không tự chạy cùng Flyway** để tránh làm bẩn dữ liệu demo hiện tại.

## Files

| File | Mục đích |
|---|---|
| `01_neo4j_constraints.cypher` | Tạo constraint/index cần thiết cho Neo4j |
| `02_neo4j_seed_small.cypher` | Seed dataset nhỏ cho smoke/performance test nhanh |
| `03_neo4j_seed_medium.cypher` | Seed dataset trung bình cho performance test |
| `04_postgres_catalog_seed.sql` | Seed catalog sách synthetic vào Postgres để test sync Postgres -> Neo4j |
| `98_cleanup_postgres_nfr_seed.sql` | Xóa seed Postgres synthetic |
| `99_cleanup_neo4j_nfr_seed.cypher` | Xóa seed Neo4j synthetic |

## Chạy Neo4j Seed

Từ folder root của project:

```bash
cd /path/to/project-root
```

Tạo constraints/index:

```bash
docker exec -i bookstore-neo4j cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" < seed-data/graph-nfr/01_neo4j_constraints.cypher
```

Seed nhỏ:

```bash
docker exec -i bookstore-neo4j cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" < seed-data/graph-nfr/02_neo4j_seed_small.cypher
```

Seed trung bình:

```bash
docker exec -i bookstore-neo4j cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" < seed-data/graph-nfr/03_neo4j_seed_medium.cypher
```

Cleanup Neo4j seed:

```bash
docker exec -i bookstore-neo4j cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" < seed-data/graph-nfr/99_cleanup_neo4j_nfr_seed.cypher
```

## Chạy Postgres Catalog Seed

Seed dữ liệu catalog synthetic vào Postgres:

```bash
docker exec -i bookstore-postgres psql -U bookstore_user -d bookstore < seed-data/graph-nfr/04_postgres_catalog_seed.sql
```

Sau đó sync Postgres -> Neo4j bằng một trong hai cách:

1. Restart backend để `BookGraphProjectionService` sync khi startup.
2. Gọi API `POST /api/graph/sync/books` bằng tài khoản `STAFF` hoặc `ADMIN`.

Cleanup Postgres seed:

```bash
docker exec -i bookstore-postgres psql -U bookstore_user -d bookstore < seed-data/graph-nfr/98_cleanup_postgres_nfr_seed.sql
```

## Lưu Ý

- `Neo4j seed` dùng prefix ISBN `979900...`.
- `Postgres seed` dùng prefix ISBN `979910...`.
- Không nên chạy Neo4j seed trực tiếp rồi chạy sync-all từ Postgres ngay sau đó nếu muốn giữ dataset synthetic Neo4j, vì sync-all có thể đánh dấu các book không tồn tại trong Postgres là `orphaned`.
- Nếu mục tiêu là test đồng bộ Postgres -> Neo4j, hãy dùng `04_postgres_catalog_seed.sql` rồi gọi sync API.
- Nếu mục tiêu là test traversal/performance thuần Neo4j, hãy dùng các file `02` hoặc `03`.
