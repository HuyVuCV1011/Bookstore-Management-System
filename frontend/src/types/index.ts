// Re-export all types
export * from './auth.types';
export * from './graph.types';
export * from './book';
export * from './category';
export * from './author';
export * from './publisher';
export * from './customer';
export * from './common';
export type { Profile, UpdateProfileRequest } from './profile';

import type { Book } from './book';

export interface Review {
  id: string;
  bookId: number;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  moderated: boolean;
  createdAt: string;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface CartItem {
  bookId: number;
  quantity: number;
  book?: Book;
}

export interface Cart {
  userId?: string;
  items: CartItem[];
}

export interface Wishlist {
  userId: string;
  bookIds: number[];
  books?: Book[];
}

export interface BookSearch {
  id: number;
  title: string;
  authorName: string;
  categoryName: string;
  isbn?: string;
  price: number;
  publicationYear: number;
  businessStatus: string;
}
