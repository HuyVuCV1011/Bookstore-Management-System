// frontend/src/components/orders/OrderStatusBadge.tsx
import React from 'react';
import type { OrderStatus, PaymentStatus } from '../../types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus | PaymentStatus;
  type: 'order' | 'payment';
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, type }) => {
  const getOrderStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: '⏳ Pending',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          icon: '⏳'
        };
      case 'CONFIRMED':
        return {
          label: '✓ Confirmed',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: '✓'
        };
      case 'PROCESSING':
        return {
          label: '⚙️ Processing',
          className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
          icon: '⚙️'
        };
      case 'SHIPPED':
        return {
          label: '🚚 Shipped',
          className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
          icon: '🚚'
        };
      case 'COMPLETED':
        return {
          label: '✅ Completed',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: '✅'
        };
      case 'CANCELLED':
        return {
          label: '❌ Cancelled',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: '❌'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: '●'
        };
    }
  };

  const getPaymentStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'UNPAID':
        return {
          label: '💳 Unpaid',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: '💳'
        };
      case 'PAID':
        return {
          label: '✅ Paid',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: '✅'
        };
      case 'REFUNDED':
        return {
          label: '↩️ Refunded',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: '↩️'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: '●'
        };
    }
  };

  const config = type === 'order'
    ? getOrderStatusConfig(status as OrderStatus)
    : getPaymentStatusConfig(status as PaymentStatus);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
};

export default OrderStatusBadge;
