import axiosInstance from '../../utils/axiosConfig';
import type { BookSearch } from '../../types';
import type { PageResponse } from '../../types/common';

export const searchApi = {
  // MongoDB search (old API - requires text index)
  search: (q: string, page = 0, size = 10) =>
    axiosInstance.get<PageResponse<BookSearch>>('/search', {
      params: { q, page, size },
    }),

  filterByCategory: (category: string, page = 0, size = 10) =>
    axiosInstance.get<PageResponse<BookSearch>>('/search', {
      params: { category, page, size },
    }),

  filterByPrice: (minPrice: number, maxPrice: number, page = 0, size = 10) =>
    axiosInstance.get<PageResponse<BookSearch>>('/search', {
      params: { minPrice, maxPrice, page, size },
    }),

  // Redis-based fast search (new API)
  redisSearch: (q: string, limit = 10) =>
    axiosInstance.get<any>('/redis-search', {
      params: { q, limit },
    }),

  getAutocomplete: (q: string) =>
    axiosInstance.get<any[]>('/redis-search/autocomplete', {
      params: { q },
    }),

  getTrendingKeywords: (limit = 10) =>
    axiosInstance.get<string[]>('/redis-search/trending/keywords', {
      params: { limit },
    }),

  getTrendingBooks: (limit = 10) =>
    axiosInstance.get<any[]>('/redis-search/trending/books', {
      params: { limit },
    }),

  rebuildRedisIndex: () =>
    axiosInstance.post('/redis-search/rebuild-index'),

  getRedisStats: () =>
    axiosInstance.get('/redis-search/stats'),
};
