import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { SearchBar } from '../../components/admin/SearchBar';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { PublisherForm } from '../../components/admin/publisher/PublisherForm';
import { publisherApi } from '../../services/api/publisherApi';
import type { Publisher, PublisherRequest } from '../../types/publisher';

export const PublisherManagement: React.FC = () => {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);

  const fetchPublishers = async () => {
    setLoading(true);
    try {
      const res = await publisherApi.getAll(page, 20, keyword);
      setPublishers(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch publishers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishers();
  }, [page, keyword]);

  const handleCreate = () => {
    setSelectedPublisher(null);
    setShowModal(true);
  };

  const handleEdit = (publisher: Publisher) => {
    setSelectedPublisher(publisher);
    setShowModal(true);
  };

  const handleDelete = (publisher: Publisher) => {
    setSelectedPublisher(publisher);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (data: PublisherRequest) => {
    try {
      if (selectedPublisher) {
        await publisherApi.update(selectedPublisher.id, data);
      } else {
        await publisherApi.create(data);
      }
      setShowModal(false);
      fetchPublishers();
    } catch (error) {
      console.error('Failed to save publisher', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPublisher) return;
    try {
      await publisherApi.delete(selectedPublisher.id);
      setShowDeleteDialog(false);
      fetchPublishers();
    } catch (error) {
      console.error('Failed to delete publisher', error);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Tên' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
  ];

  return (
    <AdminLayout>
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Nhà xuất bản</h1>
            <p className="page-subtitle">Quản lý nhà xuất bản details for catalog records.</p>
          </div>
          <button onClick={handleCreate} className="btn-buy inline-flex h-10 items-center justify-center px-4 text-sm">
            Thêm nhà xuất bản
          </button>
        </div>

        <section className="toolbar-card">
          <div className="toolbar-controls">
            <SearchBar value={keyword} onChange={setKeyword} placeholder="Tìm kiếm nhà xuất bản..." />
          </div>
        </section>

        <DataTable
          columns={columns}
          data={publishers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedPublisher ? 'Chỉnh sửa nhà xuất bản' : 'Thêm nhà xuất bản mới'}
        >
          <PublisherForm
            initialData={selectedPublisher || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Xóa nhà xuất bản"
          message={`Are you sure you want to delete "${selectedPublisher?.name}"?`}
        />
      </div>
    </AdminLayout>
  );
};
