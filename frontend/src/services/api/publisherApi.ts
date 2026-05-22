import axiosInstance from '../../utils/axiosConfig';
import type { Publisher, PublisherRequest } from '../../types/publisher';
import type { PageResponse } from '../../types/common';

export const publisherApi = {
  getAll: (page = 0, size = 20, keyword = '') =>
    axiosInstance.get<PageResponse<Publisher>>('/publishers', {
      params: { page, size, keyword },
    }),

  getById: (id: number) =>
    axiosInstance.get<Publisher>(`/publishers/${id}`),

  create: (data: PublisherRequest) =>
    axiosInstance.post<Publisher>('/publishers', data),

  update: (id: number, data: PublisherRequest) =>
    axiosInstance.put<Publisher>(`/publishers/${id}`, data),

  delete: (id: number) =>
    axiosInstance.delete(`/publishers/${id}`),
};
