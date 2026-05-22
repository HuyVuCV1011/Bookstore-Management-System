import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { CdcStatusCard } from '../../components/admin/CdcStatusCard';
import { CdcStatsCard } from '../../components/admin/CdcStatsCard';
import { ManualSyncActions } from '../../components/admin/ManualSyncActions';
import { cdcApi } from '../../services/cdcApi';
import type { CdcStatus, CdcStats } from '../../types/cdc';

export const CdcMonitoring: React.FC = () => {
  const [status, setStatus] = useState<CdcStatus | null>(null);
  const [stats, setStats] = useState<CdcStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statusData, statsData] = await Promise.all([
        cdcApi.getStatus(),
        cdcApi.getStats(),
      ]);
      setStatus(statusData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch CDC data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Giám sát CDC</h1>
        <p className="text-gray-600 mt-2">
          Giám sát đồng bộ hóa Change Data Capture giữa PostgreSQL và MongoDB
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CdcStatusCard status={status} loading={loading} />
        <CdcStatsCard stats={stats} loading={loading} />
        <ManualSyncActions />
      </div>
    </AdminLayout>
  );
};