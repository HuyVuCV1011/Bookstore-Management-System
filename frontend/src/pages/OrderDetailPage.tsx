// frontend/src/pages/OrderDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderApi from '../services/orderApi';
import type { OrderDetail } from '../types/order';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/common/Toast';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { formatPaymentMethod } from '../utils/formatters';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { toasts, success, error, removeToast } = useToast();

  useEffect(() => {
    if (id) {
      fetchOrderDetail(id);
    }
  }, [id]);

  const fetchOrderDetail = async (orderId: string) => {
    try {
      const data = await orderApi.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Failed to fetch order', err);
      error('Không thể tải thông tin đơn hàng');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.'
    );

    if (!confirmed) return;

    setCancelling(true);
    try {
      await orderApi.cancelOrder(order.id);
      success('Hủy đơn hàng thành công');
      fetchOrderDetail(order.id);
    } catch (err: any) {
      error(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  const Layout = (user?.role === 'ADMIN' || user?.role === 'STAFF') ? AdminLayout : AppLayout;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return null;
  }

  const orderStatus = order.status || order.orderStatus;
  const canCancelOrder = orderStatus === 'PENDING' || orderStatus === 'CONFIRMED' || orderStatus === 'PROCESSING';
  const canPayOrder = (order.paymentStatus === 'PENDING' || order.paymentStatus === 'UNPAID') && order.paymentMethod !== 'CASH' && orderStatus !== 'CANCELLED';

  return (
    <Layout>
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="page-stack">
        {/* Page Header */}
        <div className="app-card-muted app-card-pad flex justify-between items-center">
          <div>
            <h1 className="page-title">Chi tiết đơn hàng</h1>
            <p className="page-subtitle">
              {order.orderCode || `Đơn hàng #${order.id.substring(0, 8)}`}
            </p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="btn-secondary h-10 px-4 text-sm"
          >
            ← Quay lại
          </button>
        </div>

      {/* Order Info Card */}
      <div className="app-card app-card-pad">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <p className="text-[15px] text-gray-600 mb-1">
              Đặt ngày {new Date(order.orderedAt || order.createdAt || new Date().toISOString()).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Trạng thái</span>
              <OrderStatusBadge status={orderStatus} type="order" />
            </div>
            {order.paymentStatus && (
              <div>
                <span className="text-xs text-gray-500 block mb-1">Thanh toán</span>
                <OrderStatusBadge status={order.paymentStatus} type="payment" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="app-card app-card-pad">
            <h3 className="section-title mb-4">Sản phẩm đã đặt</h3>
            <div className="space-y-2">
              {order.items && order.items.length > 0 ? order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 items-center p-3 bg-bg-light rounded-card hover:bg-gray-100 transition"
                >
                  {item.coverUrl && (
                    <img
                      src={item.coverUrl}
                      alt={item.title || item.bookTitle}
                      className="w-14 h-18 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-semibold text-gray-900">
                      {item.title || item.bookTitle}
                    </h4>
                    {item.authorName && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {item.authorName}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {item.unitPrice.toLocaleString('vi-VN')}₫ × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[15px]">
                      {item.lineTotal.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-600 py-4">Không có sản phẩm</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <div className="flex justify-between text-[15px] text-gray-600">
                <span>Tạm tính</span>
                <span>{order.subtotalAmount.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-[15px] text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{order.shippingFee.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Tổng cộng</span>
                <span className="price-tag">{order.totalAmount.toLocaleString('vi-VN')}<span className="text-sm font-normal">₫</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Shipping Information */}
          <div className="app-card app-card-pad">
            <h3 className="section-title mb-4">Thông tin giao hàng</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Địa chỉ</p>
                <p className="text-[15px]">{order.shippingAddress}</p>
              </div>
              {order.phoneNumber && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Số điện thoại</p>
                  <p className="text-[15px]">{order.phoneNumber}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Phương thức thanh toán</p>
                <p className="text-[15px]">{formatPaymentMethod(order.paymentMethod)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {(canCancelOrder || canPayOrder) && (
            <div className="app-card app-card-pad space-y-3">
              <h3 className="section-title mb-4">Hành động</h3>
              {canPayOrder && (
                <button
                  onClick={() => navigate(`/checkout/pay/${order.id}`)}
                  className="w-full px-4 py-2.5 bg-[#006241] hover:bg-[#004d33] text-white rounded-button font-semibold text-[15px] transition flex items-center justify-center gap-2"
                >
                  💳 Thanh toán ngay
                </button>
              )}
              {canCancelOrder && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-button font-semibold text-[15px] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Đang hủy...
                    </>
                  ) : (
                    <>
                      Hủy đơn hàng
                    </>
                  )}
                </button>
              )}
              <p className="text-xs text-gray-500 mt-2 text-center">
                {canPayOrder && 'Thanh toán trực tuyến bằng thẻ, chuyển khoản QR hoặc MoMo.'}
                {canCancelOrder && !canPayOrder && 'Chỉ có thể hủy đơn hàng đang chờ xử lý hoặc đã xác nhận'}
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;
