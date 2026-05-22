import React, { useState, useEffect } from 'react';
import { reviewApi } from '../../services/api/reviewApi';
import type { Review } from '../../types';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

export const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewApi.getAll(page, 20);
      console.log('Reviews response:', res.data);
      setReviews(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (error: any) {
      console.error('Failed to fetch reviews', error);
      console.error('Error response:', error.response?.data);
      alert(`Lỗi tải đánh giá: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const handleApprove = async (id: string) => {
    try {
      await reviewApi.approve(id);
      fetchReviews();
    } catch (error) {
      alert('Failed to approve review');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await reviewApi.deleteByAdmin(deleteId);
      setDeleteId(null);
      fetchReviews();
    } catch (error) {
      alert('Failed to delete review');
    }
  };

  return (
    <AdminLayout>
      <div className="page-stack">
        {/* Page Header */}
        <div className="app-card-muted app-card-pad">
          <h1 className="page-title">Quản lý đánh giá</h1>
          <p className="page-subtitle">
            Xem và quản lý tất cả đánh giá từ khách hàng
          </p>
        </div>

      <div className="app-card overflow-x-auto">
        {loading ? (
          <div className="app-loading-state">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : reviews.length === 0 ? (
          <div className="app-empty-state">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-sm font-semibold text-gray-800">Chưa có đánh giá nào</p>
            <p className="mt-1 text-sm text-gray-500">Đánh giá từ khách hàng sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-border bg-bg-light">
              <tr>
                <th className="table-th text-left">NGƯỜI ĐÁNH GIÁ</th>
                <th className="table-th text-left">XẾP HẠNG</th>
                <th className="table-th text-left">NHẬN XÉT</th>
                <th className="table-th text-left">SÁCH</th>
                <th className="table-th text-left">NGÀY</th>
                <th className="table-th text-left">TRẠNG THÁI</th>
                <th className="table-th text-right">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {reviews.map((r) => (
                <tr key={r.id} className="transition hover:bg-bg-light">
                  <td className="px-5 py-4 align-top">
                    <p className="font-semibold text-[15px] text-gray-900">{r.userName || 'Khách hàng'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">{r.userId.substring(0, 8)}...</p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex text-[#b88745] text-base">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{r.rating}/5</p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <p className="max-w-md text-[15px] text-gray-700 line-clamp-2">"{r.comment}"</p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="text-sm font-medium text-gray-600">ID: {r.bookId}</span>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-gray-600">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
                      r.moderated
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}>
                      {r.moderated ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-right">
                    <div className="flex gap-2 justify-end">
                      {!r.moderated && (
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="rounded-button border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                        >
                          Duyệt
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(r.id)}
                        className="rounded-button border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination-card">
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`rounded-button px-3.5 py-2 text-sm font-semibold transition ${
                  page === i
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-border bg-white text-gray-700 hover:border-primary hover:text-primary'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Xóa đánh giá"
        message="Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
};
