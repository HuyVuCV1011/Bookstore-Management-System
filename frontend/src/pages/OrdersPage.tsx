import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AdminLayout } from '../components/admin/AdminLayout';
import { BookCover } from '../components/common/BookCover';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../services/api/orderApi';
import type { Order, OrderStats, OrderStatus } from '../types/order';
import { formatPaymentMethod, formatMoney, formatDate } from '../utils/formatters';

const STATUS_OPTIONS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

type OrderViewMode = 'cards' | 'table';

const bookDetailPath = (isbn: string) => `/books/${encodeURIComponent(isbn)}`;

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<OrderViewMode>('cards');

  const isManager = user?.role === 'ADMIN' || user?.role === 'STAFF';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      orderApi.getAll(page, 10, keyword, status),
      orderApi.getStats(),
    ])
      .then(([ordersRes, statsRes]) => {
        if (!active) return;
        setOrders(ordersRes.data.content);
        setTotalPages(ordersRes.data.totalPages);
        setTotalElements(ordersRes.data.totalElements);
        setStats(statsRes.data);
      })
      .catch(() => {
        if (active) setError('Could not load order history.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, keyword, status]);

  const pageTitle = isManager ? 'Quản lý đơn hàng' : 'Lịch sử đơn hàng';
  const subtitle = isManager
    ? 'Xem lại các đơn hàng của khách hàng và hoạt động mua sách.'
    : 'Xem lịch sử mua hàng của bạn và các cuốn sách được sử dụng cho đề xuất.';

  const statsCards = useMemo(() => {
    const revenueLabel = isManager ? 'Tổng doanh thu' : 'Tổng chi tiêu';
    return [
      { label: 'Tổng đơn hàng', value: String(stats?.totalOrders ?? 0) },
      { label: 'Hoàn thành', value: String(stats?.completedOrders ?? 0) },
      { label: revenueLabel, value: formatMoney(stats?.totalRevenue ?? 0) },
      { label: 'Sách đã mua', value: String(stats?.totalItems ?? 0) },
    ];
  }, [stats, isManager]);

  const Layout = (user?.role === 'ADMIN' || user?.role === 'STAFF') ? AdminLayout : AppLayout;

  return (
    <Layout>
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          {isManager && (
            <button
              onClick={() => orderApi.syncGraph().then(() => {
                setPage(0);
                return orderApi.getAll(0, 10, keyword, status).then((res) => setOrders(res.data.content));
              })}
              className="btn-buy inline-flex h-10 items-center justify-center px-4 text-sm"
            >
              Đồng bộ hoạt động
            </button>
          )}
        </div>

        <section className="stats-grid">
          {statsCards.map((card) => (
            <div key={card.label} className="stat-card">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="toolbar-card">
          <div className="toolbar-content">
            <div>
              <h2 className="section-title">Danh sách đơn hàng</h2>
              <p className="section-subtitle">
                {isManager ? 'Tìm kiếm theo khách hàng, mã đơn hàng, ISBN hoặc tên sách.' : 'Tìm kiếm đơn hàng của bạn theo mã, ISBN hoặc tên sách.'}
              </p>
            </div>
            <div className="toolbar-controls">
              <div className="app-search-field flex-1">
                <svg className="app-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={keyword}
                  onChange={(e) => {
                    setPage(0);
                    setKeyword(e.target.value);
                  }}
                  placeholder="Tìm kiếm đơn hàng..."
                  className="app-search-input"
                />
              </div>
              <select
                value={status}
                onChange={(e) => {
                  setPage(0);
                  setStatus(e.target.value as OrderStatus | 'ALL');
                }}
                className="app-select sm:w-32"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error && (
          <div className="app-alert-error">{error}</div>
        )}

        {isManager && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`app-tab app-tab-sm ${viewMode === 'cards' ? 'app-tab-active' : ''}`}
            >
              Thẻ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`app-tab app-tab-sm ${viewMode === 'table' ? 'app-tab-active' : ''}`}
            >
              Bảng
            </button>
          </div>
        )}

        {loading ? (
          <div className="app-empty-state">
            Đang tải đơn hàng...
          </div>
        ) : orders.length === 0 ? (
          <div className="app-empty-state">
            <p className="text-sm font-semibold text-gray-800">Không tìm thấy đơn hàng</p>
            <p className="mt-1 text-sm text-gray-500">Thử tìm kiếm khác hoặc bộ lọc trạng thái khác.</p>
          </div>
        ) : (
          isManager && viewMode === 'table'
            ? <OrderTable orders={orders} />
            : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} isManager={isManager} />
                ))}
              </div>
            )
        )}

        {totalPages > 1 && (
          <div className="pagination-card">
            <p className="text-sm text-gray-500">
              Hiển thị {orders.length} / {totalElements} đơn hàng
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                className="rounded-button border border-border bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trước
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-button border border-border bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
const OrderCard: React.FC<{ order: Order; isManager: boolean }> = ({ order, isManager }) => (
  <article className="order-card">
    <div className="order-card-header">
      <div className="min-w-0">
        <div className="order-code-row">
          <h3 className="order-code">{order.orderCode}</h3>
          <StatusBadge status={order.status} />
        </div>
        <div className="order-info-grid">
          <OrderInfo label="Ngày" value={formatDate(order.orderedAt)} className="order-info-date" />
          {isManager
            ? <OrderInfo label="Khách hàng" value={`${order.customerName} (${order.customerEmail})`} className="order-info-customer" />
            : <OrderInfo label="Thanh toán" value={formatPaymentMethod(order.paymentMethod)} className="order-info-customer" />
          }
          <OrderInfo label="Sản phẩm" value={`${order.itemCount} sách`} className="order-info-items" />
          <OrderInfo label="Giao đến" value={order.shippingAddress} className="order-info-ship" />
          {isManager && <OrderInfo label="Thanh toán" value={formatPaymentMethod(order.paymentMethod)} className="order-info-payment" />}
        </div>
      </div>
      <div className="order-total-box">
        <p className="order-info-label">Tổng</p>
        <p className="order-total-value">{formatMoney(order.totalAmount)}</p>
      </div>
    </div>

    <div className="order-card-body">
      <div className="order-items-list">
        {order.items && order.items.length > 0 ? order.items.map((item) => (
          <div key={item.id} className="order-item-row">
            <Link
              to={bookDetailPath(item.isbn)}
              className="order-cover-frame transition hover:border-primary"
              aria-label={`Open details for ${item.title}`}
            >
              <BookCover
                title={item.title}
                isbn={item.isbn}
                coverUrl={item.coverUrl}
                subtitle={item.categoryName}
                className="h-full w-full object-cover"
              />
            </Link>
            <div className="order-item-main">
              <Link to={bookDetailPath(item.isbn)} className="order-item-title order-item-title-link">
                {item.title}
              </Link>
              <p className="order-item-author">{item.authorName || 'Tác giả không rõ'}</p>
              <p className="order-item-isbn">ISBN: {item.isbn}</p>
              {item.categoryName && (
                <span className="order-item-category">
                  {item.categoryName}
                </span>
              )}
            </div>
            <div className="order-item-pricing">
              <p className="text-sm font-semibold text-gray-800">x{item.quantity}</p>
              <p className="text-sm text-gray-500">{formatMoney(item.unitPrice)}</p>
              <p className="mt-1 text-sm font-bold text-gray-900">{formatMoney(item.lineTotal)}</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-4 text-sm text-gray-500">
            {order.itemCount} sản phẩm trong đơn hàng này
          </div>
        )}
      </div>

      <div className="order-summary-panel">
        <div className="order-summary-content">
          <MoneyRow label="Tạm tính" value={order.subtotalAmount} />
          <MoneyRow label="Phí vận chuyển" value={order.shippingFee} />
          <div className="money-row-divider">
            <MoneyRow label="Tổng cộng" value={order.totalAmount} strong />
          </div>
        </div>
      </div>
    </div>
  </article>
);

const OrderInfo: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
  <div className={className}>
    <p className="order-info-label">{label}</p>
    <p className="order-info-value">{value}</p>
  </div>
);

const MoneyRow: React.FC<{ label: string; value: number; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`money-row ${strong ? 'money-row-strong' : ''}`}>
    <span className="money-label">{label}</span>
    <span className="money-value">
      {formatMoney(value)}
    </span>
  </div>
);

const OrderTable: React.FC<{ orders: Order[] }> = ({ orders }) => (
  <div className="app-card">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px]">
        <thead className="border-b border-border bg-bg-light">
          <tr>
            <th className="table-th text-left">ĐƠN HÀNG</th>
            <th className="table-th text-left">KHÁCH HÀNG</th>
            <th className="table-th text-left">NGÀY</th>
            <th className="table-th text-left">SẢN PHẨM</th>
            <th className="table-th text-left">TRẠNG THÁI</th>
            <th className="table-th text-left">THANH TOÁN</th>
            <th className="table-th text-right">VẬN CHUYỂN</th>
            <th className="table-th text-right">TỔNG</th>
            <th className="table-th text-left">GIAO ĐẾN</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white">
          {orders.map((order) => (
            <tr key={order.id} className="transition hover:bg-bg-light">
              <td className="px-5 py-4 align-top">
                <p className="font-bold text-gray-900">{order.orderCode}</p>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  {order.itemCount} sách
                </p>
              </td>
              <td className="px-5 py-4 align-top">
                <p className="font-semibold text-gray-800">{order.customerName}</p>
                <p className="mt-1 text-xs font-medium text-gray-500">{order.customerEmail}</p>
              </td>
              <td className="px-5 py-4 align-top text-sm font-medium text-gray-600">
                {formatDate(order.orderedAt)}
              </td>
              <td className="px-5 py-4 align-top">
                <div className="max-w-sm space-y-1.5">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="text-sm text-gray-800">
                      <p className="font-semibold leading-snug">
                        {item.quantity}x{' '}
                        <Link to={bookDetailPath(item.isbn)} className="order-item-title-link">
                          {item.title}
                        </Link>
                      </p>
                      <p className="text-xs font-medium text-gray-500">
                        ISBN: {item.isbn}
                      </p>
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-5 py-4 align-top">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-5 py-4 align-top text-sm font-semibold text-gray-700">
                {formatPaymentMethod(order.paymentMethod)}
              </td>
              <td className="px-5 py-4 align-top text-right">
                <p className="text-sm font-bold text-gray-900">{formatMoney(order.shippingFee)}</p>
              </td>
              <td className="px-5 py-4 align-top text-right">
                <p className="text-base font-bold text-sale">{formatMoney(order.totalAmount)}</p>
              </td>
              <td className="px-5 py-4 align-top">
                <p className="max-w-xs whitespace-normal text-sm font-medium text-gray-600">{order.shippingAddress}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const classes: Record<OrderStatus, string> = {
    COMPLETED: 'border-green-200 bg-green-50 text-green-700',
    CONFIRMED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    PROCESSING: 'border-blue-200 bg-blue-50 text-blue-700',
    SHIPPED: 'border-purple-200 bg-purple-50 text-purple-700',
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  };
  const statusLabels: Record<OrderStatus, string> = {
    COMPLETED: 'hoàn thành',
    CONFIRMED: 'đã xác nhận',
    PROCESSING: 'đang xử lý',
    SHIPPED: 'đã giao',
    PENDING: 'chờ xử lý',
    CANCELLED: 'đã hủy',
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${classes[status]}`}>
      {statusLabels[status]}
    </span>
  );
};
