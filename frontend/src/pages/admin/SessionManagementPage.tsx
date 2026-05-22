import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { Badge } from '../../components/admin/Badge';
import { DateRangePicker } from '../../components/shared/DateRangePicker';
import { sessionApi } from '../../services/api/sessionApi';
import type { Session, SessionStats, SessionFilters } from '../../types/session';

const parseDeviceInfo = (deviceInfo: string): string => {
  const isMobile = /Mobile|Android|iPhone/i.test(deviceInfo);
  const isTablet = /Tablet|iPad/i.test(deviceInfo);

  let device = '💻 Desktop';
  if (isMobile) device = '📱 Mobile';
  else if (isTablet) device = '📱 Tablet';

  let browser = 'Unknown';
  if (deviceInfo.includes('Chrome')) browser = 'Chrome';
  else if (deviceInfo.includes('Firefox')) browser = 'Firefox';
  else if (deviceInfo.includes('Safari') && !deviceInfo.includes('Chrome')) browser = 'Safari';
  else if (deviceInfo.includes('Edge')) browser = 'Edge';

  return `${device} - ${browser}`;
};

const getSessionStatus = (session: Session): 'active' | 'revoked' | 'expired' => {
  if (session.revoked) return 'revoked';
  if (new Date(session.expiresAt) <= new Date()) return 'expired';
  return 'active';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const getExpiresAtClass = (expiresAt: string): string => {
  const daysLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysLeft < 7 && daysLeft > 0 ? 'text-orange-600 font-semibold' : '';
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  alert('Đã sao chép!');
};

export const SessionManagementPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    activeSessions: 0,
    revokedSessions: 0,
    expiredSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI states
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const filters: SessionFilters = {};
      if (debouncedSearch) filters.email = debouncedSearch;
      if (startDate) filters.createdFrom = new Date(startDate).toISOString();
      if (endDate) filters.createdTo = new Date(endDate).toISOString();

      const response = await sessionApi.getSessions(page, 20, filters);
      setSessions(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const filters: SessionFilters = {};
      if (debouncedSearch) filters.email = debouncedSearch;
      if (startDate) filters.createdFrom = new Date(startDate).toISOString();
      if (endDate) filters.createdTo = new Date(endDate).toISOString();

      const response = await sessionApi.getStats(filters);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);

    const originalSessions = [...sessions];
    const originalStats = { ...stats };

    try {
      setSessions(prev =>
        prev.map(s => s.sessionId === sessionId ? { ...s, revoked: true } : s)
      );
      setStats(prev => ({
        ...prev,
        activeSessions: prev.activeSessions - 1,
        revokedSessions: prev.revokedSessions + 1
      }));

      await sessionApi.revokeSession(sessionId);
      alert('Đã thu hồi phiên thành công');
    } catch (error) {
      setSessions(originalSessions);
      setStats(originalStats);
      console.error('Failed to revoke session:', error);
      alert('Lỗi khi thu hồi phiên');
    } finally {
      setRevoking(null);
      setShowConfirm(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [page, debouncedSearch, startDate, endDate]);

  const columns = [
    {
      key: 'sessionId',
      label: 'Session ID',
      render: (session: Session) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">
            {session.sessionId.substring(0, 8)}...
          </span>
          <button
            onClick={() => copyToClipboard(session.sessionId)}
            className="text-blue-600 hover:text-blue-800"
            title="Sao chép"
          >
            📋
          </button>
        </div>
      )
    },
    {
      key: 'userEmail',
      label: 'Email',
      render: (session: Session) => (
        <span className="text-sm">{session.userEmail}</span>
      )
    },
    {
      key: 'deviceInfo',
      label: 'Thiết bị',
      render: (session: Session) => (
        <span className="text-sm">{parseDeviceInfo(session.deviceInfo)}</span>
      )
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (session: Session) => (
        <span className="text-sm font-mono">{session.ipAddress}</span>
      )
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (session: Session) => {
        const status = getSessionStatus(session);
        const variants: Record<typeof status, { variant: any; label: string }> = {
          active: { variant: 'success', label: 'Hoạt động' },
          revoked: { variant: 'error', label: 'Đã thu hồi' },
          expired: { variant: 'secondary', label: 'Hết hạn' }
        };
        return <Badge {...variants[status]} />;
      }
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: (session: Session) => (
        <span className="text-sm">{formatDate(session.createdAt)}</span>
      )
    },
    {
      key: 'expiresAt',
      label: 'Hết hạn',
      render: (session: Session) => (
        <span className={`text-sm ${getExpiresAtClass(session.expiresAt)}`}>
          {formatDate(session.expiresAt)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (session: Session) => {
        const status = getSessionStatus(session);
        return status === 'active' ? (
          <button
            onClick={() => setShowConfirm(session.sessionId)}
            disabled={revoking === session.sessionId}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {revoking === session.sessionId ? 'Đang xử lý...' : 'Thu hồi'}
          </button>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      }
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phiên đăng nhập</h1>
          <p className="text-gray-600 mt-2">Giám sát và quản lý phiên đăng nhập của người dùng</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số phiên</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Phiên đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeSessions}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã thu hồi</p>
                <p className="text-2xl font-bold text-red-600">{stats.revokedSessions}</p>
              </div>
              <div className="text-3xl">🚫</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã hết hạn</p>
                <p className="text-2xl font-bold text-gray-600">{stats.expiredSessions}</p>
              </div>
              <div className="text-3xl">⏰</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <DateRangePicker
                label="Ngày tạo"
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4">
            <button
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
                setPage(0);
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Không tìm thấy phiên đăng nhập nào
            </div>
          ) : (
            <>
              <DataTable
                data={sessions}
                columns={columns}
              />

              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Revoke Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Xác nhận thu hồi phiên</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc muốn thu hồi phiên này? Người dùng sẽ bị đăng xuất ngay lập tức.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(null)}
                  disabled={revoking !== null}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleRevoke(showConfirm)}
                  disabled={revoking !== null}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {revoking ? 'Đang xử lý...' : 'Thu hồi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
