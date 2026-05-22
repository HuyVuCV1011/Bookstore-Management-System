// Medium GraphDB NFR dataset
// Expected scale: 10,000 books, 20,000 customers, ~240,000 purchases,
// ~400,000 views, ~80,000 ratings. This may take several minutes.

WITH 10000 AS bookCount
UNWIND range(1, 50) AS categoryId
MERGE (cat:Category {category_id: 'NFR-MED-CAT-' + right('000' + toString(categoryId), 3)})
SET cat.name = 'NFR Medium Category ' + toString(categoryId),
    cat.nfr_seed = true,
    cat.dataset = 'medium';

WITH 10000 AS bookCount
UNWIND range(1, 500) AS authorId
MERGE (a:Author {author_id: 'NFR-MED-AUTH-' + right('0000' + toString(authorId), 4)})
SET a.name = 'NFR Medium Author ' + toString(authorId),
    a.nfr_seed = true,
    a.dataset = 'medium';

WITH 10000 AS bookCount
UNWIND range(1, 40) AS publisherId
MERGE (p:Publisher {publisher_id: 'NFR-MED-PUB-' + right('000' + toString(publisherId), 3)})
SET p.name = 'NFR Medium Publisher ' + toString(publisherId),
    p.nfr_seed = true,
    p.dataset = 'medium';

WITH 10000 AS bookCount
UNWIND range(1, bookCount) AS bookId
MATCH (cat:Category {category_id: 'NFR-MED-CAT-' + right('000' + toString(((bookId - 1) % 50) + 1), 3)})
MATCH (a:Author {author_id: 'NFR-MED-AUTH-' + right('0000' + toString(((bookId - 1) % 500) + 1), 4)})
MATCH (p:Publisher {publisher_id: 'NFR-MED-PUB-' + right('000' + toString(((bookId - 1) % 40) + 1), 3)})
MERGE (b:Book {isbn: toString(9799001000000 + bookId)})
SET b.title = 'NFR Medium Book ' + toString(bookId),
    b.description = 'Synthetic book for GraphDB NFR medium dataset',
    b.price = 60000 + (bookId % 120) * 1000,
    b.status = 'active',
    b.language = 'vi',
    b.published_year = 1990 + (bookId % 35),
    b.avg_rating = 0.0,
    b.rating_count = 0,
    b.purchase_count = 0,
    b.view_count = 0,
    b.cover_url = '',
    b.nfr_seed = true,
    b.dataset = 'medium'
MERGE (b)-[:BELONGS_TO {nfr_seed: true, dataset: 'medium'}]->(cat)
MERGE (b)-[:WRITTEN_BY {nfr_seed: true, dataset: 'medium'}]->(a)
MERGE (b)-[:PUBLISHED_BY {nfr_seed: true, dataset: 'medium'}]->(p);

WITH 20000 AS customerCount
UNWIND range(1, customerCount) AS customerId
MERGE (c:Customer {customer_id: 'NFR-MED-CUST-' + right('000000' + toString(customerId), 6)})
SET c.name = 'NFR Medium Customer ' + toString(customerId),
    c.email = 'nfr.medium.customer.' + toString(customerId) + '@example.test',
    c.tier = CASE customerId % 4
               WHEN 0 THEN 'platinum'
               WHEN 1 THEN 'gold'
               WHEN 2 THEN 'silver'
               ELSE 'bronze'
             END,
    c.nfr_seed = true,
    c.dataset = 'medium';

WITH 10000 AS bookCount, 20000 AS customerCount, 12 AS purchasesPerCustomer
UNWIND range(1, customerCount) AS customerId
UNWIND range(1, purchasesPerCustomer) AS purchaseIndex
WITH customerId,
     ((customerId * 17 + purchaseIndex * 31) % bookCount) + 1 AS bookId,
     purchaseIndex
