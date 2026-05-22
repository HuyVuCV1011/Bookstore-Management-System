import axiosInstance from '../../utils/axiosConfig';

interface CartItemRequest {
  bookId: number;
  quantity: number;
}

export const cartApi = {
  getCart: () => axiosInstance.get('/cart'),

  addItem: (item: CartItemRequest) =>
    axiosInstance.post<void>('/cart/add', item),

  updateItem: (item: CartItemRequest) =>
    axiosInstance.put<void>('/cart/update', item),

  removeItem: (bookId: number) =>
    axiosInstance.delete(`/cart/item/${bookId}`),

  clearCart: () => axiosInstance.delete('/cart'),
};
