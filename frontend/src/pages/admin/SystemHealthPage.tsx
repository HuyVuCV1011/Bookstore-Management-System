import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import axiosInstance from '../../utils/axiosConfig';

interface ProjectionStatus {
  targetDatabase: string;
  syncedCount: number;
  sourceCount: number;
  backlogDepth: number;
  status: string;
}

interface SystemHealth {
  postgresStatus: string;
  mongoDbStatus: string;
  redisStatus: string;
  cassandraStatus: string;
  neo4jStatus: string;
  projections: ProjectionStatus[];
}

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    setRefreshing(true);
    try {
      const res = await axiosInstance.get<SystemHealth>('/admin/system/health');
      setHealth(res.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'UP' || status === 'HEALTHY') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'DOWN') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-amber-600 bg-amber-50 border-amber-200'; // DEGRADED / LAGGING
  };

  const getStatusDot = (status: string) => {
    if (status === 'UP' || status === 'HEALTHY') return 'bg-green-500';
    if (status === 'DOWN') return 'bg-red-500';
    return 'bg-amber-500';
  };

  return (
    <AdminLayout>
      <div className="page-stack">
        <div className="page-header-row flex justify-between items-center mb-6">
          <div>
            <h1 className="page-title text-3xl font-bold text-gray-900">Sức khỏe hệ thống</h1>
            <p className="page-subtitle text-gray-600 mt-2">
              Giám sát trạng thái kết nối của các datastore và tiến trình đồng bộ dữ liệu.
            </p>
          </div>
          <button
            onClick={fetchHealth}
            disabled={refreshing}
            className="btn-buy inline-flex h-10 items-center justify-center px-4 text-sm font-medium rounded bg-primary text-white disabled:opacity-50"
          >
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : health ? (
          <div className="space-y-8">
            {/* Datastore Health Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Trạng thái kết nối CSDL</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { name: 'PostgreSQL', status: health.postgresStatus, type: 'CSDL Giao dịch (Source of Truth)' },
                  { name: 'MongoDB', status: health.mongoDbStatus, type: 'CSDL Document (Catalog & Reviews)' },
                  { name: 'Redis', status: health.redisStatus, type: 'CSDL In-Memory (Cache & Rate Limits)' },
                  { name: 'Cassandra', status: health.cassandraStatus, type: 'CSDL Key-Value (Sessions & Logs)' },
                  { name: 'Neo4j', status: health.neo4jStatus, type: 'CSDL Graph (Recommendations)' },
                ].map((db) => (
                  <div key={db.name} className="bg-white border border-border rounded-lg p-5 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">{db.name}</span>
                        <span className={`h-3.5 w-3.5 rounded-full ${getStatusDot(db.status)}`} />
                      </div>
                      <p className="text-xs text-gray-500 mb-4">{db.type}</p>
                    </div>
                    <div className={`text-center py-1 rounded text-sm font-semibold border ${getStatusColor(db.status)}`}>
                      {db.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projection Health Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Trạng thái đồng bộ Projection (CDC Outbox)</h2>
              <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">CSDL đích</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PostgreSQL (Nguồn)</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã đồng bộ</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Độ trễ hàng đợi</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm text-gray-700">
                    {health.projections.map((p) => (
                      <tr key={p.targetDatabase}>
                        <td className="px-6 py-4 font-semibold text-gray-900">{p.targetDatabase}</td>
                        <td className="px-6 py-4">{p.sourceCount} sách</td>
                        <td className="px-6 py-4">{p.syncedCount} sách</td>
                        <td className="px-6 py-4">
                          {p.backlogDepth > 0 ? (
                            <span className="text-red-600 font-semibold">{p.backlogDepth} sự kiện</span>
                          ) : (
                            <span className="text-gray-500">Không có độ trễ</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="app-empty-state text-center py-12 text-gray-500">Không thể tải thông tin sức khỏe hệ thống</div>
        )}
      </div>
    </AdminLayout>
  );
};
