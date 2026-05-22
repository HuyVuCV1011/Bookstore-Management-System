CREATE CONSTRAINT book_isbn IF NOT EXISTS
FOR (b:Book) REQUIRE b.isbn IS UNIQUE;

CREATE CONSTRAINT customer_id IF NOT EXISTS
FOR (c:Customer) REQUIRE c.customer_id IS UNIQUE;

CREATE CONSTRAINT author_id IF NOT EXISTS
FOR (a:Author) REQUIRE a.author_id IS UNIQUE;

CREATE CONSTRAINT category_id IF NOT EXISTS
FOR (c:Category) REQUIRE c.category_id IS UNIQUE;

CREATE CONSTRAINT publisher_id IF NOT EXISTS
FOR (p:Publisher) REQUIRE p.publisher_id IS UNIQUE;

CREATE CONSTRAINT view_session_id IF NOT EXISTS
FOR (s:ViewSession) REQUIRE s.session_id IS UNIQUE;

CREATE INDEX book_status IF NOT EXISTS
FOR (b:Book) ON (b.status);

CREATE INDEX purchased_at IF NOT EXISTS
FOR ()-[p:PURCHASED]-() ON (p.purchased_at);

CREATE INDEX rated_score IF NOT EXISTS
FOR ()-[r:RATED]-() ON (r.score);
