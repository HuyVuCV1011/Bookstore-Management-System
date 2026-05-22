import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { SearchBar } from '../../components/admin/SearchBar';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { CategoryForm } from '../../components/admin/category/CategoryForm';
import { categoryApi } from '../../services/api/categoryApi';
import type { Category, CategoryRequest } from '../../types/category';

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getAll(page, 20, keyword);
      setCategories(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, keyword]);

  const handleCreate = () => {
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (data: CategoryRequest) => {
    try {
      if (selectedCategory) {
        await categoryApi.update(selectedCategory.id, data);
      } else {
        await categoryApi.create(data);
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;
    try {
      await categoryApi.delete(selectedCategory.id);
      setShowDeleteDialog(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category', error);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Tên' },
    { key: 'description', label: 'Mô tả' },
  ];

  return (
    <AdminLayout>
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Thể loại</h1>
            <p className="page-subtitle">Quản lý thông tin thể loại sản phẩm.</p>
          </div>
          <button onClick={handleCreate} className="btn-buy inline-flex h-10 items-center justify-center px-4 text-sm">
            Thêm thể loại
          </button>
        </div>

        <section className="toolbar-card">
          <div className="toolbar-controls">
            <SearchBar value={keyword} onChange={setKeyword} placeholder="Tìm kiếm thể loại..." />
          </div>
        </section>

        <DataTable
          columns={columns}
          data={categories}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedCategory ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
        >
          <CategoryForm
            initialData={selectedCategory || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Xóa thể loại"
          message={`Bạn có chắc chắn muốn xóa thể loại "${selectedCategory?.name}"?`}
        />
      </div>
    </AdminLayout>
  );
};
