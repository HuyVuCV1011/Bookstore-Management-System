import axiosInstance from '../../utils/axiosConfig';
import type { StockAdjustmentRequest } from '../../types/inventory';

export const inventoryApi = {
  getAllStock: (page: number, size: number, keyword?: string) => {
    const params: any = { page, size };
    if (keyword) params.keyword = keyword;
    return axiosInstance.get('/inventory/stock', { params });
  },

  getStockByBookId: (bookId: number) => {
    return axiosInstance.get(`/inventory/stock/${bookId}`);
  },

  adjustStock: (data: StockAdjustmentRequest) => {
    return axiosInstance.post('/inventory/adjust', data);
  },

  getTransactions: (page: number, size: number, filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }) => {
    const params: any = { page, size };
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.type) params.type = filters.type;
    return axiosInstance.get('/inventory/transactions', { params });
  },

  getTransactionsByBook: (bookId: number, page: number, size: number) => {
    return axiosInstance.get(`/inventory/transactions/book/${bookId}`, { params: { page, size } });
  },

  getLowStock: (threshold = 10, limit = 5) => {
    return axiosInstance.get('/inventory/low-stock', { params: { threshold, limit } });
  },
};
