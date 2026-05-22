import React, { useState, useEffect } from 'react';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { SearchBar } from '../../components/admin/SearchBar';
import { Badge } from '../../components/admin/Badge';
import { SupplierFormModal } from '../../components/staff/SupplierFormModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { supplierApi } from '../../services/api/supplierApi';
import type { Supplier, SupplierRequest } from '../../types/supplier';

export const SupplierListPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getAll(page, 20, keyword);
      console.log('Supplier API Response:', res.data);

      // Defensive checks - handle both content and data structures
      const suppliers = res.data.content || res.data.data || res.data || [];
      const totalPages = res.data.totalPages || 0;

      setSuppliers(Array.isArray(suppliers) ? suppliers : []);
      setTotalPages(totalPages);
    } catch (error: any) {
      console.error('Failed to fetch suppliers', error);
      console.error('Error details:', error.response?.data);
      setSuppliers([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, keyword]);

  const handleCreate = () => {
    setSelectedSupplier(null);
    setShowModal(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (data: SupplierRequest) => {
    try {
      if (selectedSupplier) {
        await supplierApi.update(selectedSupplier.id, data);
      } else {
        await supplierApi.create(data);
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to save supplier', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;
    try {
      await supplierApi.delete(selectedSupplier.id);
      setShowDeleteDialog(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier', error);
    }
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      const newStatus = supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await supplierApi.updateStatus(supplier.id, newStatus);
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to update supplier status', error);
    }
  };

  const columns = [
    { key: 'name', label: 'Tên nhà cung cấp' },
    { key: 'contactPerson', label: 'Người liên hệ' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (supplier: Supplier) => (
        <Badge
          variant={supplier.status === 'ACTIVE' ? 'success' : 'secondary'}
          label={supplier.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (supplier: Supplier) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(supplier)}
            className="text-blue-600 hover:text-blue-800"
          >
            Sửa
          </button>
          <button
            onClick={() => handleToggleStatus(supplier)}
            className="text-amber-600 hover:text-amber-800"
          >
            {supplier.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
          </button>
          <button
            onClick={() => handleDelete(supplier)}
            className="text-red-600 hover:text-red-800"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <StaffLayout>
      <div className="max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Nhà cung cấp</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thêm nhà cung cấp
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <SearchBar value={keyword} onChange={setKeyword} placeholder="Tìm kiếm nhà cung cấp..." />

          <DataTable columns={columns} data={suppliers} loading={loading} />

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {showModal && (
          <SupplierFormModal
            supplier={selectedSupplier}
            onSubmit={handleSubmit}
            onClose={() => setShowModal(false)}
          />
        )}

        {showDeleteDialog && (
          <ConfirmDialog
            title="Xóa nhà cung cấp"
            message={`Bạn có chắc chắn muốn xóa ${selectedSupplier?.name}?`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowDeleteDialog(false)}
          />
        )}
      </div>
    </StaffLayout>
  );
};
