// frontend/src/services/orderApi.ts
import axiosInstance from '../utils/axiosConfig';
import type { Order, OrderDetail, CreateOrderRequest, UpdateOrderStatusRequest, OrderStatus } from '../types/order';

const orderApi = {
  createOrder: async (request: CreateOrderRequest): Promise<OrderDetail> => {
    const response = await axiosInstance.post('/orders', request);
    return response.data;
  },

  getAllOrders: async (page: number = 0, size: number = 20): Promise<{ content: Order[], totalPages: number, totalElements: number }> => {
    const response = await axiosInstance.get('/orders', {
      params: { page, size }
    });
    return response.data;
  },

  getOrderById: async (id: string): Promise<OrderDetail> => {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, request: UpdateOrderStatusRequest): Promise<Order> => {
    const response = await axiosInstance.put(`/orders/${id}/status`, request);
    return response.data;
  },

  cancelOrder: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/orders/${id}`);
  },

  getOrdersByStatus: async (status: OrderStatus, page: number = 0, size: number = 20): Promise<{ content: Order[], totalPages: number }> => {
    const response = await axiosInstance.get(`/orders/status/${status}`, {
      params: { page, size }
    });
    return response.data;
  },

  payOrder: async (id: string, request: { paymentMethod: string, accountNumber?: string, cvv?: string, otp?: string, simulateFailure?: boolean }): Promise<OrderDetail> => {
    const response = await axiosInstance.post(`/orders/${id}/pay`, request);
    return response.data;
  }
};

export default orderApi;
