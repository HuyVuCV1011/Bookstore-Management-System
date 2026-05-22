import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminService, type UserItem } from '../services/adminService';
import { AdminLayout } from '../components/admin/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/admin/Modal';
import { ConfirmDialog } from '../components/admin/ConfirmDialog';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

type RoleFilter = 'ALL' | 'CUSTOMER' | 'STAFF' | 'ADMIN';
type EditableRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';
type EditUserForm = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  role: EditableRole;
  isActive: boolean;
};

const ROLE_TABS: { key: RoleFilter; label: string }[] = [
  { key: 'ALL',      label: 'Tất cả' },
  { key: 'CUSTOMER', label: 'Khách hàng' },
  { key: 'STAFF',    label: 'Nhân viên' },
  { key: 'ADMIN',    label: 'Quản trị viên' },
];

const ROLE_BADGE: Record<string, string> = {
  ADMIN:    'role-badge role-badge-admin',
  STAFF:    'role-badge role-badge-staff',
  CUSTOMER: 'role-badge role-badge-customer',
};

const ROLE_OPTIONS: ('CUSTOMER' | 'STAFF' | 'ADMIN')[] = ['CUSTOMER', 'STAFF', 'ADMIN'];
const ROLE_LABELS: Record<EditableRole, string> = {
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên',
  ADMIN: 'Quản trị viên',
};
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers]           = useState<UserItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword]         = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<EditUserForm>({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    address: '',
    role: 'CUSTOMER',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // success flash
  const [flash, setFlash] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers(
        page, 15,
        roleFilter === 'ALL' ? undefined : roleFilter,
        keyword || undefined
      );
      setUsers(res.users);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, keyword]);

  useEffect(() => { load(); }, [load]);

  // reset to page 0 when filter or keyword changes
  useEffect(() => { setPage(0); }, [roleFilter, keyword]);

  // debounce search input → keyword
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setKeyword(val), 400);
  };

  const clearSearch = () => {
    setSearchInput('');
    setKeyword('');
  };

  const showFlash = (id: string, msg: string) => {
    setFlash((f) => ({ ...f, [id]: msg }));
    setTimeout(() => setFlash((f) => { const n = { ...f }; delete n[id]; return n; }), 2500);
  };

  const handleEdit = (user: UserItem) => {
    setSelectedUser(user);
    setFormError(null);
    setFormData({
      email: user.email,
      password: '',
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setFormError(null);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phoneNumber: '',
      address: '',
      role: 'CUSTOMER',
      isActive: true,
    });
    setShowEditModal(true);
  };

  const handleDelete = (user: UserItem) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = formData.email.trim();
    const password = formData.password;
    const fullName = formData.fullName.trim();
    const phoneNumber = formData.phoneNumber.trim();
    const address = formData.address.trim();
    const isSelf = selectedUser?.id === currentUser?.id;

    if (!email || !fullName || !phoneNumber || !address) {
      setFormError('Vui lòng nhập email, họ tên, số điện thoại và địa chỉ.');
      return;
    }

    if (!selectedUser && password.length < 8) {
      setFormError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    if (!PHONE_PATTERN.test(phoneNumber)) {
      setFormError('Số điện thoại phải có 10 đến 15 chữ số và có thể bắt đầu bằng +.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      if (selectedUser) {
        const updated = await adminService.updateUser(selectedUser.id, {
          fullName,
          phoneNumber,
          address,
          role: isSelf ? selectedUser.role : formData.role,
          isActive: isSelf ? selectedUser.isActive : formData.isActive,
        });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showFlash(updated.id, 'Đã cập nhật');
      } else {
        const created = await adminService.createUser({
          email,
          password,
          fullName,
          phoneNumber,
          address,
          role: formData.role,
        });
        setUsers((prev) => [created, ...prev]);
        setTotalElements((count) => count + 1);
        showFlash(created.id, 'Đã tạo');
      }
      setShowEditModal(false);
      setSelectedUser(null);
    } catch {
      setFormError(selectedUser ? 'Không thể cập nhật người dùng này.' : 'Không thể tạo người dùng.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    setDeleteSubmitting(true);
    try {
      await adminService.deactivateUser(selectedUser.id);
      setUsers((prev) => prev.map((u) => (
        u.id === selectedUser.id ? { ...u, isActive: false } : u
      )));
      showFlash(selectedUser.id, 'Đã khóa');
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch {
      setError('Không thể khóa người dùng này.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="page-stack">
        {/* Header */}
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Quản lý người dùng</h1>
            <p className="page-subtitle">
              Quản lý vai trò và trạng thái tài khoản · {totalElements} người dùng
            </p>
          </div>
          <button onClick={handleCreate} className="btn-buy inline-flex h-10 items-center justify-center px-4 text-sm">
            Thêm người dùng
          </button>
        </div>

        {/* Search bar */}
        <section className="toolbar-card">
          <div className="space-y-3">
            <div className="app-search-field">
              <svg className="app-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="app-search-input pr-9"
              />
              {searchInput && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Role filter tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRoleFilter(tab.key)}
                  className={`app-tab app-tab-sm ${
                    roleFilter === tab.key
                      ? 'app-tab-active'
                      : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="app-alert-error">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="app-card">
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : users.length === 0 ? (
            <div className="py-6 text-center text-sm font-medium text-gray-500">Không tìm thấy người dùng.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-light text-left">
                    <th className="table-th text-left">EMAIL</th>
                    <th className="table-th text-left">VAI TRÒ</th>
                    <th className="table-th text-left">TRẠNG THÁI</th>
                    <th className="table-th text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const isSelf    = u.id === currentUser?.id;
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-border transition-colors ${i % 2 !== 0 ? 'bg-gray-50/50' : ''} ${isSelf ? 'bg-soft-panel' : ''}`}
                      >
                        {/* Email */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                              {(u.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 leading-tight">
                                {u.email}
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded">bạn</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400 leading-tight">
                                {new Date(u.createdAt).toLocaleDateString('en-US')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          {flash[u.id] ? (
                            <span className="text-xs text-primary font-medium">✓ {flash[u.id]}</span>
                          ) : (
                            <span className={ROLE_BADGE[u.role]}>
                              {ROLE_LABELS[u.role]}
                            </span>
                          )}
                        </td>

                        {/* Active status */}
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.isActive ? 'bg-slate-100 text-primary' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(u)}
                              className="rounded-button border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-40"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={isSelf || !u.isActive}
                              className="rounded-button border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              title={isSelf ? 'Không thể khóa chính tài khoản quản trị của bạn' : undefined}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-light">
              <p className="text-xs text-gray-500">
                Trang {page + 1} / {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs border border-border rounded bg-white disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-xs border border-border rounded bg-white disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
          <span>* Không thể sửa hoặc khóa chính tài khoản quản trị của bạn</span>
          <span>· Xóa sẽ khóa tài khoản trong cơ sở dữ liệu</span>
        </div>

        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={selectedUser ? 'Sửa người dùng' : 'Thêm người dùng'}
        >
          <form onSubmit={handleSubmitEdit} className="space-y-5">
            {formError && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                disabled={!!selectedUser}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
              {!selectedUser && (
                <Input
                  label="Mật khẩu"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                />
              )}
              <Input
                label="Họ tên"
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              />
              <Input
                label="Số điện thoại"
                value={formData.phoneNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Địa chỉ</label>
              <textarea
          value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="min-h-24 w-full rounded-input border border-border bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary focus:shadow-input-focus"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(() => {
                const isSelf = selectedUser?.id === currentUser?.id;
                return (
                  <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Vai trò</label>
                <select
                  value={formData.role}
                  disabled={isSelf}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as EditableRole }))}
                  className="admin-select"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Trạng thái</label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  disabled={isSelf}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                  className="admin-select"
                >
                  <option value="true">Hoạt động</option>
                  <option value="false">Đã khóa</option>
                </select>
              </div>
                  </>
                );
              })()}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-button border border-border bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Hủy
              </button>
              <Button type="submit" loading={formSubmitting} className="!w-full !px-5 !py-2.5 !text-sm sm:!w-auto">
                {selectedUser ? 'Lưu người dùng' : 'Tạo người dùng'}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          loading={deleteSubmitting}
          title="Khóa người dùng"
          message={`Khóa "${selectedUser?.fullName}"? Tài khoản này sẽ không thể đăng nhập cho đến khi được mở lại.`}
        />
      </div>
    </AdminLayout>
  );
};
