import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { SearchBar } from '../../components/admin/SearchBar';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { Badge } from '../../components/admin/Badge';
import { BookForm } from '../../components/admin/book/BookForm';
import { BookCover } from '../../components/common/BookCover';
import { bookApi } from '../../services/api/bookApi';
import { graphService } from '../../services/graphService';
import { useAuth } from '../../contexts/AuthContext';
import type { Book, BookRequest } from '../../types/book';
import type { BookListItem } from '../../types/graph.types';

export const BookManagement: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [graphByIsbn, setGraphByIsbn] = useState<Record<string, BookListItem>>({});
  const canDeleteBooks = user?.role === 'ADMIN';

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const [res, graphBooks] = await Promise.all([
        bookApi.getAll(page, 20, keyword),
        graphService.getAllBooks(500).catch(() => [] as BookListItem[]),
      ]);
      setBooks(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalBooks(res.data.totalElements);
      setGraphByIsbn(
        graphBooks.reduce<Record<string, BookListItem>>((acc, book) => {
          if (book.isbn) acc[book.isbn] = book;
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Failed to fetch books', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [page, keyword]);

  const handleCreate = () => {
    setSelectedBook(null);
    setShowModal(true);
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setShowModal(true);
  };

  const handleDelete = (book: Book) => {
    if (!canDeleteBooks) return;
    setSelectedBook(book);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (data: BookRequest) => {
    try {
      if (selectedBook) {
        await bookApi.update(selectedBook.id, data);
      } else {
        await bookApi.create(data);
      }
      setShowModal(false);
      fetchBooks();
    } catch (error) {
      console.error('Failed to save book', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBook) return;
    try {
      await bookApi.delete(selectedBook.id);
      setShowDeleteDialog(false);
      fetchBooks();
    } catch (error) {
      console.error('Failed to delete book', error);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Product',
      render: (book: Book) => {
        const graph = book.isbn ? graphByIsbn[book.isbn] : undefined;
        return (
          <div className="flex min-w-[260px] items-center gap-3">
            <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-card border border-border bg-gray-50">
              <BookCover
                title={book.title}
                isbn={book.isbn}
                coverUrl={graph?.coverUrl || book.coverUrl}
                subtitle={book.category?.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 font-semibold text-gray-900">{book.title}</p>
              <p className="mt-1 text-xs text-gray-500">ISBN: {book.isbn || 'Chưa cập nhật'}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {book.publisher?.name || 'Không có NXB'} · {book.publicationYear || 'Chưa có năm'}
              </p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'author',
      label: 'Tác giả',
      render: (book: Book) => <span className="font-medium text-gray-800">{book.author.name}</span>
    },
    {
      key: 'category',
      label: 'Thể loại',
      render: (book: Book) => (
        <span className="block max-w-[150px] text-sm font-medium leading-snug text-gray-700">
          {book.category.name}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Giá',
      render: (book: Book) => (
        <span className="price-tag">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)}
        </span>
      )
    },
    {
      key: 'stockQuantity',
      label: 'Tồn kho',
      render: (book: Book) => (
        <span className={`font-semibold ${book.stockQuantity > 0 ? 'text-gray-800' : 'text-red-600'}`}>
          {book.stockQuantity}
        </span>
      )
    },
    {
      key: 'graphMetrics',
      label: 'Hoạt động',
      render: (book: Book) => {
        const graph = book.isbn ? graphByIsbn[book.isbn] : undefined;
        if (!graph) {
          return <span className="text-xs font-medium text-gray-400">Chưa đồng bộ</span>;
        }

        return (
          <div className="min-w-[150px] space-y-1 text-xs text-gray-600">
            {graph.avgRating != null && graph.avgRating > 0 ? (
              <div className="flex items-center gap-1">
                <span className="text-sm font-extrabold text-primary-dark">{graph.avgRating.toFixed(1)}</span>
                <span className="font-semibold text-gray-600">điểm</span>
                {(graph.ratingCount ?? 0) > 0 && (
                  <span className="text-gray-400">({graph.ratingCount} đánh giá)</span>
                )}
              </div>
            ) : (
              <div className="font-medium text-gray-400">Chưa có đánh giá</div>
            )}
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <span>Đã bán {graph.purchaseCount ?? 0}</span>
              <span>{graph.viewCount ?? 0} lượt xem</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'businessStatus',
      label: 'Trạng thái',
      render: (book: Book) => <Badge status={book.businessStatus} />
    },
  ];

  const initialFormData = selectedBook ? {
    title: selectedBook.title,
    isbn: selectedBook.isbn,
    coverUrl: selectedBook.coverUrl,
    publicationYear: selectedBook.publicationYear,
    price: selectedBook.price,
    description: selectedBook.description,
    businessStatus: selectedBook.businessStatus,
    storageLocation: selectedBook.storageLocation,
    stockQuantity: selectedBook.stockQuantity,
    categoryId: selectedBook.category.id,
    authorId: selectedBook.author.id,
    publisherId: selectedBook.publisher.id,
  } : undefined;

  return (
    <AdminLayout>
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Quản lý sách</h1>
            <p className="page-subtitle">
              Tạo và cập nhật giá, tồn kho, trạng thái kinh doanh và thông tin sách.
            </p>
          </div>
          <button onClick={handleCreate} className="btn-buy inline-flex h-10 items-center justify-center px-4 text-sm">
            Thêm sách mới
          </button>
        </div>

        <section className="stats-grid">
          <SummaryCard label="Tổng số sách" value={totalBooks.toLocaleString('vi-VN')} />
          <SummaryCard
            label="Đang hoạt động"
            value={books.filter((book) => book.businessStatus === 'ACTIVE').length.toLocaleString('vi-VN')}
          />
          <SummaryCard
            label="Đã đồng bộ Graph DB"
            value={books.filter((book) => book.isbn && graphByIsbn[book.isbn]).length.toLocaleString('vi-VN')}
          />
          <SummaryCard
            label="Hết hàng"
            value={books.filter((book) => book.businessStatus === 'OUT_OF_STOCK' || book.stockQuantity === 0).length.toLocaleString('vi-VN')}
          />
        </section>

        <div className="toolbar-card">
          <div className="toolbar-content">
            <div>
              <h2 className="section-title">Danh sách sách</h2>
              <p className="section-subtitle">Tìm kiếm theo tên, ISBN hoặc thông tin liên quan.</p>
            </div>
            <div className="toolbar-controls">
              <SearchBar value={keyword} onChange={(value) => { setPage(0); setKeyword(value); }} placeholder="Tìm kiếm sách theo tên hoặc ISBN..." />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={books}
          onEdit={handleEdit}
          onDelete={canDeleteBooks ? handleDelete : undefined}
          loading={loading}
        />

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
        >
          <BookForm
            initialData={initialFormData}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Xóa sách"
          message={`Bạn có chắc chắn muốn xóa "${selectedBook?.title}"?`}
        />
      </div>
    </AdminLayout>
  );
};

const SummaryCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="stat-card">
    <p className="stat-label">{label}</p>
    <p className="stat-value">{value}</p>
  </div>
);
