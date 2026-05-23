import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api/analyticsApi';
import type { PopularBook } from '../../types/analytics';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';

export const PopularBooksAnalytics: React.FC = () => {
  const [books, setBooks] = useState<PopularBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity' | 'orders'>('revenue');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await analyticsApi.getPopularBooks();
      setBooks(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError('Không thể tải dữ liệu sách phổ biến');
      console.error(err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await analyticsApi.refreshMaterializedViews();
      await fetchData();
    } catch (err) {
      setError('Không thể làm mới dữ liệu');
    } finally {
      setRefreshing(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(books.map(b => b.categoryName)))];

  const filteredBooks = books
    .filter(b => selectedCategory === 'ALL' || b.categoryName === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (sortBy === 'quantity') return b.totalQuantitySold - a.totalQuantitySold;
      return b.totalOrders - a.totalOrders;
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const totalRevenue = filteredBooks.reduce((sum, b) => sum + b.totalRevenue, 0);
  const totalSold = filteredBooks.reduce((sum, b) => sum + b.totalQuantitySold, 0);

  const columns = [
    {
      key: 'rank',
      label: '#',
      render: (book: PopularBook & { rank?: number }) => (
        <span className="font-bold text-primary">{book.rank || 1}</span>
      )
    },
    {
      key: 'title',
      label: 'Tên sách',
      render: (book: PopularBook) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{book.title}</div>
          <div className="text-xs text-gray-500 dark:text-text-primary-dark/60">{book.authorName} • {book.publisherName}</div>
          <div className="text-xs text-gray-400 dark:text-text-primary-dark/50">ISBN: {book.isbn}</div>
        </div>
      ),
    },
    {
      key: 'categoryName',
      label: 'Danh mục',
      render: (book: PopularBook) => (
        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-text-primary-dark rounded">
          {book.categoryName}
        </span>
      ),
    },
    {
      key: 'totalQuantitySold',
      label: 'Đã bán',
      render: (book: PopularBook) => (
        <span className="font-bold">{formatNumber(book.totalQuantitySold)}</span>
      ),
    },
    {
      key: 'totalOrders',
      label: 'Đơn hàng',
      render: (book: PopularBook) => formatNumber(book.totalOrders),
    },
    {
      key: 'totalRevenue',
      label: 'Doanh thu',
      render: (book: PopularBook) => (
        <span className="font-bold text-green-600 dark:text-[#d4e9e2]">{formatCurrency(book.totalRevenue)}</span>
      ),
    },
    {
      key: 'averageSellingPrice',
      label: 'Giá TB',
      render: (book: PopularBook) => formatCurrency(book.averageSellingPrice),
    },
    {
      key: 'stockQuantity',
      label: 'Tồn kho',
      render: (book: PopularBook) => {
        const isLow = book.stockQuantity < 10;
        return (
          <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
            {book.stockQuantity}
          </span>
        );
      },
    },
    {
      key: 'lastOrderDate',
      label: 'Bán gần nhất',
      render: (book: PopularBook) => (
        <span className="text-sm text-gray-600 dark:text-text-primary-dark/70">{formatDate(book.lastOrderDate)}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sách Phổ Biến</h1>
            <p className="text-sm text-gray-500 mt-1">Top 100 sách bán chạy nhất trong 90 ngày qua</p>
            {books.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Cập nhật lần cuối: {formatDate(books[0].lastRefreshTime)}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            {refreshing ? 'Đang làm mới...' : 'Làm mới'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            ⚠ {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💰</span>
              <div className="text-sm text-gray-500 dark:text-text-primary-dark/60 uppercase tracking-wide font-semibold">Tổng Doanh Thu</div>
            </div>
            <div className="text-2xl font-bold text-primary dark:text-[#d4e9e2]">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs text-gray-400 dark:text-text-primary-dark/50 mt-1">Từ {filteredBooks.length} sách trong 90 ngày</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📦</span>
              <div className="text-sm text-gray-500 dark:text-text-primary-dark/60 uppercase tracking-wide font-semibold">Đã Bán</div>
            </div>
            <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{formatNumber(totalSold)}</div>
            <div className="text-xs text-gray-400 dark:text-text-primary-dark/50 mt-1">Tổng số cuốn đã bán ra</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📊</span>
              <div className="text-sm text-gray-500 dark:text-text-primary-dark/60 uppercase tracking-wide font-semibold">Trung Bình/Sách</div>
            </div>
            <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{formatCurrency(totalRevenue / (filteredBooks.length || 1))}</div>
            <div className="text-xs text-gray-400 dark:text-text-primary-dark/50 mt-1">Doanh thu trung bình mỗi đầu sách</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2 text-text-primary-light dark:text-text-primary-dark">Danh mục</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'ALL' ? 'Tất cả' : cat}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2 text-text-primary-light dark:text-text-primary-dark">Sắp xếp theo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('revenue')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'revenue'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-text-primary-light dark:text-text-primary-dark'
                }`}
              >
                Doanh thu
              </button>
              <button
                onClick={() => setSortBy('quantity')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'quantity'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-text-primary-light dark:text-text-primary-dark'
                }`}
              >
                Số lượng
              </button>
              <button
                onClick={() => setSortBy('orders')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'orders'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-text-primary-light dark:text-text-primary-dark'
                }`}
              >
                Đơn hàng
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredBooks.map((book, index) => ({ ...book, rank: index + 1 }))}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
};
