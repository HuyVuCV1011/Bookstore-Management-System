import axiosInstance from '../../utils/axiosConfig';
import type { Category, CategoryRequest } from '../../types/category';
import type { PageResponse } from '../../types/common';

export const categoryApi = {
  getAll: (page = 0, size = 20, keyword = '') =>
    axiosInstance.get<PageResponse<Category>>('/categories', {
      params: { page, size, keyword },
    }),

  getById: (id: number) =>
    axiosInstance.get<Category>(`/categories/${id}`),

  create: (data: CategoryRequest) =>
    axiosInstance.post<Category>('/categories', data),

  update: (id: number, data: CategoryRequest) =>
    axiosInstance.put<Category>(`/categories/${id}`, data),

  delete: (id: number) =>
    axiosInstance.delete(`/categories/${id}`),
};
