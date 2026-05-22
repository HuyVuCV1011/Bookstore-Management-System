import axiosInstance from '../../utils/axiosConfig';
import type { PopularBook, InventoryReorderItem, CatalogStatistics } from '../../types/analytics';

export const analyticsApi = {
  // Get popular books from materialized view
  getPopularBooks: async () => {
    return axiosInstance.get<PopularBook[]>('/analytics/popular-books');
  },

  // Get inventory reorder report from materialized view
  getInventoryReorder: async (priority?: string) => {
    const url = priority
      ? `/analytics/inventory-reorder/priority/${priority}`
      : '/analytics/inventory-reorder';
    return axiosInstance.get<InventoryReorderItem[]>(url);
  },

  // Get catalog statistics from materialized view
  getCatalogStatistics: async () => {
    return axiosInstance.get<CatalogStatistics[]>('/analytics/catalog-statistics');
  },

  // Refresh materialized views (admin only)
  refreshMaterializedViews: async () => {
    return axiosInstance.post('/analytics/refresh');
  },

  trackBookView: (
    bookId: number,
    userId?: string
  ) => {
    return axiosInstance.post(
      `/analytics/interactions/book-view/${bookId}`,
      null,
      {
        params: { userId }
      }
    );
  },

  trackSearch: (
    keyword: string,
    userId?: string
  ) => {
    return axiosInstance.post(
      `/analytics/interactions/search`,
      null,
      {
        params: {
          keyword,
          userId
        }
      }
    );
  },

  trackAddToCart: (
    bookId: number,
    userId?: string
  ) => {
    return axiosInstance.post(
      `/analytics/interactions/add-cart/${bookId}`,
      null,
      {
        params: { userId }
      }
    );
  },

  trackWishlist: (
    bookId: number,
    userId?: string
  ) => {
    return axiosInstance.post(
      `/analytics/interactions/wishlist/${bookId}`,
      null,
      {
        params: { userId }
      }
    );
  },

  trackReview: (
    bookId: number,
    userId?: string
  ) => {
    return axiosInstance.post(
      `/analytics/interactions/review/${bookId}`,
      null,
      {
        params: { userId }
      }
    );
  }
};
