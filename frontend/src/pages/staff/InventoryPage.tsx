import React, { useState, useEffect } from 'react';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { SearchBar } from '../../components/admin/SearchBar';
import { Badge } from '../../components/admin/Badge';
import { StockAdjustmentModal } from '../../components/staff/StockAdjustmentModal';
import { inventoryApi } from '../../services/api/inventoryApi';
import type { StockLevel, StockAdjustmentRequest } from '../../types/inventory';

export const InventoryPage: React.FC = () => {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockLevel | null>(null);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getAllStock(page, 20, keyword);
      setStockLevels(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch stock levels', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [page, keyword]);

  const handleAdjustStock = (stock: StockLevel) => {
    setSelectedStock(stock);
    setShowModal(true);
  };

  const handleSubmit = async (data: StockAdjustmentRequest) => {
    try {
      await inventoryApi.adjustStock(data);
      setShowModal(false);
      fetchStock();
    } catch (error) {
      console.error('Failed to adjust stock', error);
      throw error;
    }
  };

  const getStockBadgeVariant = (quantity: number): 'success' | 'warning' | 'danger' | 'secondary' => {
    if (quantity === 0) return 'danger';
    if (quantity < 10) return 'warning';
    return 'success';
  };

  const columns = [
    { key: 'title', label: 'Tên sách' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'categoryName', label: 'Danh mục' },
    {
      key: 'stockQuantity',
      label: 'Số lượng tồn',
      render: (stock: StockLevel) => (
        <Badge
          variant={getStockBadgeVariant(stock.stockQuantity)}
          label={stock.stockQuantity.toString()}
        />
      ),
    },
    { key: 'storageLocation', label: 'Vị trí lưu trữ' },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (stock: StockLevel) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Adjusting stock for:', stock.title);
              handleAdjustStock(stock);
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
            type="button"
          >
            Điều chỉnh tồn kho
          </button>
        </div>
      ),
    },
  ];

  return (
    <StaffLayout>
      <div className="max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý kho hàng</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <SearchBar value={keyword} onChange={setKeyword} placeholder="Tìm kiếm sách theo tên hoặc ISBN..." />

          <DataTable columns={columns} data={stockLevels} loading={loading} />

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {showModal && selectedStock && (
          <StockAdjustmentModal
            stock={selectedStock}
            onSubmit={handleSubmit}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </StaffLayout>
  );
};
