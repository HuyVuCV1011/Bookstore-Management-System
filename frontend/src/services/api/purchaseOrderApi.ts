import axiosInstance from '../../utils/axiosConfig';
import type {
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  ReceiveGoodsRequest,
  PurchaseOrder,
  PurchaseOrderDetail,
  PageResponse,
  PurchaseOrderStatus
} from '../../types/purchaseOrder';

export const purchaseOrderApi = {
  // List with filtering
  getAll: async (
    page: number = 0,
    size: number = 10,
    status?: PurchaseOrderStatus,
    supplierId?: number,
    keyword?: string
  ): Promise<PageResponse<PurchaseOrder>> => {
    const params: any = { page, size };
    if (status) params.status = status;
    if (supplierId) params.supplierId = supplierId;
    if (keyword) params.keyword = keyword;

    const response = await axiosInstance.get('/purchase-orders', { params });
    return response.data;
  },

  // Get by ID with full details
  getById: async (id: number): Promise<PurchaseOrderDetail> => {
    const response = await axiosInstance.get(`/purchase-orders/${id}`);
    return response.data;
  },

  // Create new PO
  create: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await axiosInstance.post('/purchase-orders', data);
    return response.data;
  },

  // Update PO (DRAFT only)
  update: async (id: number, data: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await axiosInstance.put(`/purchase-orders/${id}`, data);
    return response.data;
  },

  // Delete PO (DRAFT only)
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/purchase-orders/${id}`);
  },

  // Submit PO (DRAFT -> SUBMITTED)
  submit: async (id: number): Promise<PurchaseOrder> => {
    const response = await axiosInstance.post(`/purchase-orders/${id}/submit`);
    return response.data;
  },

  // Receive goods (SUBMITTED/RECEIVING -> RECEIVING/COMPLETED)
  receiveGoods: async (id: number, data: ReceiveGoodsRequest): Promise<PurchaseOrder> => {
    const response = await axiosInstance.post(`/purchase-orders/${id}/receive`, data);
    return response.data;
  },

  // Cancel PO
  cancel: async (id: number): Promise<PurchaseOrder> => {
    const response = await axiosInstance.post(`/purchase-orders/${id}/cancel`);
    return response.data;
  },
};

export default purchaseOrderApi;
