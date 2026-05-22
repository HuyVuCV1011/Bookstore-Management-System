// frontend/src/types/inventory.ts
import type { BusinessStatus } from './book';

export interface InventoryItem {
  bookId: number;
  title: string;
  isbn?: string;
  stockQuantity: number;
  businessStatus: BusinessStatus;
  price: number;
  categoryName: string;
  authorName: string;
}

export interface InventoryQueryParams {
  keyword?: string;
  categoryId?: number;
  status?: BusinessStatus;
  page?: number;
  size?: number;
}

export type StockLevel = {
  bookId: number;
  title: string;
  isbn: string;
  categoryName: string;
  stockQuantity: number;
  storageLocation: string;
  businessStatus: string;
};

export type InventoryTransaction = {
  id: number;
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  transactionType: 'PURCHASE_IN' | 'SALE_OUT' | 'ADJUSTMENT';
  quantityChange: number;
  referenceType: 'PURCHASE_ORDER' | 'ORDER' | 'MANUAL';
  referenceId: number | null;
  oldQuantity: number;
  newQuantity: number;
  performedBy: string;
  performedByEmail: string;
  notes: string;
  transactionDate: string;
};

export type StockAdjustmentRequest = {
  bookId: number;
  quantityChange: number;
  reason: string;
};
