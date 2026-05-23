import axiosInstance from '../../utils/axiosConfig';
import type { Customer, CustomerRequest } from '../../types/customer';
import type { PageResponse } from '../../types/common';

export const customerApi = {
  getAll: (page = 0, size = 20, keyword = '') =>
    axiosInstance.get<PageResponse<Customer>>('/customers', {
      params: { page, size, keyword },
    }),

  getOverview: (page = 0, size = 20, keyword = '') =>
    axiosInstance.get<PageResponse<any>>('/admin/customers/overview', {
      params: { page, size, keyword },
    }),

  getById: (id: string) =>
    axiosInstance.get<Customer>(`/customers/${id}`),

  create: (data: CustomerRequest) =>
    axiosInstance.post<Customer>('/customers', data),

  update: (id: string, data: CustomerRequest) =>
    axiosInstance.put<Customer>(`/customers/${id}`, data),

  toggleStatus: (id: string) =>
    axiosInstance.patch<Customer>(`/customers/${id}/toggle-status`),

  delete: (id: string) =>
    axiosInstance.delete(`/customers/${id}`),
};
