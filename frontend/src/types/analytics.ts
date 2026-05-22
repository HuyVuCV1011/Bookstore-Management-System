// Analytics types for materialized view data

export interface PopularBook {
  bookId: number;
  title: string;
  isbn: string;
  price: number;
  stockQuantity: number;
  businessStatus: string;
  categoryId: number;
  categoryName: string;
  authorId: number;
  authorName: string;
  publisherId: number;
  publisherName: string;
  totalQuantitySold: number;
  totalOrders: number;
  totalRevenue: number;
  averageSellingPrice: number;
  lastOrderDate: string;
  lastRefreshTime: string;
}

export interface InventoryReorderItem {
  bookId: number;
  title: string;
  isbn: string;
  businessStatus: string;
  categoryName: string;
  authorName: string;
  publisherName: string;
  currentStock: number;
  pendingPurchaseQuantity: number;
  totalSoldLast30Days: number;
  avgDailySales: number;
  ordersCount30d: number;
  lastSaleDate: string | null;
  daysOfStockRemaining: number;
  recommendedReorderQuantity: number;
  reorderPriority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'LOW_PRIORITY';
  lastPurchaseDate: string | null;
  lastRefreshTime: string;
}

export interface CatalogStatistics {
  categoryId: number | null;
  categoryName: string;
  totalBooks: number;
  totalAuthors: number;
  totalPublishers: number;
  totalStock: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  activeBooks: number;
  outOfStockBooks: number;
  discontinuedBooks: number;
  lastRefreshTime: string;
}
