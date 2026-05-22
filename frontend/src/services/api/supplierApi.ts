import axiosInstance from '../../utils/axiosConfig';
import type { SupplierRequest } from '../../types/supplier';

export const supplierApi = {
  getAll: (page: number, size: number, keyword?: string) => {
    const params: any = { page, size };
    if (keyword) params.keyword = keyword;
    return axiosInstance.get('/suppliers', { params });
  },

  getById: (id: number) => {
    return axiosInstance.get(`/suppliers/${id}`);
  },

  getActive: () => {
    return axiosInstance.get('/suppliers/active');
  },

  create: (data: SupplierRequest) => {
    return axiosInstance.post('/suppliers', data);
  },

  update: (id: number, data: SupplierRequest) => {
    return axiosInstance.put(`/suppliers/${id}`, data);
  },

  updateStatus: (id: number, status: 'ACTIVE' | 'INACTIVE') => {
    return axiosInstance.patch(`/suppliers/${id}/status`, null, { params: { status } });
  },

  delete: (id: number) => {
    return axiosInstance.delete(`/suppliers/${id}`);
  },
};
