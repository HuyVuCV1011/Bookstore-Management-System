// Small GraphDB NFR dataset
// Expected scale: 100 books, 500 customers, ~4,000 purchases, ~10,000 views, ~1,500 ratings.

WITH 100 AS bookCount, 500 AS customerCount
UNWIND range(1, 10) AS categoryId
MERGE (cat:Category {category_id: 'NFR-CAT-' + right('00' + toString(categoryId), 2)})
SET cat.name = 'NFR Category ' + toString(categoryId),
    cat.nfr_seed = true,
    cat.dataset = 'small';

WITH 100 AS bookCount, 500 AS customerCount
UNWIND range(1, 30) AS authorId
MERGE (a:Author {author_id: 'NFR-AUTH-' + right('000' + toString(authorId), 3)})
SET a.name = 'NFR Author ' + toString(authorId),
    a.nfr_seed = true,
    a.dataset = 'small';

WITH 100 AS bookCount, 500 AS customerCount
UNWIND range(1, 5) AS publisherId
MERGE (p:Publisher {publisher_id: 'NFR-PUB-' + right('00' + toString(publisherId), 2)})
SET p.name = 'NFR Publisher ' + toString(publisherId),
    p.nfr_seed = true,
    p.dataset = 'small';

WITH 100 AS bookCount
UNWIND range(1, bookCount) AS bookId
MATCH (cat:Category {category_id: 'NFR-CAT-' + right('00' + toString(((bookId - 1) % 10) + 1), 2)})
MATCH (a:Author {author_id: 'NFR-AUTH-' + right('000' + toString(((bookId - 1) % 30) + 1), 3)})
MATCH (p:Publisher {publisher_id: 'NFR-PUB-' + right('00' + toString(((bookId - 1) % 5) + 1), 2)})
MERGE (b:Book {isbn: toString(9799000000000 + bookId)})
SET b.title = 'NFR Small Book ' + toString(bookId),
    b.description = 'Synthetic book for GraphDB NFR small dataset',
    b.price = 50000 + (bookId % 50) * 1000,
    b.status = 'active',
    b.language = 'vi',
    b.published_year = 2000 + (bookId % 25),
    b.avg_rating = 0.0,
    b.rating_count = 0,
    b.purchase_count = 0,
    b.view_count = 0,
    b.cover_url = '',
    b.nfr_seed = true,
    b.dataset = 'small'
MERGE (b)-[:BELONGS_TO {nfr_seed: true}]->(cat)
MERGE (b)-[:WRITTEN_BY {nfr_seed: true}]->(a)
MERGE (b)-[:PUBLISHED_BY {nfr_seed: true}]->(p);

WITH 500 AS customerCount
UNWIND range(1, customerCount) AS customerId
MERGE (c:Customer {customer_id: 'NFR-CUST-' + right('000000' + toString(customerId), 6)})
SET c.name = 'NFR Customer ' + toString(customerId),
    c.email = 'nfr.customer.' + toString(customerId) + '@example.test',
    c.tier = CASE customerId % 4
               WHEN 0 THEN 'platinum'
               WHEN 1 THEN 'gold'
               WHEN 2 THEN 'silver'
               ELSE 'bronze'
             END,
    c.nfr_seed = true,
    c.dataset = 'small';

WITH 100 AS bookCount, 500 AS customerCount, 8 AS purchasesPerCustomer
UNWIND range(1, customerCount) AS customerId
UNWIND range(1, purchasesPerCustomer) AS purchaseIndex
WITH customerId,
     ((customerId * 7 + purchaseIndex * 13) % bookCount) + 1 AS bookId,
     purchaseIndex
MATCH (c:Customer {customer_id: 'NFR-CUST-' + right('000000' + toString(customerId), 6)})
MATCH (b:Book {isbn: toString(9799000000000 + bookId)})
MERGE (c)-[p:PURCHASED {order_id: 'NFR-SMALL-ORDER-' + toString(customerId) + '-' + toString(purchaseIndex)}]->(b)
SET p.quantity = 1 + ((customerId + purchaseIndex) % 3),
    p.unit_price = b.price,
    p.purchased_at = localdatetime() - duration({days: (customerId + purchaseIndex) % 30}),
    p.nfr_seed = true,
    p.dataset = 'small';

