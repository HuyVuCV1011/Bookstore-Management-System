import axiosInstance from '../../utils/axiosConfig';
import type { PageResponse } from '../../types/common';
import type { Order, OrderStats, OrderStatus } from '../../types/order';

export const orderApi = {
  getAll: (page = 0, size = 10, keyword = '', status?: OrderStatus | 'ALL') => {
    const params: Record<string, string | number> = { page, size };

    if (status && status !== 'ALL') {
      params.status = status;
    }

    if (keyword.trim()) {
      params.keyword = keyword.trim();
    }

    return axiosInstance.get<PageResponse<Order>>('/orders', { params });
  },

  getStats: () =>
    axiosInstance.get<OrderStats>('/orders/stats'),

  getById: (id: string) =>
    axiosInstance.get<Order>(`/orders/${id}`),

  syncGraph: () =>
    axiosInstance.post<{ syncedOrders: number }>('/orders/sync-graph'),
};
