import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api/analyticsApi';
import type { InventoryReorderItem } from '../../types/analytics';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { DataTable } from '../../components/admin/DataTable';

export const InventoryReorderDashboard: React.FC = () => {
  const [items, setItems] = useState<InventoryReorderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedPriority]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const priority = selectedPriority === 'ALL' ? undefined : selectedPriority;
      const response = await analyticsApi.getInventoryReorder(priority);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError('Không thể tải dữ liệu đặt hàng lại');
      console.error(err);
      setItems([]);
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Khẩn cấp';
      case 'HIGH': return 'Cao';
      case 'MEDIUM': return 'Trung bình';
      case 'LOW': return 'Thấp';
      case 'LOW_PRIORITY': return 'Rất thấp';
      default: return priority;
    }
  };

  const urgentItems = items.filter(i => i.reorderPriority === 'URGENT');
  const highItems = items.filter(i => i.reorderPriority === 'HIGH');
  const totalReorderQty = items.reduce((sum, i) => sum + i.recommendedReorderQuantity, 0);

  const columns = [
    {
      key: 'priority',
      label: 'Mức độ ưu tiên',
      render: (item: InventoryReorderItem) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(item.reorderPriority)}`}>
          {getPriorityText(item.reorderPriority)}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Thông tin sách',
      render: (item: InventoryReorderItem) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{item.title}</div>
          <div className="text-xs text-gray-500 dark:text-text-primary-dark/60">{item.authorName} • {item.categoryName}</div>
          <div className="text-xs text-gray-400 dark:text-text-primary-dark/50">ISBN: {item.isbn}</div>
        </div>
      ),
    },
    {
      key: 'currentStock',
      label: 'Tồn kho hiện tại',
      render: (item: InventoryReorderItem) => (
        <div>
          <span className={`font-bold ${item.currentStock === 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
            {formatNumber(item.currentStock)}
          </span>
          {item.currentStock === 0 && <div className="text-xs text-red-600 font-normal">⚠️ HẾT HÀNG</div>}
          {item.currentStock > 0 && <div className="text-xs text-gray-400 dark:text-text-primary-dark/50">cuốn</div>}
        </div>
      ),
    },
    {
      key: 'velocity',
      label: 'Tốc độ bán (30 ngày)',
      render: (item: InventoryReorderItem) => (
        <div>
          <div className="font-bold text-primary dark:text-[#d4e9e2]">{item.avgDailySales.toFixed(1)} cuốn/ngày</div>
          <div className="text-xs text-gray-500 dark:text-text-primary-dark/60">📊 Tổng: {formatNumber(item.totalSoldLast30Days)} cuốn</div>
        </div>
      ),
    },
    {
      key: 'daysRemaining',
      label: 'Đủ bán trong',
      render: (item: InventoryReorderItem) => {
        const days = item.daysOfStockRemaining;
        const color = days <= 7 ? 'text-red-600' : days <= 14 ? 'text-orange-600' : 'text-gray-900 dark:text-white';
        return (
          <div>
            <div className={`font-bold ${color}`}>
              {days >= 999 ? '∞' : Math.floor(days)}
            </div>
            <div className="text-xs font-normal text-gray-500 dark:text-text-primary-dark/60">
              {days >= 999 ? 'không giới hạn' : 'ngày'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'recommendedReorderQuantity',
      label: 'Đề xuất đặt hàng',
      render: (item: InventoryReorderItem) => (
        <div>
          <span className={`font-bold ${item.recommendedReorderQuantity > 0 ? 'text-green-600 dark:text-[#d4e9e2]' : 'text-gray-400 dark:text-text-primary-dark/50'}`}>
            {item.recommendedReorderQuantity > 0 ? formatNumber(item.recommendedReorderQuantity) : '—'}
          </span>
          {item.recommendedReorderQuantity > 0 && <div className="text-xs text-gray-400 dark:text-text-primary-dark/50">cuốn</div>}
        </div>
      ),
    },
    {
      key: 'pendingPurchaseQuantity',
      label: 'Đang đặt hàng',
      render: (item: InventoryReorderItem) => (
        <div>
          <span className={item.pendingPurchaseQuantity > 0 ? 'font-semibold text-blue-600 dark:text-blue-300' : 'text-gray-400 dark:text-text-primary-dark/50'}>
            {item.pendingPurchaseQuantity > 0 ? formatNumber(item.pendingPurchaseQuantity) : '—'}
          </span>
          {item.pendingPurchaseQuantity > 0 && <div className="text-xs text-gray-400 dark:text-text-primary-dark/50">cuốn</div>}
        </div>
      ),
    },
    {
      key: 'lastSaleDate',
      label: 'Bán lần cuối',
      render: (item: InventoryReorderItem) => (
        <span className="text-sm text-gray-600 dark:text-text-primary-dark/70">{formatDate(item.lastSaleDate)}</span>
      ),
    },
  ];

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Cảnh Báo Đặt Hàng Lại</h1>
            <p className="text-sm text-gray-500 dark:text-text-primary-dark/60 mt-1">Theo dõi tồn kho và tốc độ bán hàng 30 ngày qua</p>
            {items.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-text-primary-dark/50 mt-1">
                Cập nhật: {formatDate(items[0].lastRefreshTime)}
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

        {/* Alert Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Hướng dẫn sử dụng:</div>
              <div className="text-sm text-blue-700 dark:text-blue-200">
                Hệ thống tự động tính toán dựa trên tốc độ bán hàng 30 ngày qua.
                <span className="font-semibold"> Khẩn cấp</span> = hết hàng hoặc còn dưới 7 ngày,
                <span className="font-semibold"> Cao</span> = 7-14 ngày,
                <span className="font-semibold"> Trung bình</span> = 14-30 ngày.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-2">🚨</div>
            <div className="text-3xl font-bold">{urgentItems.length}</div>
            <div className="text-sm opacity-90 mt-1">Mặt hàng khẩn cấp</div>
            <div className="text-xs opacity-75 mt-1">⚠️ Cần đặt hàng ngay hôm nay</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-3xl font-bold">{highItems.length}</div>
            <div className="text-sm opacity-90 mt-1">Ưu tiên cao</div>
            <div className="text-xs opacity-75 mt-1">📅 Đặt hàng trong tuần này</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-3xl font-bold">{formatNumber(totalReorderQty)}</div>
            <div className="text-sm opacity-90 mt-1">Tổng số cần đặt</div>
            <div className="text-xs opacity-75 mt-1">🔢 Đơn vị sản phẩm được đề xuất</div>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <label className="block text-sm font-medium mb-3 text-text-primary-light dark:text-text-primary-dark">Lọc theo mức độ ưu tiên</label>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(priority => (
              <button
                key={priority}
                onClick={() => setSelectedPriority(priority)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPriority === priority
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-text-primary-light dark:text-text-primary-dark'
                }`}
              >
                {priority === 'ALL' ? 'Tất cả' : getPriorityText(priority)}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
        />

        {items.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4 text-[#00754A] dark:text-[#d4e9e2]">✓</div>
            <div className="text-2xl font-bold mb-2 text-text-primary-light dark:text-text-primary-dark">Tất cả đều ổn!</div>
            <div className="text-gray-500 dark:text-text-primary-dark/60">Không có sản phẩm nào cần đặt hàng lại ở mức độ này</div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
};
