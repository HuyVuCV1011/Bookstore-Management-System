// MongoDB Schemas & Collections Initialization Reference
// This details the collections and indexes configured for MongoDB.

db = db.getSiblingDB('bookstore');

// 1. book_details
db.createCollection('book_details');
db.book_details.createIndex({ isbn: 1 });
db.book_details.createIndex(
  { title: "text", "author.name": "text", "category.name": "text" },
  { weights: { title: 10, "author.name": 5, "category.name": 3 }, name: "BookTextIndex" }
);

// 2. reviews
db.createCollection('reviews');
db.reviews.createIndex({ bookId: 1 });
db.reviews.createIndex({ userId: 1 });

// 3. carts
db.createCollection('carts');

// 4. wishlists
db.createCollection('wishlists');
