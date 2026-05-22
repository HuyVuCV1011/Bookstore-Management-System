import axiosInstance from '../../utils/axiosConfig';

export interface DashboardStats {
  totalInventoryValue: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  todayTransactionsCount: number;
  todayRevenue: number;
  totalBooksInStock: number;
}

export const dashboardApi = {
  getStaffStats: () => {
    return axiosInstance.get<DashboardStats>('/dashboard/staff-stats');
  },
};
