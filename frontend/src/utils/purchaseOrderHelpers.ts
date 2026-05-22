import type { PurchaseOrderStatus } from '../types/purchaseOrder';

export const getPOStatusLabel = (status: PurchaseOrderStatus): string => {
  const labels: Record<PurchaseOrderStatus, string> = {
    DRAFT: 'Nháp',
    SUBMITTED: 'Đã gửi',
    RECEIVING: 'Đang nhận hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return labels[status];
};

export const getPOStatusColor = (status: PurchaseOrderStatus): string => {
  const colors: Record<PurchaseOrderStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    RECEIVING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status];
};

export const canEditPO = (status: PurchaseOrderStatus): boolean => {
  return status === 'DRAFT';
};

export const canDeletePO = (status: PurchaseOrderStatus): boolean => {
  return status === 'DRAFT';
};

export const canSubmitPO = (status: PurchaseOrderStatus): boolean => {
  return status === 'DRAFT';
};

export const canReceivePO = (status: PurchaseOrderStatus): boolean => {
  return status === 'SUBMITTED' || status === 'RECEIVING';
};

export const canCancelPO = (status: PurchaseOrderStatus): boolean => {
  return status !== 'COMPLETED' && status !== 'CANCELLED';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (date: string | null): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('vi-VN');
};

export const formatDateTime = (date: string | null): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('vi-VN');
};
