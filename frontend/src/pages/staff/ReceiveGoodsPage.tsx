import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { purchaseOrderApi } from '../../services/api/purchaseOrderApi';
import POStatusBadge from '../../components/purchaseOrders/POStatusBadge';
import type { PurchaseOrderDetail, ReceiveGoodsRequest } from '../../types/purchaseOrder';
import { formatCurrency } from '../../utils/purchaseOrderHelpers';

interface ReceiveItem {
  itemId: number;
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  receiveNow: number;
}

export const ReceiveGoodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [po, setPo] = useState<PurchaseOrderDetail | null>(null);
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

      if (data.status !== 'SUBMITTED' && data.status !== 'RECEIVING') {
        setError('Chỉ có thể nhận hàng cho đơn ở trạng thái Đã gửi hoặc Đang nhận hàng');
        setTimeout(() => navigate(`/staff/purchase-orders/${id}`), 2000);
        return;
      }

      setPo(data);

      // Initialize receive quantities
      const items = data.items
        .filter((item) => item.quantityRemaining > 0)
        .map((item) => ({
          itemId: item.id,
          bookId: item.bookId,
          bookTitle: item.bookTitle,
          bookIsbn: item.bookIsbn,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: item.quantityReceived,
          quantityRemaining: item.quantityRemaining,
          unitCost: item.unitCost,
          receiveNow: 0,
        }));

      setReceiveItems(items);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index: number, value: number) => {
    const newItems = [...receiveItems];
    const item = newItems[index];

    // Validate
    const receiveNow = Math.max(0, Math.min(value, item.quantityRemaining));
    newItems[index] = { ...item, receiveNow };

    setReceiveItems(newItems);
  };

  const handleReceiveAll = () => {
    setReceiveItems(
      receiveItems.map((item) => ({
        ...item,
        receiveNow: item.quantityRemaining,
      }))
    );
  };

  const handleClearAll = () => {
    setReceiveItems(
      receiveItems.map((item) => ({
        ...item,
        receiveNow: 0,
      }))
    );
  };

  const getTotalReceiving = () => {
    return receiveItems.reduce((sum, item) => sum + item.receiveNow, 0);
  };

  const getTotalValue = () => {
    return receiveItems.reduce(
      (sum, item) => sum + item.receiveNow * item.unitCost,
      0
    );
  };

  const canSubmit = () => {
    return receiveItems.some((item) => item.receiveNow > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit()) {
      setError('Vui lòng nhập số lượng nhận cho ít nhất một sản phẩm');
      return;
    }

    if (!window.confirm(`Xác nhận nhận ${getTotalReceiving()} cuốn sách vào kho?`)) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const requestData: ReceiveGoodsRequest = {
        items: receiveItems
          .filter((item) => item.receiveNow > 0)
          .map((item) => ({
            itemId: item.itemId,
            quantityReceived: item.receiveNow,
          })),
      };

      await purchaseOrderApi.receiveGoods(parseInt(id!), requestData);
      alert('Nhận hàng thành công! Kho đã được cập nhật.');
      navigate(`/staff/purchase-orders/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể nhận hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/staff/purchase-orders/${id}`);
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500">Đang tải...</div>
        </div>
      </StaffLayout>
    );
  }

  if (!po) {
    return (
      <StaffLayout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center text-red-600">Không tìm thấy đơn hàng</div>
        </div>
      </StaffLayout>
    );
  }

  if (receiveItems.length === 0) {
    return (
      <StaffLayout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-lg text-gray-700 mb-4">
              Đơn hàng này đã nhận đủ hàng!
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại chi tiết đơn
            </button>
          </div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Quay lại chi tiết đơn
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nhận hàng</h1>
              <p className="mt-1 text-sm text-gray-500">
                Đơn hàng: {po.poNumber} - {po.supplierName}
              </p>
            </div>
            <POStatusBadge status={po.status} className="text-base px-4 py-2" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={handleReceiveAll}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
          >
            Nhận tất cả
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Xóa tất cả
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Items Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sách
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Đã đặt
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Đã nhận
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Còn lại
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Nhận lần này
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Giá trị
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receiveItems.map((item, index) => (
                    <tr key={item.itemId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.bookTitle}
                        </div>
                        <div className="text-xs text-gray-500">{item.bookIsbn}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {item.quantityOrdered}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-green-600 font-medium">
                        {item.quantityReceived}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-orange-600 font-medium">
                        {item.quantityRemaining}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          max={item.quantityRemaining}
                          value={item.receiveNow}
                          onChange={(e) =>
                            handleQuantityChange(index, parseInt(e.target.value) || 0)
                          }
                          className="w-24 mx-auto border border-gray-300 rounded px-3 py-2 text-center font-medium"
                        />
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatCurrency(item.receiveNow * item.unitCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Tổng nhận lần này:
                    </td>
                    <td className="px-6 py-4 text-center text-base font-bold text-blue-600">
                      {getTotalReceiving()} cuốn
                    </td>
                    <td className="px-6 py-4 text-right text-base font-bold text-blue-600">
                      {formatCurrency(getTotalValue())}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Tóm tắt nhận hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-700">Số sản phẩm</p>
                <p className="text-2xl font-bold text-blue-900">
                  {receiveItems.filter((i) => i.receiveNow > 0).length} /{' '}
                  {receiveItems.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Tổng số lượng</p>
                <p className="text-2xl font-bold text-blue-900">
                  {getTotalReceiving()} cuốn
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Giá trị nhận</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(getTotalValue())}
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-yellow-600 mr-3">ℹ️</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Lưu ý khi nhận hàng:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Số lượng nhận không được vượt quá số lượng còn lại</li>
                  <li>Kho sẽ được cập nhật ngay sau khi xác nhận</li>
                  <li>Có thể nhận nhiều lần cho đến khi đủ số lượng đã đặt</li>
                  <li>Trạng thái đơn sẽ tự động chuyển sang "Hoàn thành" khi nhận đủ</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận nhận hàng'}
            </button>
          </div>
        </form>
      </div>
    </StaffLayout>
  );
};

export default ReceiveGoodsPage;
