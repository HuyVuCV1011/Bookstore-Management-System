import React, { useState, useEffect } from 'react';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi, type DashboardStats } from '../../services/api/dashboardApi';
import orderApi from '../../services/orderApi';
import { purchaseOrderApi } from '../../services/api/purchaseOrderApi';
import type { Order } from '../../types/order';
import type { PurchaseOrder } from '../../types/purchaseOrder';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import POStatusBadge from '../../components/purchaseOrders/POStatusBadge';
import { inventoryApi } from '../../services/api/inventoryApi';

export const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recent activity tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'purchases'>('orders');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<PurchaseOrder[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Low stock
  const [lowStockBooks, setLowStockBooks] = useState<any[]>([]);
  const [loadingLowStock, setLoadingLowStock] = useState(false);

  const fetchLowStock = async () => {
    try {
      setLoadingLowStock(true);
      const response = await inventoryApi.getLowStock(10, 6);
      setLowStockBooks(response.data || []);
    } catch (err) {
      console.error('Failed to fetch low stock books', err);
    } finally {
      setLoadingLowStock(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getStaffStats();
        setStats(response.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats', err);
        setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchRecentActivity();
    fetchLowStock();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoadingActivity(true);

      // Fetch recent orders
      const ordersResponse = await orderApi.getAllOrders(0, 5);
      setRecentOrders(ordersResponse.content || []);

      // Fetch recent purchase orders
      const purchasesResponse = await purchaseOrderApi.getAll(0, 5);
      setRecentPurchases(purchasesResponse.data || purchasesResponse.content || []);
    } catch (err: any) {
      console.error('Failed to fetch recent activity', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await dashboardApi.getStaffStats();
      setStats(response.data);
      await fetchLowStock();
      await fetchRecentActivity();
    } catch (err: any) {
      console.error('Failed to refresh dashboard stats', err);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaffLayout>
      <div className="max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : '🔄 Làm mới'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Tổng giá trị kho</div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? '...' : `${(stats?.totalInventoryValue || 0).toLocaleString('vi-VN')} ₫`}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {loading ? '...' : `${stats?.totalBooksInStock || 0} sách trong kho`}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Sản phẩm sắp hết</div>
            <div className="text-3xl font-bold text-orange-600">
              {loading ? '...' : stats?.lowStockCount || 0}
            </div>
            <div className="text-xs text-gray-500 mt-2">Dưới 10 sản phẩm</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Đơn hàng chờ xử lý</div>
            <div className="text-3xl font-bold text-amber-600">
              {loading ? '...' : stats?.pendingOrdersCount || 0}
            </div>
            <div className="text-xs text-gray-500 mt-2">Cần xử lý</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Giao dịch hôm nay</div>
            <div className="text-3xl font-bold text-blue-600">
              {loading ? '...' : stats?.todayTransactionsCount || 0}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Doanh thu: {loading ? '...' : `${(stats?.todayRevenue || 0).toLocaleString('vi-VN')} ₫`}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/staff/purchase-orders"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="font-medium text-gray-900">Xem đơn hàng khách</div>
            </Link>

            <Link
              to="/staff/inventory"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📦</div>
              <div className="font-medium text-gray-900">Kiểm tra kho</div>
            </Link>

            <Link
              to="/staff/suppliers"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-3xl mb-2">🏢</div>
              <div className="font-medium text-gray-900">Quản lý nhà cung cấp</div>
            </Link>
          </div>
        </div>

        {/* Low Stock Alerts Widget */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-red-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-xl font-bold text-gray-900">Cảnh báo tồn kho thấp</h2>
            </div>
            <span className="text-xs bg-red-100 text-red-800 font-semibold px-2.5 py-0.5 rounded">
              Dưới 10 quyển
            </span>
          </div>

          {loadingLowStock ? (
            <div className="text-center text-gray-500 py-4">Đang tải...</div>
          ) : lowStockBooks.length === 0 ? (
            <div className="text-center text-green-600 font-medium py-4 bg-green-50 rounded-lg">
              ✅ Tất cả sách đều đạt lượng tồn kho an toàn!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockBooks.map((book) => {
                const suggestedQty = 30 - book.stockQuantity;
                return (
                  <div key={book.bookId || book.id} className="flex items-center justify-between p-4 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      {book.coverUrl && (
                        <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded shadow" />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{book.title}</h4>
                        <p className="text-xs text-gray-500 font-mono">ISBN: {book.isbn}</p>
                        <p className="text-xs mt-1 text-red-600 font-medium">Tồn kho: {book.stockQuantity} quyển</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/staff/purchase-orders/create?bookId=${book.bookId || book.id}&quantity=${suggestedQty}`)}
                      className="px-3 py-1.5 bg-[#006241] hover:bg-[#004d33] text-white text-xs font-bold rounded-lg transition"
                    >
                      🛒 Nhập sách ({suggestedQty})
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity with Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hoạt động gần đây</h2>

          {/* Tabs */}
          <div className="flex gap-4 mb-4 border-b">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🛒 Đơn hàng khách
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'purchases'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📚 Đơn nhập sách
            </button>
          </div>

          {/* Tab Content */}
          {loadingActivity ? (
            <div className="text-center text-gray-500 py-8">Đang tải...</div>
          ) : (
            <>
              {/* Customer Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  {recentOrders.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      Chưa có đơn hàng nào
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          onClick={() => navigate(`/staff/customer-orders`)}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {order.orderCode}
                            </div>
                            <div className="text-sm text-gray-600">
                              {order.customerName} • {order.customerEmail}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(order.orderedAt || order.createdAt || '').toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                {order.totalAmount.toLocaleString('vi-VN')} ₫
                              </div>
                              <div className="text-xs text-gray-500">
                                {order.itemCount || 0} sản phẩm
                              </div>
                            </div>
                            <OrderStatusBadge
                              status={order.orderStatus || order.status}
                              type="order"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="text-center pt-4">
                        <Link
                          to="/staff/customer-orders"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Xem tất cả đơn hàng →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Purchase Orders Tab */}
              {activeTab === 'purchases' && (
                <div>
                  {recentPurchases.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      Chưa có đơn nhập sách nào
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentPurchases.map((po) => (
                        <div
                          key={po.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          onClick={() => navigate(`/staff/purchase-orders/${po.id}`)}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {po.poNumber}
                            </div>
                            <div className="text-sm text-gray-600">
                              {po.supplierName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(po.orderDate || po.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-blue-600">
                                {po.totalAmount.toLocaleString('vi-VN')} ₫
                              </div>
                              <div className="text-xs text-gray-500">
                                {po.itemCount || 0} sản phẩm
                              </div>
                            </div>
                            <POStatusBadge status={po.status} />
                          </div>
                        </div>
                      ))}
                      <div className="text-center pt-4">
                        <Link
                          to="/staff/purchase-orders"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Xem tất cả đơn nhập sách →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </StaffLayout>
  );
};
