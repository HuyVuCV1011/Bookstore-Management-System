// frontend/src/pages/OrderHistoryPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import orderApi from '../services/orderApi';
import type { Order } from '../types/order';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/common/Toast';

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toasts, error, removeToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderApi.getAllOrders(0, 20);
      setOrders(response.content);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-light via-gray-50 to-blue-50 dark:from-bg-dark dark:via-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary dark:text-text-primary-dark/60">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-gray-50 to-blue-50 dark:from-bg-dark dark:via-gray-900 dark:to-blue-900">
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              📦 Lịch sử đơn hàng
            </h1>
            <button
              onClick={() => navigate('/books')}
              className="btn-secondary h-10 px-4 text-sm"
            >
              ← Quay lại cửa hàng
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 animate-fadeIn">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                Chưa có đơn hàng nào
              </h2>
              <p className="text-text-secondary dark:text-text-primary-dark/60 mb-6">
                Bạn chưa đặt đơn hàng nào. Bắt đầu mua sắm để xem lịch sử đơn hàng tại đây.
              </p>
              <button
                onClick={() => navigate('/books')}
                className="btn-primary inline-flex h-10 items-center justify-center px-6 text-sm"
              >
                Bắt đầu mua sắm
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-6xl mx-auto">
            {orders.map((order, index) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] overflow-hidden animate-slideUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                          {order.orderCode || `Đơn hàng #${order.id.substring(0, 8)}`}
                        </h3>
                        <OrderStatusBadge status={order.status || order.orderStatus} type="order" />
                      </div>
                      <p className="text-sm text-text-secondary dark:text-text-primary-dark/60">
                        📅 {new Date(order.orderedAt || order.createdAt || '').toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-text-secondary dark:text-text-primary-dark/60 mt-1">
                        📍 {order.shippingAddress}
                      </p>
                    </div>

                    {/* Total Amount */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-text-secondary dark:text-text-primary-dark/60">Tổng tiền</p>
                        <p className="text-2xl font-bold text-primary dark:text-[#d4e9e2]">
                          {order.totalAmount.toLocaleString('vi-VN')} đ
                        </p>
                      </div>

                      {/* View Details Button */}
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="btn-primary inline-flex h-10 items-center justify-center px-6 text-sm gap-2"
                      >
                        Xem chi tiết
                        <span className="text-lg">→</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.itemCount && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 border-t dark:border-gray-700">
                    <p className="text-sm text-text-secondary dark:text-text-primary-dark/60">
                      📚 {order.itemCount} sản phẩm trong đơn hàng này
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
