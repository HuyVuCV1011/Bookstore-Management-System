import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { purchaseOrderApi } from '../../services/api/purchaseOrderApi';
import POStatusBadge from '../../components/purchaseOrders/POStatusBadge';
import type { PurchaseOrder, PurchaseOrderStatus } from '../../types/purchaseOrder';
import {
  formatCurrency,
  formatDateTime,
  canEditPO,
  canDeletePO,
  canSubmitPO,
  canCancelPO,
  canReceivePO
} from '../../utils/purchaseOrderHelpers';

export const PurchaseOrderManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await purchaseOrderApi.getAll(
        page,
        20,
        statusFilter || undefined,
        undefined,
        searchTerm || undefined
      );

      console.log('Purchase orders API response:', response);

      // purchaseOrderApi.getAll() returns response.data directly (the PageResponse object)
      // PageResponse has both 'data' and 'content' fields pointing to the same array
      const orders = response.data || response.content || [];
      const totalPages = response.totalPages || 0;
      const totalElements = response.totalElements || 0;

      setPurchaseOrders(Array.isArray(orders) ? orders : []);
      setTotalPages(totalPages);
      setTotalElements(totalElements);

      console.log('Parsed orders:', orders.length, 'Total pages:', totalPages);
    } catch (err: any) {
      console.error('Failed to fetch purchase orders', err);
      console.error('Error response:', err.response);
      setError('Không thể tải danh sách đơn mua hàng. Vui lòng kiểm tra kết nối API.');
      // Ensure purchaseOrders is always an array even on error
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [page, statusFilter, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(keyword);
    setPage(0);
  };

  const handleViewDetails = (po: PurchaseOrder) => {
    navigate(`/staff/purchase-orders/${po.id}`);
  };

  const handleCreateNew = () => {
    navigate('/staff/purchase-orders/create');
  };

  const handleEdit = (po: PurchaseOrder) => {
    navigate(`/staff/purchase-orders/${po.id}/edit`);
  };

  const handleDelete = async (po: PurchaseOrder) => {
    if (!window.confirm(`Xác nhận xóa đơn mua hàng ${po.poNumber}?`)) return;

    setActionLoading(po.id);
    try {
      await purchaseOrderApi.delete(po.id);
      setSuccessMessage(`Đã xóa đơn mua hàng ${po.poNumber}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPurchaseOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xóa đơn mua hàng');
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (po: PurchaseOrder) => {
    if (!window.confirm(`Xác nhận gửi đơn mua hàng ${po.poNumber} cho nhà cung cấp?`)) return;

    setActionLoading(po.id);
    try {
      await purchaseOrderApi.submit(po.id);
      setSuccessMessage(`Đã gửi đơn mua hàng ${po.poNumber}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPurchaseOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi đơn mua hàng');
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (po: PurchaseOrder) => {
    if (!window.confirm(`Xác nhận hủy đơn mua hàng ${po.poNumber}?`)) return;

    setActionLoading(po.id);
    try {
      await purchaseOrderApi.cancel(po.id);
      setSuccessMessage(`Đã hủy đơn mua hàng ${po.poNumber}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPurchaseOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể hủy đơn mua hàng');
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReceive = (po: PurchaseOrder) => {
    navigate(`/staff/purchase-orders/${po.id}/receive`);
  };

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn mua hàng</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý đơn đặt hàng nhập sách từ nhà cung cấp
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo đơn mới
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Filter and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PurchaseOrderStatus | '');
                  setPage(0);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="DRAFT">Nháp</option>
                <option value="SUBMITTED">Đã gửi</option>
                <option value="RECEIVING">Đang nhận hàng</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div className="flex-1 min-w-[300px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Mã đơn, tên nhà cung cấp..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Tìm
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Đang tải...</p>
            </div>
          ) : !Array.isArray(purchaseOrders) || purchaseOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm">Không có đơn mua hàng nào</p>
              {searchTerm && <p className="text-xs text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã đơn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhà cung cấp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày đặt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600">
                            {po.poNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{po.supplierName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <POStatusBadge status={po.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {formatDateTime(po.orderDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(po.totalAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleViewDetails(po)}
                              className="text-blue-600 hover:text-blue-800 font-medium transition"
                              title="Xem chi tiết"
                            >
                              Xem
                            </button>

                            {canEditPO(po.status) && (
                              <button
                                onClick={() => handleEdit(po)}
                                disabled={actionLoading === po.id}
                                className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50 font-medium transition"
                                title="Chỉnh sửa"
                              >
                                Sửa
                              </button>
                            )}

                            {canSubmitPO(po.status) && (
                              <button
                                onClick={() => handleSubmit(po)}
                                disabled={actionLoading === po.id}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50 font-medium transition"
                                title="Gửi cho nhà cung cấp"
                              >
                                {actionLoading === po.id ? 'Đang gửi...' : 'Gửi'}
                              </button>
                            )}

                            {canReceivePO(po.status) && (
                              <button
                                onClick={() => handleReceive(po)}
                                className="text-purple-600 hover:text-purple-800 font-medium transition"
                                title="Nhận hàng"
                              >
                                Nhận hàng
                              </button>
                            )}

                            {canCancelPO(po.status) && (
                              <button
                                onClick={() => handleCancel(po)}
                                disabled={actionLoading === po.id}
                                className="text-orange-600 hover:text-orange-800 disabled:opacity-50 font-medium transition"
                                title="Hủy đơn"
                              >
                                {actionLoading === po.id ? 'Đang hủy...' : 'Hủy'}
                              </button>
                            )}

                            {canDeletePO(po.status) && (
                              <button
                                onClick={() => handleDelete(po)}
                                disabled={actionLoading === po.id}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50 font-medium transition"
                                title="Xóa đơn"
                              >
                                {actionLoading === po.id ? 'Đang xóa...' : 'Xóa'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Hiển thị{' '}
                  <span className="font-medium">{page * 20 + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium">{Math.min((page + 1) * 20, totalElements)}</span>
                  {' '}trong tổng số{' '}
                  <span className="font-medium">{totalElements}</span>
                  {' '}đơn hàng
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition text-sm font-medium"
                  >
                    ← Trước
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700 flex items-center">
                    Trang <span className="font-medium mx-1">{page + 1}</span> / <span className="font-medium ml-1">{totalPages || 1}</span>
                  </span>
                  <button
                    onClick={() => setPage(Math.min((totalPages || 1) - 1, page + 1))}
                    disabled={page >= (totalPages || 1) - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition text-sm font-medium"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </StaffLayout>
  );
};

export default PurchaseOrderManagementPage;
