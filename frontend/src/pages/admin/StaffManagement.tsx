import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { SearchBar } from '../../components/admin/SearchBar';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { StaffForm } from '../../components/admin/staff/StaffForm';
import { staffApi } from '../../services/api/staffApi';
import { useAuth } from '../../contexts/AuthContext';
import type { WarehouseStaff, WarehouseStaffRequest } from '../../types/staff';

export const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<WarehouseStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<WarehouseStaff | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getAll(page, 20, keyword);
      setStaff(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error: any) {
      console.error('Failed to fetch warehouse staff', error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        console.error('Authentication failed - redirecting to login');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        console.error('Access denied - insufficient privileges');
        alert('Access denied. You need ADMIN privileges to view warehouse staff.');
      }

      // Set empty array to allow UI to still render
      setStaff([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [page, keyword]);

  const handleCreate = () => {
    setSelectedStaff(null);
    setShowModal(true);
  };

  const handleEdit = (staff: WarehouseStaff) => {
    setSelectedStaff(staff);
    setShowModal(true);
  };

  const handleDelete = (staff: WarehouseStaff) => {
    setSelectedStaff(staff);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (data: WarehouseStaffRequest) => {
    try {
      console.log('[Staff Management] Submitting data:', data);
      console.log('[Staff Management] Token exists:', !!localStorage.getItem('accessToken'));
      console.log('[Staff Management] Current user:', user);

      if (selectedStaff) {
        await staffApi.update(selectedStaff.id, data);
      } else {
        await staffApi.create(data);
      }
      setShowModal(false);
      fetchStaff();
    } catch (error: any) {
      console.error('[Staff Management] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });

      // Better error messages
      if (error.response?.status === 401) {
        alert('Authentication failed. Your session may have expired. Please log in again.');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert(`Access denied. Backend says: You need ADMIN role.\n\nCurrent user: ${user?.email}\nRole in frontend: ${user?.role}\n\nPlease check the JWT token contains the correct role.`);
      } else {
        alert(`Failed to save warehouse staff: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedStaff) return;
    try {
      await staffApi.delete(selectedStaff.id);
      setShowDeleteDialog(false);
      fetchStaff();
    } catch (error) {
      console.error('Failed to delete warehouse staff', error);
    }
  };

  const columns = [
    { key: 'fullName', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Điện thoại' },
    { key: 'areaResponsible', label: 'Khu vực phụ trách' },
    {
      key: 'hireDate',
      label: 'Ngày tuyển dụng',
      render: (staff: WarehouseStaff) =>
        new Date(staff.hireDate).toLocaleDateString('vi-VN'),
    },
    {
      key: 'isActive',
      label: 'Trạng thái',
      render: (staff: WarehouseStaff) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          staff.isActive
            ? 'bg-slate-100 text-primary'
            : 'bg-red-100 text-red-700'
        }`}>
          {staff.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Quản lý nhân viên kho</h1>
            <p className="page-subtitle">Quản lý tài khoản nhân viên kho và khu vực được phân công.</p>
          </div>
          <button onClick={handleCreate} className="btn-buy inline-flex h-10 items-center justify-center px-4 text-sm">
            Thêm nhân viên kho
          </button>
        </div>

        <section className="toolbar-card">
          <div className="toolbar-controls">
            <SearchBar
              value={keyword}
              onChange={setKeyword}
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
            />
          </div>
        </section>

        <DataTable
          columns={columns}
          data={staff}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

        <Modal
          isOpen={showModal}
          title={selectedStaff ? 'Chỉnh sửa nhân viên kho' : 'Thêm nhân viên kho mới'}
          onClose={() => setShowModal(false)}
        >
          <StaffForm
            initialData={selectedStaff || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Xóa nhân viên kho"
          message={`Bạn có chắc chắn muốn xóa "${selectedStaff?.fullName}"? Điều này sẽ xóa quyền truy cập của họ vào cổng nhân viên kho.`}
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteDialog(false)}
        />
      </div>
    </AdminLayout>
  );
};
