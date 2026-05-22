import axiosInstance from '../../utils/axiosConfig';
import type { Review, RatingSummary } from '../../types';
import type { PageResponse } from '../../types/common';

export const reviewApi = {
  getByBook: (bookId: number, rating?: number, page = 0, size = 10, sort = 'createdAt,desc') =>
    axiosInstance.get<PageResponse<Review>>(`/reviews/book/${bookId}`, {
      params: { rating, page, size, sort },
    }),

  getSummary: (bookId: number) =>
    axiosInstance.get<RatingSummary>(`/reviews/book/${bookId}/summary`),

  getBulkSummaries: (bookIds: number[]) =>
    axiosInstance.post<Record<number, RatingSummary>>('/reviews/summaries', bookIds),

  create: (review: Partial<Review>) =>
    axiosInstance.post<void>('/reviews', review),

  update: (id: string, review: Partial<Review>) =>
    axiosInstance.put(`/reviews/${id}`, review),

  delete: (reviewId: string) =>
    axiosInstance.delete(`/reviews/${reviewId}`),

  getAll: (page = 0, size = 20) =>
    axiosInstance.get<PageResponse<Review>>('/reviews', {
      params: { page, size },
    }),

  approve: (id: string) =>
    axiosInstance.patch(`/reviews/admin/${id}/approve`),

  deleteByAdmin: (reviewId: string) =>
    axiosInstance.delete(`/reviews/admin/${reviewId}`),
};
