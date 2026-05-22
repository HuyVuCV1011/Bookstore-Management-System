import axiosInstance from '../../utils/axiosConfig';
import type {
  InteractionEventResponse,
  InteractionEventStats,
  TopBook,
  InteractionEventFilters,
  FlagRequest
} from '../../types/interactionEvent';

export const interactionEventApi = {
  getEvents: async (
    page: number = 0,
    size: number = 20,
    filters: InteractionEventFilters = {}
  ) => {
    const params: any = { page, size };

    if (filters.eventType && filters.eventType.length > 0) {
      params.eventType = filters.eventType.join(',');
    }
    if (filters.flagged !== undefined) params.flagged = filters.flagged;
    if (filters.userId) params.userId = filters.userId;
    if (filters.bookId) params.bookId = filters.bookId;
    if (filters.eventTimeFrom) params.eventTimeFrom = filters.eventTimeFrom;
    if (filters.eventTimeTo) params.eventTimeTo = filters.eventTimeTo;
    if (filters.search) params.search = filters.search;

    return axiosInstance.get<InteractionEventResponse>('/admin/interaction-events', { params });
  },

  getStats: async (filters: InteractionEventFilters = {}) => {
    const params: any = {};

    if (filters.eventType && filters.eventType.length > 0) {
      params.eventType = filters.eventType.join(',');
    }
    if (filters.flagged !== undefined) params.flagged = filters.flagged;
    if (filters.userId) params.userId = filters.userId;
    if (filters.bookId) params.bookId = filters.bookId;
    if (filters.eventTimeFrom) params.eventTimeFrom = filters.eventTimeFrom;
    if (filters.eventTimeTo) params.eventTimeTo = filters.eventTimeTo;
    if (filters.search) params.search = filters.search;

    return axiosInstance.get<InteractionEventStats>('/admin/interaction-events/stats', { params });
  },

  getDistribution: async (filters: InteractionEventFilters = {}) => {
    const params: any = {};

    if (filters.eventType && filters.eventType.length > 0) {
      params.eventType = filters.eventType.join(',');
    }
    if (filters.flagged !== undefined) params.flagged = filters.flagged;
    if (filters.userId) params.userId = filters.userId;
    if (filters.bookId) params.bookId = filters.bookId;
    if (filters.eventTimeFrom) params.eventTimeFrom = filters.eventTimeFrom;
    if (filters.eventTimeTo) params.eventTimeTo = filters.eventTimeTo;
    if (filters.search) params.search = filters.search;

    return axiosInstance.get<Record<string, number>>('/admin/interaction-events/distribution', { params });
  },

  getTopBooks: async (metric: string = 'views', limit: number = 10) => {
    const params = { metric, limit };

    return axiosInstance.get<TopBook[]>('/admin/interaction-events/top-books', { params });
  },

  flagEvent: async (eventId: string, request: FlagRequest) => {
    return axiosInstance.patch(`/admin/interaction-events/${eventId}/flag`, request);
  },

  unflagEvent: async (eventId: string) => {
    return axiosInstance.patch(`/admin/interaction-events/${eventId}/unflag`);
  }
};
