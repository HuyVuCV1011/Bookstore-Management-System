import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookApi } from '../services/api/bookApi';
import type { Book } from '../types/book';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

export const BookCatalog: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await bookApi.getAll(page, 12, keyword);
      setBooks(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch books', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [page, keyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-text-primary-light">
              Book Catalog
            </h1>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-text-secondary">{user.fullName}</span>
                  <Button variant="secondary" onClick={handleLogout} className="text-sm">
                    Logout
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate('/login')} className="text-sm">
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="toolbar-card mb-5">
          <div className="toolbar-controls mx-auto">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search books by title..."
              className="app-search-input !pl-4"
            />
            <button
              type="submit"
              className="btn-buy h-11 px-6 text-sm"
            >
              Search
            </button>
          </div>
        </form>

        {/* Book Grid */}
        {loading ? (
          <div className="app-loading-state">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="app-empty-state">
            <p>No books found</p>
          </div>
        ) : (
          <>
            <div className="app-grid-books">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="product-card overflow-hidden rounded-card"
                >
                  {/* Book Cover Placeholder */}
                  <div className="h-64 bg-surface-muted flex items-center justify-center">
                    <span className="text-5xl font-bold text-primary-dark">Book</span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 text-text-primary-light line-clamp-2">
                      {book.title}
                    </h3>

                    <p className="text-sm text-text-secondary mb-1">
                      {book.author.name}
                    </p>

                    <p className="text-sm text-text-secondary mb-3">
                      {book.category.name}
                    </p>

                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-primary">
                        ${book.price}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        book.businessStatus === 'ACTIVE'
                          ? 'bg-slate-100 text-primary'
                          : book.businessStatus === 'OUT_OF_STOCK'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {book.businessStatus === 'ACTIVE' ? 'In Stock' :
                         book.businessStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Discontinued'}
                      </span>
                    </div>

                    {book.stockQuantity !== undefined && (
                      <p className="text-xs text-text-secondary mt-2">
                        Stock: {book.stockQuantity} units
                      </p>
                    )}

                    {book.description && (
                      <p className="text-sm text-text-secondary mt-3 line-clamp-3">
                        {book.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded-button border border-border bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary hover:text-primary"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-text-secondary">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-button border border-border bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary hover:text-primary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
