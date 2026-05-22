import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistApi } from '../services/api/wishlistApi';
import { bookApi } from '../services/api/bookApi';
import { graphService } from '../services/graphService';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { BookCard } from '../components/graph/BookCard';
import type { Book } from '../types/book';
import type { BookListItem } from '../types/graph.types';

export const WishlistPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [graphByIsbn, setGraphByIsbn] = useState<Record<string, BookListItem>>({});
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      let bookIds: number[] = [];

      if (user) {
        // Fetch from backend for authenticated users
        const res = await wishlistApi.getWishlist();
        bookIds = res.data.bookIds || [];
      } else {
        // Load from localStorage for guest users
        const guestWishlist = localStorage.getItem('bookstore_guest_wishlist');
        bookIds = guestWishlist ? JSON.parse(guestWishlist) : [];
      }

      // Fetch details for each book
      if (bookIds.length > 0) {
        const [bookResponses, graphBooks] = await Promise.all([
          Promise.all(bookIds.map((id: number) => bookApi.getById(id))),
          graphService.getAllBooks(500).catch(() => [] as BookListItem[])
        ]);

        setBooks(bookResponses.map((r: any) => r.data));

        // Create map of graph data by ISBN
        const graphMap = graphBooks.reduce<Record<string, BookListItem>>((acc, item) => {
          if (item.isbn) acc[item.isbn] = item;
          return acc;
        }, {});
        setGraphByIsbn(graphMap);
      } else {
        setBooks([]);
        setGraphByIsbn({});
      }
    } catch (error) {
      console.error('Failed to load wishlist', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const handleRemove = async (bookId: number) => {
    try {
      if (user) {
        // Remove from backend for authenticated users
        await wishlistApi.removeItem(bookId);
      } else {
        // Remove from localStorage for guest users
        const guestWishlist = localStorage.getItem('bookstore_guest_wishlist');
        const bookIds: number[] = guestWishlist ? JSON.parse(guestWishlist) : [];
        const updatedIds = bookIds.filter(id => id !== bookId);
        localStorage.setItem('bookstore_guest_wishlist', JSON.stringify(updatedIds));
      }
      setBooks(books.filter(b => b.id !== bookId));

      // Dispatch event to update wishlist count in navbar
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      alert('Không thể xóa khỏi danh sách yêu thích');
    }
  };

  return (
    <AppLayout>
      <div className="page-stack">
        {/* Page Header */}
        <div className="app-card-muted app-card-pad flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="page-title">Danh sách yêu thích</h1>
            <p className="page-subtitle">Lưu những cuốn sách yêu thích để đọc sau</p>
          </div>
          <div className="inline-flex h-10 shrink-0 items-center justify-center rounded-button bg-primary/10 px-4 text-sm font-semibold text-primary">
            {books.length} {books.length === 1 ? 'sách' : 'sách'}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="app-card-muted app-card-pad text-center py-16">
            <div className="text-6xl mb-4">💖</div>
            <h2 className="section-title mb-2">Danh sách yêu thích trống</h2>
            <p className="section-subtitle mb-6 max-w-md mx-auto">
              Bắt đầu thêm những cuốn sách bạn muốn đọc trong tương lai
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-buy inline-flex h-10 items-center justify-center px-6 text-sm"
            >
              Duyệt sách →
            </button>
          </div>
        ) : (
          <div className="app-grid-books">
            {books.map(book => {
              const graph = book.isbn ? graphByIsbn[book.isbn] : undefined;
              return (
                <div key={book.id} className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(book.id);
                    }}
                    className="absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white hover:shadow-md"
                    title="Xóa khỏi danh sách yêu thích"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <BookCard
                    isbn={book.isbn ?? String(book.id)}
                    title={book.title}
                    price={book.price}
                    avgRating={graph?.avgRating}
                    ratingCount={graph?.ratingCount}
                    purchaseCount={graph?.purchaseCount}
                    viewCount={graph?.viewCount}
                    coverUrl={graph?.coverUrl || book.coverUrl}
                    authorName={book.author.name}
                    categoryName={book.category?.name}
                    status={book.businessStatus}
                    stockQuantity={book.stockQuantity}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
