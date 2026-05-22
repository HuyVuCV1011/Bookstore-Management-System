import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api/analyticsApi';
import type { CatalogStatistics as CatalogStat } from '../../types/analytics';
import { AdminLayout } from '../../components/admin/AdminLayout';

export const CatalogStatistics: React.FC = () => {
  const [stats, setStats] = useState<CatalogStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await analyticsApi.getCatalogStatistics();
      setStats(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError('Không thể tải thống kê danh mục');
      console.error(err);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await analyticsApi.refreshMaterializedViews();
      await fetchData();
    } catch (err) {
      setError('Không thể làm mới dữ liệu');
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const overallStats = stats.find(s => s && s.categoryName === 'ALL_CATEGORIES');
  const categoryStats = stats.filter(s => s && s.categoryName && s.categoryName !== 'ALL_CATEGORIES');

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Thống Kê Danh Mục</h1>
            <p className="text-sm text-gray-500 mt-1">Phân tích toàn diện kho sách theo danh mục</p>
            {overallStats && (
              <p className="text-xs text-gray-400 mt-1">
                Cập nhật: {formatDate(overallStats.lastRefreshTime)}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            {refreshing ? 'Đang làm mới...' : 'Làm mới'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            ⚠ {error}
          </div>
        )}

        {/* Overall Summary */}
        {overallStats && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Tổng Quan</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-3xl font-bold">{formatNumber(overallStats.totalBooks)}</div>
                <div className="text-sm opacity-90 mt-1">Tổng Sách</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                <div className="text-3xl mb-2">✍️</div>
                <div className="text-3xl font-bold">{formatNumber(overallStats.totalAuthors)}</div>
                <div className="text-sm opacity-90 mt-1">Tác Giả</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-3xl font-bold">{formatNumber(overallStats.totalPublishers)}</div>
                <div className="text-sm opacity-90 mt-1">Nhà Xuất Bản</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-3xl font-bold">{formatNumber(overallStats.totalStock)}</div>
                <div className="text-sm opacity-90 mt-1">Tồn Kho</div>
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Khoảng Giá</h3>
                <span className="text-sm text-gray-500">
                  {formatCurrency(overallStats.minPrice)} - {formatCurrency(overallStats.maxPrice)}
                </span>
              </div>
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <div className="absolute left-1/2 -translate-x-1/2 -top-8 text-center">
                  <div className="text-sm font-bold text-primary">{formatCurrency(overallStats.averagePrice)}</div>
                  <div className="text-xs text-gray-500">Trung bình</div>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Trạng thái sách:</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Đang bán</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>Hết hàng</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Ngừng bán</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-green-500">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold">{formatNumber(overallStats.activeBooks)}</div>
                      <div className="text-sm text-gray-500">Đang Kinh Doanh</div>
                      <div className="text-xs text-gray-400 mt-1">Sách đang được bán</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-yellow-500">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold">{formatNumber(overallStats.outOfStockBooks)}</div>
                      <div className="text-sm text-gray-500">Hết Hàng</div>
                      <div className="text-xs text-gray-400 mt-1">Tạm thời hết hàng</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-red-500">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold">{formatNumber(overallStats.discontinuedBooks)}</div>
                      <div className="text-sm text-gray-500">Ngừng Kinh Doanh</div>
                      <div className="text-xs text-gray-400 mt-1">Không còn bán nữa</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Phân Tích Theo Danh Mục</h2>
          {categoryStats.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-xl font-bold mb-2">Chưa có dữ liệu</div>
              <div className="text-gray-500">Không có thống kê danh mục nào để hiển thị</div>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map((cat) => cat && (
              <div key={cat.categoryId || Math.random()} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold">{cat.categoryName || 'N/A'}</h3>
                  <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                    {formatNumber(cat.totalBooks || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Sách</div>
                    <div className="text-lg font-bold">{formatNumber(cat.totalBooks || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tồn kho</div>
                    <div className="text-lg font-bold">{formatNumber(cat.totalStock || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tác giả</div>
                    <div className="text-lg font-bold">{formatNumber(cat.totalAuthors || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">NXB</div>
                    <div className="text-lg font-bold">{formatNumber(cat.totalPublishers || 0)}</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3">
                  <div className="text-xs text-gray-500 mb-1">Giá trung bình</div>
                  <div className="text-xl font-bold text-primary">{formatCurrency(cat.averagePrice || 0)}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatCurrency(cat.minPrice || 0)} - {formatCurrency(cat.maxPrice || 0)}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Trạng thái kho:</div>
                  <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full" title="Đang bán"></span>
                      <span className="font-semibold">{cat.activeBooks || 0}</span>
                      <span className="text-gray-400">bán</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full" title="Hết hàng"></span>
                      <span className="font-semibold">{cat.outOfStockBooks || 0}</span>
                      <span className="text-gray-400">hết</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full" title="Ngừng bán"></span>
                      <span className="font-semibold">{cat.discontinuedBooks || 0}</span>
                      <span className="text-gray-400">ngừng</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
