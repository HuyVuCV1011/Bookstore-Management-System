import React, { useState, useEffect } from 'react';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { Badge } from '../../components/admin/Badge';
import { inventoryApi } from '../../services/api/inventoryApi';
import type { InventoryTransaction } from '../../types/inventory';

export const TransactionHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (typeFilter) filters.type = typeFilter;

      const res = await inventoryApi.getTransactions(page, 20, filters);
      setTransactions(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, startDate, endDate]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PURCHASE_IN':
        return <Badge variant="success" label="Nhập hàng" />;
      case 'SALE_OUT':
        return <Badge variant="error" label="Xuất hàng" />;
      case 'ADJUSTMENT':
        return <Badge variant="warning" label="Điều chỉnh" />;
      default:
        return <Badge variant="secondary" label={type} />;
    }
  };

  const columns = [
    {
      key: 'transactionDate',
      label: 'Ngày',
      render: (tx: InventoryTransaction) =>
        new Date(tx.transactionDate).toLocaleString('vi-VN'),
    },
    {
      key: 'book',
      label: 'Sách',
      render: (tx: InventoryTransaction) => (
        <div>
          <div className="font-medium">{tx.bookTitle}</div>
          <div className="text-sm text-gray-500">ISBN: {tx.bookIsbn}</div>
        </div>
      ),
    },
    {
      key: 'transactionType',
      label: 'Loại',
      render: (tx: InventoryTransaction) => getTypeBadge(tx.transactionType),
    },
    {
      key: 'quantityChange',
      label: 'Thay đổi',
      render: (tx: InventoryTransaction) => (
        <span className={tx.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}>
          {tx.quantityChange > 0 ? '+' : ''}{tx.quantityChange}
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Tồn kho',
      render: (tx: InventoryTransaction) => `${tx.oldQuantity} → ${tx.newQuantity}`,
    },
    {
      key: 'performedBy',
      label: 'Thực hiện bởi',
      render: (tx: InventoryTransaction) => tx.performedByEmail,
    },
    {
      key: 'reference',
      label: 'Tham chiếu',
      render: (tx: InventoryTransaction) =>
        tx.referenceType && tx.referenceId
          ? `${tx.referenceType} #${tx.referenceId}`
          : 'Thủ công',
    },
  ];

  return (
    <StaffLayout>
      <div className="max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Lịch sử giao dịch</h1>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('')}
                className={`px-4 py-2 rounded-lg ${
                  typeFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Tất cả loại
              </button>
              <button
                onClick={() => setTypeFilter('PURCHASE_IN')}
                className={`px-4 py-2 rounded-lg ${
                  typeFilter === 'PURCHASE_IN' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Nhập hàng
              </button>
              <button
                onClick={() => setTypeFilter('SALE_OUT')}
                className={`px-4 py-2 rounded-lg ${
                  typeFilter === 'SALE_OUT' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Xuất hàng
              </button>
              <button
                onClick={() => setTypeFilter('ADJUSTMENT')}
                className={`px-4 py-2 rounded-lg ${
                  typeFilter === 'ADJUSTMENT' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Điều chỉnh
              </button>
            </div>

            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Xóa ngày
                </button>
              </div>
            </div>
          </div>

          {!loading && transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có giao dịch nào</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Lịch sử giao dịch sẽ xuất hiện khi có:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>✓ Đơn hàng khách được xác nhận (xuất kho)</li>
                <li>✓ Phiếu nhập hàng được hoàn thành (nhập kho)</li>
                <li>✓ Điều chỉnh tồn kho thủ công</li>
              </ul>
              <div className="flex gap-3 justify-center">
                <a
                  href="/staff/customer-orders"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Xem đơn hàng khách
                </a>
                <a
                  href="/staff/purchase-orders"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Quản lý phiếu nhập
                </a>
                <a
                  href="/staff/inventory"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Điều chỉnh tồn kho
                </a>
              </div>
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={transactions} loading={loading} />
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>
    </StaffLayout>
  );
};
