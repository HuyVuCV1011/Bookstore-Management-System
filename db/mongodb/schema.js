// MongoDB collection and index reference for Siren Reads.
// The Spring Boot application also creates indexes through entity annotations
// and MongoIndexConfig; keep this file aligned with those classes.

db = db.getSiblingDB('bookstore');

// 1. book_details
// Rich catalog read model used by BookSearchService and book detail screens.
db.createCollection('book_details');
db.book_details.createIndex({ isbn: 1 });
db.book_details.createIndex({ 'category.id': 1 });
db.book_details.createIndex({ 'author.id': 1 });
db.book_details.createIndex({ businessStatus: 1 });
db.book_details.createIndex(
  { title: 'text', 'author.name': 'text', 'category.name': 'text' },
  { weights: { title: 10, 'author.name': 5, 'category.name': 3 }, name: 'BookDetailTextIndex' }
);

// 2. books_search
// Lightweight startup projection populated by BookSyncService from PostgreSQL.
// SearchAutocompleteService reads this collection to rebuild Redis autocomplete.
db.createCollection('books_search');
db.books_search.createIndex({ isbn: 1 });
db.books_search.createIndex({ businessStatus: 1 });
db.books_search.createIndex(
  { title: 'text', authorName: 'text', categoryName: 'text' },
  { weights: { title: 10, authorName: 5, categoryName: 3 }, name: 'BookSearchTextIndex' }
);

// 3. reviews
// ReviewService stores one document per user/book review and keeps moderation
// state here while PostgreSQL remains responsible for purchase verification.
db.createCollection('reviews');
db.reviews.createIndex({ bookId: 1 });
db.reviews.createIndex({ userId: 1 });
db.reviews.createIndex({ bookId: 1, userId: 1 }, { unique: true });
db.reviews.createIndex({ bookId: 1, moderated: 1 });

// 4. carts
// Authenticated user carts. Guest carts live in Redis because they need TTL.
// The Java entity uses userId as the MongoDB document _id.
db.createCollection('carts');

// 5. wishlists
// Compact per-user saved-book document.
// The Java entity uses userId as the MongoDB document _id.
db.createCollection('wishlists');
