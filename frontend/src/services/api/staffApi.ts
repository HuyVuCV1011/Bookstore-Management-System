import axiosInstance from '../../utils/axiosConfig';
import type { WarehouseStaff, WarehouseStaffRequest } from '../../types/staff';
import type { PageResponse } from '../../types/common';

export const staffApi = {
  getAll: (page = 0, size = 20, keyword = '') =>
    axiosInstance.get<PageResponse<WarehouseStaff>>('/admin/warehouse-staff', {
      params: { page, size, keyword },
    }),

  getById: (id: string) =>
    axiosInstance.get<WarehouseStaff>(`/admin/warehouse-staff/${id}`),

  create: (data: WarehouseStaffRequest) =>
    axiosInstance.post<WarehouseStaff>('/admin/warehouse-staff', data),

  update: (id: string, data: Partial<WarehouseStaffRequest>) =>
    axiosInstance.put<WarehouseStaff>(`/admin/warehouse-staff/${id}`, data),

  delete: (id: string) =>
    axiosInstance.delete(`/admin/warehouse-staff/${id}`),
};
