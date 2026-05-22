import axiosInstance from '../utils/axiosConfig';
import type {
  BookRecommendation,
  BookReview,
  BookDetail,
  BookListItem,
  Bestseller,
  CategoryGrowth,
  InfluentialBook,
  CustomerCluster,
  RecordViewRequest,
  RecordRatingRequest,
  RatingEligibility,
} from '../types/graph.types';

export const graphService = {
  // ── Book list (all, for sort/filter) ─────────────────────────────

  getAllBooks: async (limit = 100): Promise<BookListItem[]> => {
    const { data } = await axiosInstance.get('/graph/books', { params: { limit } });
    return data;
  },

  // ── Book detail ──────────────────────────────────────────────────

  getBookDetail: async (isbn: string): Promise<BookDetail | null> => {
    try {
      const { data } = await axiosInstance.get(`/graph/books/${isbn}`);
      return data;
    } catch {
      return null;
    }
  },

  getBookReviews: async (isbn: string): Promise<BookReview[]> => {
    const { data } = await axiosInstance.get(`/graph/books/${isbn}/reviews`);
    return data;
  },

  // ── Recommendations ──────────────────────────────────────────────

  getCollaborativeRecommendations: async (customerId: string): Promise<BookRecommendation[]> => {
    const { data } = await axiosInstance.get(`/graph/recommendations/collaborative/${customerId}`);
    return data;
  },

  getMyCollaborativeRecommendations: async (): Promise<BookRecommendation[]> => {
    const { data } = await axiosInstance.get('/graph/recommendations/collaborative/me');
    return data;
  },

  getContentBasedRecommendations: async (isbn: string): Promise<BookRecommendation[]> => {
    const { data } = await axiosInstance.get(`/graph/recommendations/content-based/${isbn}`);
    return data;
  },

  getBoughtTogetherRecommendations: async (isbn: string): Promise<BookRecommendation[]> => {
    const { data } = await axiosInstance.get(`/graph/recommendations/bought-together/${isbn}`);
    return data;
  },

  // ── Interactions ─────────────────────────────────────────────────

  recordView: async (req: RecordViewRequest): Promise<void> => {
    await axiosInstance.post('/graph/interactions/view', req);
  },

  recordRating: async (req: RecordRatingRequest): Promise<void> => {
    await axiosInstance.post('/graph/interactions/rating', req);
  },

  getRatingEligibility: async (isbn: string): Promise<RatingEligibility> => {
    const { data } = await axiosInstance.get(`/graph/interactions/rating/eligibility/${isbn}`);
    return data;
  },

  // ── Analytics ────────────────────────────────────────────────────

  getBestsellers: async (limit = 10): Promise<Bestseller[]> => {
    const { data } = await axiosInstance.get('/graph/analytics/bestsellers', {
      params: { limit },
    });
    return data;
  },

  getCategoryGrowth: async (): Promise<CategoryGrowth[]> => {
    const { data } = await axiosInstance.get('/graph/analytics/category-growth');
    return data;
  },

  getInfluentialBooks: async (): Promise<InfluentialBook[]> => {
    const { data } = await axiosInstance.get('/graph/analytics/influential-books');
    return data;
  },

  getCustomerClusters: async (): Promise<CustomerCluster[]> => {
    const { data } = await axiosInstance.get('/graph/analytics/customer-clusters');
    return data;
  },
};
