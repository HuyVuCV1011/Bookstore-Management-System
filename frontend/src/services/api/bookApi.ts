import axiosInstance from '../../utils/axiosConfig';
import type { Book, BookRequest } from '../../types/book';
import type { PageResponse } from '../../types/common';

export const bookApi = {
  getAll: (page = 0, size = 20, keyword = '') =>
    axiosInstance.get<PageResponse<Book>>('/books', {
      params: { page, size, keyword },
    }),

  getById: (id: number) =>
    axiosInstance.get<Book>(`/books/${id}`),

  getByIsbn: (isbn: string) =>
    axiosInstance.get<Book>(`/books/isbn/${isbn}`),

  create: (data: BookRequest) =>
    axiosInstance.post<Book>('/books', data),

  update: (id: number, data: BookRequest) =>
    axiosInstance.put<Book>(`/books/${id}`, data),

  delete: (id: number) =>
    axiosInstance.delete(`/books/${id}`),
};
