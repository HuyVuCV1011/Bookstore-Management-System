import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { dashboardApi, type DashboardStats } from '../../services/api/dashboardApi';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStaffStats()
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Failed to fetch dashboard stats:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Chào mừng trở lại, {user?.fullName || 'Admin'}!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Đây là những gì đang diễn ra với cửa hàng sách của bạn hôm nay.
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="app-loading-state">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : stats ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đơn chờ xử lý</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.pendingOrdersCount}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng sách trong kho</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalBooksInStock}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Giao dịch hôm nay</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.todayTransactionsCount}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh thu hôm nay</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.todayRevenue.toLocaleString('vi-VN')}₫</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="app-empty-state">Không thể tải thống kê</div>
        )}

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to="/admin/books"
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-primary hover:bg-gray-50"
            >
              <div className="rounded-full bg-primary/10 p-2">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Thêm sách mới</p>
                <p className="text-xs text-gray-600">Thêm vào danh mục</p>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-primary hover:bg-gray-50"
            >
              <div className="rounded-full bg-primary/10 p-2">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Thêm người dùng mới</p>
                <p className="text-xs text-gray-600">Tạo tài khoản</p>
              </div>
            </Link>

            <Link
              to="/orders"
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-primary hover:bg-gray-50"
            >
              <div className="rounded-full bg-primary/10 p-2">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Xem đơn hàng</p>
                <p className="text-xs text-gray-600">Quản lý đơn hàng</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Không có hoạt động gần đây để hiển thị</p>
            <p className="text-xs mt-1">Hoạt động sẽ xuất hiện ở đây khi người dùng tương tác với hệ thống</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
