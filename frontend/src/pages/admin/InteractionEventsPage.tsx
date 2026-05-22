import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { Badge } from '../../components/admin/Badge';
import { EventDistributionChart } from '../../components/analytics/EventDistributionChart';
import { TopBooksList } from '../../components/analytics/TopBooksList';
import { FlagEventModal } from '../../components/analytics/FlagEventModal';
import { interactionEventApi } from '../../services/api/interactionEventApi';
import type {
  InteractionEvent,
  InteractionEventStats,
  EventDistribution,
  TopBook,
  InteractionEventFilters,
  EventType
} from '../../types/interactionEvent';
import { EVENT_COLORS, EVENT_LABELS } from '../../utils/eventConstants';

// Time formatting utilities
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const formatFullDateTime = (dateString: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(dateString));
};

export const InteractionEventsPage: React.FC = () => {
  const [events, setEvents] = useState<InteractionEvent[]>([]);
  const [stats, setStats] = useState<InteractionEventStats>({
    totalEvents: 0,
    eventsToday: 0,
    flaggedEvents: 0,
    uniqueUsers: 0
  });
  const [distribution, setDistribution] = useState<EventDistribution[]>([]);
  const [topViewed, setTopViewed] = useState<TopBook[]>([]);
  const [topAddedToCart, setTopAddedToCart] = useState<TopBook[]>([]);
  const [topWishlisted, setTopWishlisted] = useState<TopBook[]>([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState<InteractionEventFilters>({});
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate] = useState('');
  const [endDate] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);
  const [flaggedFilter] = useState<boolean | undefined>(undefined);

  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [unflagConfirmId, setUnflagConfirmId] = useState<string | null>(null);

  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [selectedMetadata, setSelectedMetadata] = useState<string>('');

  // Data fetching functions
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await interactionEventApi.getEvents(page, 20, filters);
      setEvents(response.data.events || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await interactionEventApi.getStats(filters);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalEvents: 0,
        eventsToday: 0,
        flaggedEvents: 0,
        uniqueUsers: 0
      });
    }
  };

  const fetchDistribution = async () => {
    try {
      const response = await interactionEventApi.getDistribution(filters);
      const rawData = response.data;

      const total = Object.values(rawData).reduce((sum: number, count) => sum + (count as number), 0);
      const distributionData: EventDistribution[] = Object.entries(rawData).map(
        ([eventType, count]) => ({
          eventType: eventType as EventType,
          count: count as number,
          percentage: total > 0 ? ((count as number) / total) * 100 : 0
        })
      );

      setDistribution(distributionData);
    } catch (error) {
      console.error('Error fetching distribution:', error);
      setDistribution([]);
    }
  };

  const fetchTopBooks = async () => {
    try {
      const [viewedRes, cartRes, wishlistRes] = await Promise.all([
        interactionEventApi.getTopBooks('views', 5),
        interactionEventApi.getTopBooks('add_to_cart', 5),
        interactionEventApi.getTopBooks('bookmark', 5)
      ]);
      setTopViewed(viewedRes.data || []);
      setTopAddedToCart(cartRes.data || []);
      setTopWishlisted(wishlistRes.data || []);
    } catch (error) {
      console.error('Error fetching top books:', error);
      setTopViewed([]);
      setTopAddedToCart([]);
      setTopWishlisted([]);
    }
  };

  // useEffect hooks
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const newFilters: InteractionEventFilters = {};
    if (debouncedSearch) newFilters.search = debouncedSearch;
    if (startDate) newFilters.eventTimeFrom = startDate;
    if (endDate) newFilters.eventTimeTo = endDate;
    if (selectedEventTypes.length > 0) newFilters.eventType = selectedEventTypes;
    if (flaggedFilter !== undefined) newFilters.flagged = flaggedFilter;
    setFilters(newFilters);
    setPage(0);
  }, [debouncedSearch, startDate, endDate, selectedEventTypes, flaggedFilter]);

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [filters, page]);

  useEffect(() => {
    fetchDistribution();
    fetchTopBooks();
  }, [filters]);

  // Action handlers
  const handleFlag = async (eventId: string, reason: string) => {
    try {
      // Optimistic update
      setEvents(prev => prev.map(e =>
        e.id === eventId ? { ...e, flagged: true, flagReason: reason } : e
      ));

      await interactionEventApi.flagEvent(eventId, { reason });
      await fetchStats();
      setFlagModalOpen(false);
      setSelectedEventId(null);
    } catch (error) {
      console.error('Error flagging event:', error);
      alert('Không thể đánh dấu sự kiện');
      // Rollback
      fetchEvents();
    }
  };

  const handleUnflag = async (eventId: string) => {
    try {
      // Optimistic update
      setEvents(prev => prev.map(e =>
        e.id === eventId ? { ...e, flagged: false, flagReason: undefined } : e
      ));

      await interactionEventApi.unflagEvent(eventId);
      await fetchStats();
      setUnflagConfirmId(null);
    } catch (error) {
      console.error('Error unflagging event:', error);
      alert('Không thể bỏ đánh dấu sự kiện');
      // Rollback
      fetchEvents();
    }
  };

  const handleChartClick = (eventType: EventType) => {
    setSelectedEventTypes([eventType]);
  };

  const handleBookClick = (bookId: number) => {
    setSearch(bookId.toString());
  };


  // Table columns definition
  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (event: InteractionEvent) => (
        <span className="font-mono text-xs text-gray-600">{event.id.slice(0, 8)}</span>
      )
    },
    {
      key: 'eventType',
      label: 'Loại sự kiện',
      render: (event: InteractionEvent) => (
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
          style={{
            backgroundColor: `${EVENT_COLORS[event.eventType]}15`,
            borderColor: EVENT_COLORS[event.eventType],
            color: EVENT_COLORS[event.eventType]
          }}
        >
          {EVENT_LABELS[event.eventType]}
        </span>
      )
    },
    {
      key: 'userEmail',
      label: 'Người dùng',
      render: (event: InteractionEvent) => (
        <span className="text-sm">{event.userEmail || 'N/A'}</span>
      )
    },
    {
      key: 'bookTitle',
      label: 'Sách',
      render: (event: InteractionEvent) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium text-gray-900 truncate">{event.bookTitle}</p>
          <p className="text-xs text-gray-500 font-mono">#{event.bookId}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (event: InteractionEvent) => (
        event.flagged ? (
          <div className="flex flex-col gap-1">
            <Badge variant="warning" label="Đã đánh dấu" />
            {event.flagReason && (
              <span className="text-xs text-gray-500 italic">{event.flagReason}</span>
            )}
          </div>
        ) : (
          <Badge variant="success" label="Bình thường" />
        )
      )
    },
    {
      key: 'eventTime',
      label: 'Thời gian',
      render: (event: InteractionEvent) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{formatRelativeTime(event.eventTime)}</p>
          <p className="text-xs text-gray-500">{formatFullDateTime(event.eventTime)}</p>
        </div>
      )
    },
    {
      key: 'metadata',
      label: 'Metadata',
      render: (event: InteractionEvent) => (
        event.metadata ? (
          <button
            onClick={() => {
              setSelectedMetadata(event.metadata!);
              setMetadataModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Xem chi tiết
          </button>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )
      )
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (event: InteractionEvent) => (
        <div className="flex gap-2">
          {!event.flagged ? (
            <button
              onClick={() => {
                setSelectedEventId(event.id);
                setFlagModalOpen(true);
              }}
              className="text-orange-600 hover:text-orange-800 text-sm font-medium"
            >
              Đánh dấu
            </button>
          ) : (
            <button
              onClick={() => setUnflagConfirmId(event.id)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Bỏ đánh dấu
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sự kiện Tương tác Người dùng</h1>
          <p className="text-gray-600 mt-2">Phân tích hành vi người dùng và kiểm duyệt hoạt động</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Events Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tổng số sự kiện</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalEvents.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Events Today Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Sự kiện hôm nay</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.eventsToday.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Flagged Events Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Đã đánh dấu</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.flaggedEvents.toLocaleString()}
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Unique Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Người dùng</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.uniqueUsers.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="mb-6">
          {/* Event Distribution Chart - Full Width */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Phân phối loại sự kiện</h2>
            <EventDistributionChart
              data={distribution}
              onSegmentClick={handleChartClick}
            />
          </div>

          {/* Top Books Grid - 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TopBooksList
              title="Sách được xem nhiều"
              icon="👁️"
              books={topViewed}
              onBookClick={handleBookClick}
            />
            <TopBooksList
              title="Sách thêm giỏ nhiều"
              icon="🛒"
              books={topAddedToCart}
              onBookClick={handleBookClick}
            />
            <TopBooksList
              title="Sách thêm wishlist nhiều"
              icon="❤️"
              books={topWishlisted}
              onBookClick={handleBookClick}
            />
          </div>
        </div>

        {/* Events Table Section */}
        <div className="bg-white rounded-lg shadow">
          {/* Table Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : !events || events.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="mt-4 text-gray-600 font-medium">Không có sự kiện nào</p>
                <p className="text-sm text-gray-500 mt-2">Thử điều chỉnh bộ lọc để tìm kiếm</p>
              </div>
            ) : (
              <>
                <DataTable
                  columns={columns}
                  data={events}
                  rowClassName={(event) => event.flagged ? 'bg-red-50' : ''}
                />
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
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
        </div>

        {/* Flag Event Modal */}
        <FlagEventModal
          isOpen={flagModalOpen}
          eventId={selectedEventId || ''}
          onClose={() => {
            setFlagModalOpen(false);
            setSelectedEventId(null);
          }}
          onConfirm={async (eventId, reason) => {
            await handleFlag(eventId, reason);
          }}
        />

        {/* Metadata Modal */}
        {metadataModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-auto">
              <h3 className="font-semibold text-lg mb-4">Chi tiết Metadata</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {selectedMetadata ? (
                  JSON.stringify(JSON.parse(selectedMetadata), null, 2)
                ) : (
                  'Không có dữ liệu'
                )}
              </pre>
              <button
                onClick={() => setMetadataModalOpen(false)}
                className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Unflag Confirmation Modal */}
        {unflagConfirmId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="font-semibold text-lg mb-4">Xác nhận bỏ đánh dấu</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn bỏ đánh dấu sự kiện này không?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setUnflagConfirmId(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleUnflag(unflagConfirmId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
