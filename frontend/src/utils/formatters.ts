import type { PaymentMethod } from '../types/order';

/**
 * Convert payment method enum to Vietnamese text
 */
export const formatPaymentMethod = (method: PaymentMethod | string): string => {
  const methodMap: Record<string, string> = {
    CASH: 'Tiền mặt',
    COD: 'Thanh toán khi nhận hàng',
    BANK_TRANSFER: 'Chuyển khoản',
    CREDIT_CARD: 'Thẻ tín dụng',
    E_WALLET: 'Ví điện tử',
    MOMO: 'MoMo',
  };

  return methodMap[method] || method;
};

/**
 * Format money to Vietnamese currency
 */
export const formatMoney = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

/**
 * Format date to localized string
 */
export const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
