export type BookDetail = {
  isbn: string;
  title: string;
  description: string | null;
  price: number | null;
  avgRating: number | null;
  ratingCount: number | null;
  purchaseCount: number | null;
  viewCount: number | null;
  coverUrl: string | null;
  status: string | null;
  language: string | null;
  publishedYear: number | null;
  authorId: string | null;
  authorName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  publisherId: string | null;
  publisherName: string | null;
};

export type BookRecommendation = {
  isbn: string;
  title: string;
  price: number | null;
  avgRating: number | null;
  coverUrl: string | null;
  score: number | null;
  basis: 'category' | 'author' | 'collaborative' | 'co-purchase' | null;
};

export type BookReview = {
  customerName: string | null;
  score: number | null;
  reviewText: string | null;
  ratedAt: string | null;
};

export type BookListItem = {
  isbn: string;
  title: string;
  price: number | null;
  avgRating: number | null;
  ratingCount: number;
  purchaseCount: number;
  viewCount: number;
  coverUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  authorName: string | null;
  publisherName: string | null;
  publishedYear: number | null;
  language: string | null;
};

export type Bestseller = {
  isbn: string;
  title: string;
  price: number | null;
  avgRating: number | null;
  coverUrl: string | null;
  totalSold: number;
  rank: number;
  ratingCount: number | null;
  viewCount: number | null;
  authorName: string | null;
  categoryName: string | null;
};

export type CategoryGrowth = {
  categoryId: string;
  categoryName: string;
  revenue: number;
  customerCount: number;
  totalSold: number;
  latestPurchasedAt: string | null;
};

export type InfluentialBook = {
  isbn: string;
  title: string;
  avgRating: number | null;
  coverUrl: string | null;
  influenceScore: number;
};

export type CustomerCluster = {
  clusterName: string;
  customerIds: string[];
  clusterSize: number;
};

export type SyncOrderRequest = {
  customerId: string;
  orderId: string;
  purchasedAt: string;
  items: { isbn: string; quantity: number; price: number }[];
};

export type RecordViewRequest = {
  customerId: string;
  isbn: string;
  durationSeconds: number;
  sessionId: string;
};

export type RecordRatingRequest = {
  customerId: string;
  isbn: string;
  score: number;
  reviewText?: string;
};

export type RatingEligibility = {
  canRate: boolean;
  message: string;
};
