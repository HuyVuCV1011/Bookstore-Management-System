import React, { useState, useEffect } from 'react';
import { bookApi } from '../../services/api/bookApi';
import type { Book } from '../../types/book';

interface BookSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (book: Book) => void;
}

export const BookSearchModal: React.FC<BookSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectBook,
}) => {
  const [keyword, setKeyword] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const searchBooks = async () => {
    setLoading(true);
    try {
      const response = await bookApi.getAll(page, 10, keyword);
      setBooks(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Failed to search books', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      searchBooks();
    }
  }, [isOpen, page, keyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    searchBooks();
  };

  const handleSelect = (book: Book) => {
    onSelectBook(book);
    onClose();
    setKeyword('');
    setPage(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Tìm sách</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên sách hoặc ISBN..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tìm...</div>
          ) : books.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy sách nào
            </div>
          ) : (
            <div className="space-y-2">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleSelect(book)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{book.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">ISBN: {book.isbn || 'N/A'}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {book.price.toLocaleString('vi-VN')} ₫
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tồn kho: {book.stockQuantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSearchModal;
