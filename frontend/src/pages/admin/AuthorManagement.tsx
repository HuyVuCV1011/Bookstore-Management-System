import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { SearchBar } from '../../components/admin/SearchBar';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { AuthorForm } from '../../components/admin/author/AuthorForm';
import { authorApi } from '../../services/api/authorApi';
import type { Author, AuthorRequest } from '../../types/author';

export const AuthorManagement: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const res = await authorApi.getAll(page, 20, keyword);
      setAuthors(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch authors', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, [page, keyword]);

  const handleCreate = () => {
    setSelectedAuthor(null);
    setShowModal(true);
  };

  const handleEdit = (author: Author) => {
    setSelectedAuthor(author);
    setShowModal(true);
  };

  const handleDelete = (author: Author) => {
    setSelectedAuthor(author);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (data: AuthorRequest) => {
    try {
      if (selectedAuthor) {
        await authorApi.update(selectedAuthor.id, data);
      } else {
        await authorApi.create(data);
      }
      setShowModal(false);
      fetchAuthors();
    } catch (error) {
      console.error('Failed to save author', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAuthor) return;
    try {
      await authorApi.delete(selectedAuthor.id);
      setShowDeleteDialog(false);
      fetchAuthors();
    } catch (error) {
      console.error('Failed to delete author', error);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Tên' },
    { key: 'biography', label: 'Tiểu sử' },
  ];

  return (
    <AdminLayout>
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Tác giả</h1>
            <p className="page-subtitle">Quản lý hồ sơ tác giả được sử dụng trong danh mục.</p>
          </div>
          <button onClick={handleCreate} className="btn-buy inline-flex h-10 items-center justify-center px-4 text-sm">
            Thêm tác giả
          </button>
        </div>

        <section className="toolbar-card">
          <div className="toolbar-controls">
            <SearchBar value={keyword} onChange={setKeyword} placeholder="Tìm kiếm tác giả..." />
          </div>
        </section>

        <DataTable
          columns={columns}
          data={authors}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedAuthor ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
        >
          <AuthorForm
            initialData={selectedAuthor || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Xóa tác giả"
          message={`Bạn có chắc chắn muốn xóa tác giả "${selectedAuthor?.name}"?`}
        />
      </div>
    </AdminLayout>
  );
};
