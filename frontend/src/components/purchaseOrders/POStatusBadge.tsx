import React from 'react';
import type { PurchaseOrderStatus } from '../../types/purchaseOrder';
import { getPOStatusLabel, getPOStatusColor } from '../../utils/purchaseOrderHelpers';

interface POStatusBadgeProps {
  status: PurchaseOrderStatus;
  className?: string;
}

export const POStatusBadge: React.FC<POStatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPOStatusColor(
        status
      )} ${className}`}
    >
      {getPOStatusLabel(status)}
    </span>
  );
};

export default POStatusBadge;
