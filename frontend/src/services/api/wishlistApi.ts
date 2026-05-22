import axiosInstance from '../../utils/axiosConfig';
import type { Wishlist } from '../../types';

export const wishlistApi = {
  getWishlist: () =>
    axiosInstance.get<Wishlist>('/wishlist'),

  addItem: (bookId: number) =>
    axiosInstance.post<void>(`/wishlist/add/${bookId}`),

  removeItem: (bookId: number) =>
    axiosInstance.delete(`/wishlist/remove/${bookId}`),

  checkItem: (bookId: number) =>
    axiosInstance.get<boolean>(`/wishlist/check/${bookId}`),
};
