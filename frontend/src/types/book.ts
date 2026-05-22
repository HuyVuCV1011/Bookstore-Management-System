import type { BusinessStatus } from './common';
import type { Category } from './category';
import type { Author } from './author';
import type { Publisher } from './publisher';

export type { BusinessStatus };

export interface Book {
  id: number;
  title: string;
  isbn?: string;
  coverUrl?: string;
  publicationYear: number;
  price: number;
  stockQuantity: number;
  description?: string;
  businessStatus: BusinessStatus;
  storageLocation?: string;
  category: Category;
  author: Author;
  publisher: Publisher;
  createdAt: string;
  updatedAt: string;
}

export interface BookRequest {
  title: string;
  isbn?: string;
  coverUrl?: string;
  publicationYear: number;
  price: number;
  stockQuantity?: number;
  description?: string;
  businessStatus: BusinessStatus;
  storageLocation?: string;
  categoryId: number;
  authorId: number;
  publisherId: number;
}
