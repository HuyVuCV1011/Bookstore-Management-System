import React from 'react';
import type { CdcStatus } from '../../types/cdc';

interface Props {
  status: CdcStatus | null;
  loading: boolean;
}

export const CdcStatusCard: React.FC<Props> = ({ status, loading }) => {
  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Đang tải...</div>;
  }

  if (!status) {
    return <div className="bg-white rounded-lg shadow p-6">Không có dữ liệu</div>;
  }

  const statusColor = {
    HEALTHY: 'text-green-600 bg-green-100',
    DEGRADED: 'text-yellow-600 bg-yellow-100',
    DOWN: 'text-red-600 bg-red-100',
  }[status.status];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Trạng thái CDC</h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Trạng thái:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
            {status.status}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">CDC đã bật:</span>
          <span className={status.enabled ? 'text-green-600' : 'text-red-600'}>
            {status.enabled ? 'Có' : 'Không'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Kết nối MongoDB:</span>
          <span className={status.mongoConnected ? 'text-green-600' : 'text-red-600'}>
            {status.mongoConnected ? 'Có' : 'Không'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Độ sâu hàng đợi:</span>
          <span className="font-medium">{status.queueDepth}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Đồng bộ lần cuối:</span>
          <span className="text-sm">{new Date(status.lastSyncTime).toLocaleString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
};
