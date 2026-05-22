import axiosInstance from '../../utils/axiosConfig';
import type { Author, AuthorRequest } from '../../types/author';
import type { PageResponse } from '../../types/common';

export const authorApi = {
  getAll: (page = 0, size = 20, keyword = '') =>
    axiosInstance.get<PageResponse<Author>>('/authors', {
      params: { page, size, keyword },
    }),

  getById: (id: number) =>
    axiosInstance.get<Author>(`/authors/${id}`),

  create: (data: AuthorRequest) =>
    axiosInstance.post<Author>('/authors', data),

  update: (id: number, data: AuthorRequest) =>
    axiosInstance.put<Author>(`/authors/${id}`, data),

  delete: (id: number) =>
    axiosInstance.delete(`/authors/${id}`),
};
