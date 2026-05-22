import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { purchaseOrderApi } from '../../services/api/purchaseOrderApi';
import POStatusBadge from '../../components/purchaseOrders/POStatusBadge';
import type { PurchaseOrderDetail } from '../../types/purchaseOrder';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  canEditPO,
  canDeletePO,
  canSubmitPO,
  canReceivePO,
  canCancelPO,
} from '../../utils/purchaseOrderHelpers';

export const PurchaseOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [po, setPo] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchPO();
    }
  }, [id]);

  const fetchPO = async () => {
    if (!id) return;

    setLoading(true);
    setError('');
    try {
      const data = await purchaseOrderApi.getById(parseInt(id));
      setPo(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/staff/purchase-orders/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!po || !window.confirm(`Xác nhận xóa đơn mua hàng ${po.poNumber}?`)) return;

    setActionLoading(true);
    try {
      await purchaseOrderApi.delete(po.id);
      alert('Đã xóa đơn mua hàng');
      navigate('/staff/purchase-orders');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xóa đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!po || !window.confirm(`Xác nhận gửi đơn mua hàng ${po.poNumber} cho nhà cung cấp?`)) return;

    setActionLoading(true);
    setError('');
    try {
      await purchaseOrderApi.submit(po.id);
      setSuccessMessage('Đã gửi đơn hàng thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchPO();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!po || !window.confirm(`Xác nhận hủy đơn mua hàng ${po.poNumber}?`)) return;

    setActionLoading(true);
    setError('');
    try {
      await purchaseOrderApi.cancel(po.id);
      setSuccessMessage('Đã hủy đơn hàng');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchPO();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = () => {
    navigate(`/staff/purchase-orders/${id}/receive`);
  };

  const handleBack = () => {
    navigate('/staff/purchase-orders');
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500">Đang tải...</div>
        </div>
      </StaffLayout>
    );
  }

  if (!po) {
    return (
      <StaffLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-red-600">Không tìm thấy đơn hàng</div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Quay lại danh sách
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
              <p className="mt-1 text-sm text-gray-500">Chi tiết đơn mua hàng</p>
            </div>
            <POStatusBadge status={po.status} className="text-base px-4 py-2" />
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          {canEditPO(po.status) && (
            <button
              onClick={handleEdit}
              disabled={actionLoading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              Chỉnh sửa
            </button>
          )}

          {canSubmitPO(po.status) && (
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Gửi đơn hàng
            </button>
          )}

          {canReceivePO(po.status) && (
            <button
              onClick={handleReceive}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Nhận hàng
            </button>
          )}

          {canCancelPO(po.status) && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Hủy đơn
            </button>
          )}

          {canDeletePO(po.status) && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Xóa đơn
            </button>
          )}
        </div>

        {/* PO Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Thông tin đơn hàng
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Mã đơn hàng</dt>
                <dd className="mt-1 text-sm text-gray-900 font-medium">{po.poNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Nhà cung cấp</dt>
                <dd className="mt-1 text-sm text-gray-900">{po.supplierName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ngày đặt hàng</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDateTime(po.orderDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ngày giao dự kiến</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(po.expectedDeliveryDate)}
                </dd>
              </div>
              {po.completedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ngày hoàn thành</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(po.completedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Financial Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Thông tin tài chính
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Tổng giá trị</dt>
                <dd className="mt-1 text-2xl font-bold text-blue-600">
                  {formatCurrency(po.totalAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Số sản phẩm</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {po.items.length} loại sách
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tổng số lượng</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {po.items.reduce((sum, item) => sum + item.quantityOrdered, 0)} cuốn
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Đã nhận</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {po.items.reduce((sum, item) => sum + item.quantityReceived, 0)} cuốn
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Notes */}
        {po.notes && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Ghi chú</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{po.notes}</p>
          </div>
        )}

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Danh sách sản phẩm</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sách
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ISBN
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    SL đặt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Đã nhận
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Còn lại
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Giá nhập
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {po.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.bookTitle}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.bookIsbn}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {item.quantityOrdered}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className="text-green-600 font-medium">
                        {item.quantityReceived}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span
                        className={`font-medium ${
                          item.quantityRemaining > 0 ? 'text-orange-600' : 'text-gray-400'
                        }`}
                      >
                        {item.quantityRemaining}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Tổng cộng:
                  </td>
                  <td className="px-6 py-4 text-right text-base font-bold text-blue-600">
                    {formatCurrency(po.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 text-sm text-gray-500">
          <p>Tạo lúc: {formatDateTime(po.createdAt)}</p>
          <p>Cập nhật: {formatDateTime(po.updatedAt)}</p>
        </div>
      </div>
    </StaffLayout>
  );
};

export default PurchaseOrderDetailPage;
