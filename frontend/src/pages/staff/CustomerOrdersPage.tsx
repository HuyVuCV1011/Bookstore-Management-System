import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import orderApi from '../../services/orderApi';
import type { Order, OrderStatus } from '../../types/order';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';

export const CustomerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = statusFilter
        ? await orderApi.getOrdersByStatus(statusFilter as any, page, 20)
        : await orderApi.getAllOrders(page, 20);
      setOrders(response.content);
      setTotalPages(response.totalPages);
      setError('');
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleViewOrder = (order: Order) => {
    navigate(`/orders/${order.id}`);
  };

  const handleUpdateStatus = (order: Order, status: OrderStatus) => {
    setSelectedOrder(order);
    setNewStatus(status);
    setShowStatusDialog(true);
  };

  const executeUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    setUpdatingOrderId(selectedOrder.id);
    try {
      await orderApi.updateOrderStatus(selectedOrder.id, { orderStatus: newStatus });
      setSuccessMessage(`Đã cập nhật trạng thái đơn hàng #${selectedOrder.id} thành công!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchOrders();
      setShowStatusDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng');
      setShowStatusDialog(false);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Chờ xử lý',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý',
      SHIPPED: 'Đã gửi hàng',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case 'PENDING':
        return ['CONFIRMED', 'CANCELLED'];
      case 'CONFIRMED':
        return ['PROCESSING', 'CANCELLED'];
      case 'PROCESSING':
        return ['SHIPPED', 'CANCELLED'];
      case 'SHIPPED':
        return ['COMPLETED'];
      case 'COMPLETED':
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'id',
      label: 'Mã đơn',
      render: (order: Order) => <span className="font-mono font-bold">#{order.id}</span>,
    },
    {
      key: 'customerName',
      label: 'Khách hàng',
      render: (order: Order) => (
        <div>
          <div className="font-semibold">{order.customerName || 'N/A'}</div>
          <div className="text-xs text-gray-500">{order.customerEmail}</div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Ngày đặt',
      render: (order: Order) => formatDate(order.createdAt || order.orderedAt),
    },
    {
      key: 'totalAmount',
      label: 'Tổng tiền',
      render: (order: Order) => (
        <span className="font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
      ),
    },
    {
      key: 'orderStatus',
      label: 'Trạng thái đơn',
      render: (order: Order) => {
        const status = order.orderStatus || order.status;
        return status ? <OrderStatusBadge status={status} type="order" /> : <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'paymentStatus',
      label: 'Thanh toán',
      render: (order: Order) => {
        return order.paymentStatus ? (
          <OrderStatusBadge status={order.paymentStatus} type="payment" />
        ) : (
          <span className="text-gray-400">Chưa có</span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (order: Order) => {
        const orderStatus = order.orderStatus || order.status;
        const nextStatuses = getNextStatuses(orderStatus);
        const isUpdating = updatingOrderId === order.id;

        return (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleViewOrder(order)}
              className="text-blue-600 hover:text-blue-800 font-medium text-left"
            >
              Xem chi tiết →
            </button>
            {nextStatuses.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(order, status)}
                    disabled={isUpdating}
                    className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                      status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    → {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'SHIPPED', label: 'Đã gửi hàng' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <StaffLayout>
      <div className="max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-sm text-gray-500 mt-1">Xem và quản lý đơn hàng của khách hàng</p>
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span className="text-lg">↻</span>
            Làm mới
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
            ✓ {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
            ⚠ {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Status Filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  statusFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <DataTable columns={columns} data={orders} loading={loading} />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}

          {/* Empty State */}
          {!loading && orders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl text-gray-600 mb-2">Không có đơn hàng nào</p>
              <p className="text-sm text-gray-400">
                {statusFilter ? 'Thử lọc theo trạng thái khác' : 'Chưa có đơn hàng nào trong hệ thống'}
              </p>
            </div>
          )}
        </div>

        {/* Status Update Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showStatusDialog}
          title="Cập nhật trạng thái đơn hàng"
          message={`Bạn có chắc chắn muốn chuyển đơn hàng #${selectedOrder?.id} sang trạng thái "${newStatus ? getStatusLabel(newStatus) : ''}"?`}
          onConfirm={executeUpdateStatus}
          onClose={() => setShowStatusDialog(false)}
          confirmText="Xác nhận"
          confirmVariant="success"
        />
      </div>
    </StaffLayout>
  );
};

export default CustomerOrdersPage;
