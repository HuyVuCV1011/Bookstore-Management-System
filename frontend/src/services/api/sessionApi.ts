import axiosInstance from '../../utils/axiosConfig';
import type { SessionResponse, SessionStats, SessionFilters } from '../../types/session';

export const sessionApi = {
  getSessions: async (
    page: number = 0,
    size: number = 20,
    filters: SessionFilters = {}
  ) => {
    const params: any = { page, size };

    if (filters.email) params.email = filters.email;
    if (filters.userId) params.userId = filters.userId;
    if (filters.createdFrom) params.createdFrom = filters.createdFrom;
    if (filters.createdTo) params.createdTo = filters.createdTo;

    return axiosInstance.get<SessionResponse>('/admin/sessions', { params });
  },

  getStats: async (filters: SessionFilters = {}) => {
    const params: any = {};

    if (filters.email) params.email = filters.email;
    if (filters.userId) params.userId = filters.userId;
    if (filters.createdFrom) params.createdFrom = filters.createdFrom;
    if (filters.createdTo) params.createdTo = filters.createdTo;

    return axiosInstance.get<SessionStats>('/admin/sessions/stats', { params });
  },

  revokeSession: async (sessionId: string) => {
    return axiosInstance.patch(`/admin/sessions/${sessionId}/revoke`);
  }
};