MATCH (c:Customer {customer_id: 'NFR-MED-CUST-' + right('000000' + toString(customerId), 6)})
MATCH (b:Book {isbn: toString(9799001000000 + bookId)})
MERGE (c)-[p:PURCHASED {order_id: 'NFR-MED-ORDER-' + toString(customerId) + '-' + toString(purchaseIndex)}]->(b)
SET p.quantity = 1 + ((customerId + purchaseIndex) % 4),
    p.unit_price = b.price,
    p.purchased_at = localdatetime() - duration({days: (customerId + purchaseIndex) % 30}),
    p.nfr_seed = true,
    p.dataset = 'medium';

WITH 10000 AS bookCount, 20000 AS customerCount, 20 AS viewsPerCustomer
UNWIND range(1, customerCount) AS customerId
UNWIND range(1, viewsPerCustomer) AS viewIndex
WITH customerId,
     ((customerId * 19 + viewIndex * 41) % bookCount) + 1 AS bookId,
     viewIndex
MATCH (b:Book {isbn: toString(9799001000000 + bookId)})
MERGE (s:ViewSession {session_id: 'NFR-MED-SESSION-' + toString(customerId) + '-' + toString(viewIndex)})
SET s.user_id = 'NFR-MED-CUST-' + right('000000' + toString(customerId), 6),
    s.created_at = localdatetime() - duration({days: viewIndex % 10}),
    s.nfr_seed = true,
    s.dataset = 'medium'
MERGE (s)-[v:VIEWED]->(b)
SET v.session_id = s.session_id,
    v.user_id = s.user_id,
    v.viewed_at = localdatetime() - duration({days: viewIndex % 10}),
    v.duration_seconds = 20 + (viewIndex % 240),
    v.nfr_seed = true,
    v.dataset = 'medium';

WITH 10000 AS bookCount, 20000 AS customerCount, 4 AS ratingsPerCustomer
UNWIND range(1, customerCount) AS customerId
UNWIND range(1, ratingsPerCustomer) AS ratingIndex
WITH customerId,
     ((customerId * 23 + ratingIndex * 37) % bookCount) + 1 AS bookId,
     ratingIndex
MATCH (c:Customer {customer_id: 'NFR-MED-CUST-' + right('000000' + toString(customerId), 6)})
MATCH (b:Book {isbn: toString(9799001000000 + bookId)})
MERGE (c)-[r:RATED]->(b)
SET r.score = 1 + ((customerId + ratingIndex) % 5),
    r.review_text = 'Synthetic NFR medium rating',
    r.rated_at = localdatetime() - duration({days: ratingIndex % 30}),
    r.nfr_seed = true,
    r.dataset = 'medium';

WITH 10000 AS bookCount
UNWIND range(1, bookCount) AS bookId
UNWIND range(1, 4) AS offset
WITH bookId, bookId + offset AS relatedBookId
WHERE relatedBookId <= bookCount
MATCH (b1:Book {isbn: toString(9799001000000 + bookId)})
MATCH (b2:Book {isbn: toString(9799001000000 + relatedBookId)})
MERGE (b1)-[bt:BOUGHT_TOGETHER]->(b2)
SET bt.co_occurrence_count = 10 + ((bookId + relatedBookId) % 90),
    bt.confidence = toFloat(10 + ((bookId + relatedBookId) % 90)) / 100.0,
    bt.last_updated = localdatetime(),
    bt.nfr_seed = true,
    bt.dataset = 'medium';

MATCH (b:Book {nfr_seed: true, dataset: 'medium'})
OPTIONAL MATCH (b)<-[p:PURCHASED]-()
WITH b, coalesce(sum(p.quantity), 0) AS totalPurchased
SET b.purchase_count = totalPurchased;

MATCH (b:Book {nfr_seed: true, dataset: 'medium'})
OPTIONAL MATCH (b)<-[v:VIEWED]-()
WITH b, count(v) AS totalViews
SET b.view_count = totalViews;

MATCH (b:Book {nfr_seed: true, dataset: 'medium'})
OPTIONAL MATCH (b)<-[r:RATED]-()
WITH b, avg(r.score) AS avgRating, count(r) AS ratingCount
SET b.avg_rating = CASE WHEN ratingCount = 0 THEN 0.0 ELSE round(avgRating * 10) / 10.0 END,
    b.rating_count = ratingCount;
