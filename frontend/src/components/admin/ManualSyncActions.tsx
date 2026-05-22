import React, { useState } from 'react';
import { cdcApi } from '../../services/cdcApi';
import { ConfirmDialog } from './ConfirmDialog';

export const ManualSyncActions: React.FC = () => {
  const [bookId, setBookId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSyncBook = async () => {
    if (!bookId) {
      setMessage('Vui lòng nhập ID sách');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const result = await cdcApi.syncBook(parseInt(bookId));
      setMessage(`Thành công: ${result}`);
      setBookId('');
    } catch (error) {
      setMessage(`Lỗi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckConsistency = async () => {
    setLoading(true);
    setMessage('');
    try {
      const stats = await cdcApi.checkConsistency();
      const match = stats.totalBooksPostgres === stats.totalBooksMongo;
      setMessage(
        match
          ? `Nhất quán: ${stats.totalBooksPostgres} sách trong cả hai cơ sở dữ liệu`
          : `Không nhất quán: PostgreSQL có ${stats.totalBooksPostgres}, MongoDB có ${stats.totalBooksMongo}`
      );
    } catch (error) {
      setMessage(`Lỗi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllBooks = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    setMessage('');
    try {
      const result = await cdcApi.syncAllBooks();
      setMessage(`Thành công: ${result}`);
    } catch (error) {
      setMessage(`Lỗi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Thao tác đồng bộ thủ công</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đồng bộ một cuốn sách
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              placeholder="Nhập ID sách"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSyncBook}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Đồng bộ
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={handleCheckConsistency}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            Kiểm tra tính nhất quán
          </button>
        </div>

        <div>
          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
          >
            Đồng bộ tất cả sách
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-md ${
            message.startsWith('Lỗi') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Đồng bộ tất cả sách"
        message="Bạn có chắc chắn muốn đồng bộ tất cả sách từ PostgreSQL sang MongoDB? Thao tác này có thể mất một khoảng thời gian."
        onConfirm={handleSyncAllBooks}
        onCancel={() => setShowConfirmDialog(false)}
        confirmText="Xác nhận đồng bộ"
        cancelText="Hủy"
        confirmVariant="primary"
      />
    </div>
  );
};
