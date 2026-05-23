import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { SearchBar } from '../../components/admin/SearchBar';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { CustomerForm } from '../../components/admin/customer/CustomerForm';
import { customerApi } from '../../services/api/customerApi';
import type { Customer, CustomerRequest } from '../../types/customer';

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getOverview(page, 20, keyword);
      console.log('[CustomerManagement] API Response:', res.data);
      setCustomers(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, keyword]);

  const handleCreate = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = (customer: any) => {
    setSelectedCustomer(customer);
    setShowDeleteDialog(true);
  };

  const handleToggleStatus = async (customer: any) => {
    try {
      await customerApi.toggleStatus(customer.id);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to toggle status', error);
    }
  };

  const handleSubmit = async (data: CustomerRequest) => {
    try {
      if (selectedCustomer) {
        await customerApi.update(selectedCustomer.id, data);
      } else {
        await customerApi.create(data);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to save customer', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await customerApi.delete(selectedCustomer.id);
      setShowDeleteDialog(false);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer', error);
    }
  };

  const columns = [
    { key: 'fullName', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Điện thoại' },
    { key: 'activeSessionsCount', label: 'Phiên hoạt động' },
    { key: 'totalEventsCount', label: 'Lượt tương tác' },
    { key: 'cartItemsCount', label: 'Giỏ hàng' },
    { key: 'wishlistItemsCount', label: 'Yêu thích' },
    {
      key: 'isActive',
      label: 'Trạng thái',
      render: (customer: any) => (
        <button
          onClick={() => handleToggleStatus(customer)}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            customer.isActive
              ? 'bg-slate-100 text-primary hover:bg-slate-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          {customer.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
        </button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Quản lý khách hàng</h1>
            <p className="page-subtitle">Quản lý tài khoản khách hàng và trạng thái hoạt động.</p>
          </div>
          <button onClick={handleCreate} className="btn-buy inline-flex h-10 items-center justify-center px-4 text-sm">
            Thêm khách hàng
          </button>
        </div>

        <section className="toolbar-card">
          <div className="toolbar-controls">
            <SearchBar value={keyword} onChange={setKeyword} placeholder="Tìm kiếm theo tên hoặc email..." />
          </div>
        </section>

        <DataTable
          columns={columns}
          data={customers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        >
          <CustomerForm
            initialData={selectedCustomer || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Xóa khách hàng"
          message={`Bạn có chắc chắn muốn xóa "${selectedCustomer?.fullName}"?`}
        />
      </div>
    </AdminLayout>
  );
};
