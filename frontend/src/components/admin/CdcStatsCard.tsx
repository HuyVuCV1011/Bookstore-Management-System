import React from 'react';
import type { CdcStats } from '../../types/cdc';

interface Props {
  stats: CdcStats | null;
  loading: boolean;
}

export const CdcStatsCard: React.FC<Props> = ({ stats, loading }) => {
  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Đang tải...</div>;
  }

  if (!stats) {
    return <div className="bg-white rounded-lg shadow p-6">Không có dữ liệu</div>;
  }

  const consistencyMatch = stats.totalBooksPostgres === stats.totalBooksMongo;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Thống kê CDC</h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Sách trong PostgreSQL:</span>
          <span className="font-medium">{stats.totalBooksPostgres}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Sách trong MongoDB:</span>
          <span className="font-medium">{stats.totalBooksMongo}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Tính nhất quán:</span>
          <span className={consistencyMatch ? 'text-green-600' : 'text-red-600'}>
            {consistencyMatch ? '✓ Đã đồng bộ' : '✗ Chưa đồng bộ'}
          </span>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Số lần thành công:</span>
            <span className="font-medium">{stats.syncSuccessCount}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Số lần thất bại:</span>
          <span className="font-medium">{stats.syncFailureCount}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Tỷ lệ thành công:</span>
          <span className="font-medium">{(stats.successRate * 100).toFixed(1)}%</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Thời gian đồng bộ TB:</span>
          <span className="font-medium">{stats.avgSyncDurationMs.toFixed(0)} ms</span>
        </div>
      </div>
    </div>
  );
};