WITH 100 AS bookCount, 500 AS customerCount, 20 AS viewsPerCustomer
UNWIND range(1, customerCount) AS customerId
UNWIND range(1, viewsPerCustomer) AS viewIndex
WITH customerId,
     ((customerId * 11 + viewIndex * 17) % bookCount) + 1 AS bookId,
     viewIndex
MATCH (b:Book {isbn: toString(9799000000000 + bookId)})
MERGE (s:ViewSession {session_id: 'NFR-SMALL-SESSION-' + toString(customerId) + '-' + toString(viewIndex)})
SET s.user_id = 'NFR-CUST-' + right('000000' + toString(customerId), 6),
    s.created_at = localdatetime() - duration({days: viewIndex % 10}),
    s.nfr_seed = true,
    s.dataset = 'small'
MERGE (s)-[v:VIEWED]->(b)
SET v.session_id = s.session_id,
    v.user_id = s.user_id,
    v.viewed_at = localdatetime() - duration({days: viewIndex % 10}),
    v.duration_seconds = 15 + (viewIndex % 180),
    v.nfr_seed = true,
    v.dataset = 'small';

WITH 100 AS bookCount, 500 AS customerCount, 3 AS ratingsPerCustomer
UNWIND range(1, customerCount) AS customerId
UNWIND range(1, ratingsPerCustomer) AS ratingIndex
WITH customerId,
     ((customerId * 5 + ratingIndex * 19) % bookCount) + 1 AS bookId,
     ratingIndex
MATCH (c:Customer {customer_id: 'NFR-CUST-' + right('000000' + toString(customerId), 6)})
MATCH (b:Book {isbn: toString(9799000000000 + bookId)})
MERGE (c)-[r:RATED]->(b)
SET r.score = 1 + ((customerId + ratingIndex) % 5),
    r.review_text = 'Synthetic NFR rating',
    r.rated_at = localdatetime() - duration({days: ratingIndex % 30}),
    r.nfr_seed = true,
    r.dataset = 'small';

WITH 100 AS bookCount
UNWIND range(1, bookCount) AS bookId
UNWIND range(1, 4) AS offset
WITH bookId, bookId + offset AS relatedBookId
WHERE relatedBookId <= bookCount
MATCH (b1:Book {isbn: toString(9799000000000 + bookId)})
MATCH (b2:Book {isbn: toString(9799000000000 + relatedBookId)})
MERGE (b1)-[bt:BOUGHT_TOGETHER]->(b2)
SET bt.co_occurrence_count = 5 + ((bookId + relatedBookId) % 40),
    bt.confidence = toFloat(5 + ((bookId + relatedBookId) % 40)) / 50.0,
    bt.last_updated = localdatetime(),
    bt.nfr_seed = true,
    bt.dataset = 'small';

MATCH (b:Book {nfr_seed: true, dataset: 'small'})
OPTIONAL MATCH (b)<-[p:PURCHASED]-()
WITH b, coalesce(sum(p.quantity), 0) AS totalPurchased
SET b.purchase_count = totalPurchased;

MATCH (b:Book {nfr_seed: true, dataset: 'small'})
OPTIONAL MATCH (b)<-[v:VIEWED]-()
WITH b, count(v) AS totalViews
SET b.view_count = totalViews;

MATCH (b:Book {nfr_seed: true, dataset: 'small'})
OPTIONAL MATCH (b)<-[r:RATED]-()
WITH b, avg(r.score) AS avgRating, count(r) AS ratingCount
SET b.avg_rating = CASE WHEN ratingCount = 0 THEN 0.0 ELSE round(avgRating * 10) / 10.0 END,
    b.rating_count = ratingCount;
