import React from 'react';
import type { BusinessStatus } from '../../types/common';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'error' | 'secondary';

type BadgeProps =
  | {
      status: BusinessStatus;
      variant?: never;
      label?: never;
    }
  | {
      status?: never;
      variant: BadgeVariant;
      label: string;
    };

export const Badge: React.FC<BadgeProps> = ({ status, variant, label }) => {
  if (status) {
    const styles = {
      ACTIVE: 'bg-soft-panel text-primary border-border',
      DISCONTINUED: 'bg-gray-50 text-gray-600 border-border',
      OUT_OF_STOCK: 'bg-red-50 text-red-700 border-red-200',
    };

    const labels = {
      ACTIVE: 'Đang bán',
      DISCONTINUED: 'Ngừng bán',
      OUT_OF_STOCK: 'Hết hàng',
    };

    return (
      <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  }

  const variantStyles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    secondary: 'bg-gray-50 text-gray-700 border-border',
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${variantStyles[variant]}`}>
      {label}
    </span>
  );
};
