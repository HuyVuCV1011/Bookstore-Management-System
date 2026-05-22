import React, { useState } from 'react';
import { Modal } from '../admin/Modal';
import type { StockLevel, StockAdjustmentRequest } from '../../types/inventory';

interface StockAdjustmentModalProps {
  stock: StockLevel;
  onSubmit: (data: StockAdjustmentRequest) => Promise<void>;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  stock,
  onSubmit,
  onClose,
}) => {
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newQuantity = stock.stockQuantity + quantityChange;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (quantityChange === 0) {
      setError('Số lượng thay đổi phải khác 0');
      return;
    }

    if (!reason.trim()) {
      setError('Vui lòng nhập lý do');
      return;
    }

    if (newQuantity < 0) {
      setError('Số lượng mới không thể âm');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        bookId: stock.bookId,
        quantityChange,
        reason: reason.trim(),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể điều chỉnh tồn kho');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} title="Điều chỉnh tồn kho" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        {/* Book Info */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Sách:</span>
            <span className="text-sm text-gray-900">{stock.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">ISBN:</span>
            <span className="text-sm text-gray-900">{stock.isbn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Tồn kho hiện tại:</span>
            <span className="text-sm font-semibold text-gray-900">{stock.stockQuantity}</span>
          </div>
        </div>

        {/* Quantity Change Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng thay đổi *
          </label>
          <input
            type="number"
            required
            value={quantityChange === 0 ? '' : quantityChange}
            onChange={(e) => setQuantityChange(parseInt(e.target.value) || 0)}
            placeholder="Nhập số dương để tăng, số âm để giảm (ví dụ: 10 hoặc -5)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            step="1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Dùng số dương để tăng tồn kho, số âm để giảm tồn kho
          </p>
        </div>

        {/* New Quantity Preview */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Tồn kho mới:</span>
            <span className={`text-lg font-bold ${newQuantity < 0 ? 'text-red-600' : 'text-blue-900'}`}>
              {stock.stockQuantity} {quantityChange >= 0 ? '+' : ''}{quantityChange} = {newQuantity}
            </span>
          </div>
        </div>

        {/* Reason Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lý do *
          </label>
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Giải thích lý do điều chỉnh..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Điều chỉnh'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
