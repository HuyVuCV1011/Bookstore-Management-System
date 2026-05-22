import axiosInstance from '../utils/axiosConfig';
import type { CdcStatus, CdcStats } from '../types/cdc';

export const cdcApi = {
  getStatus: async (): Promise<CdcStatus> => {
    const response = await axiosInstance.get('/admin/cdc/status');
    return response.data;
  },

  getStats: async (): Promise<CdcStats> => {
    const response = await axiosInstance.get('/admin/cdc/stats');
    return response.data;
  },

  syncBook: async (bookId: number): Promise<string> => {
    const response = await axiosInstance.post(`/admin/cdc/sync-book/${bookId}`);
    return response.data;
  },

  syncAllBooks: async (): Promise<string> => {
    const response = await axiosInstance.post('/admin/cdc/sync-all-books');
    return response.data;
  },

  checkConsistency: async (): Promise<CdcStats> => {
    const response = await axiosInstance.get('/admin/cdc/check-consistency');
    return response.data;
  },
};
