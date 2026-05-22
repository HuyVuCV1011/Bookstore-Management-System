import React, { useEffect, useState, useMemo } from 'react';
import { graphService } from '../services/graphService';
import type { BookListItem } from '../types/graph.types';
import { bookApi } from '../services/api/bookApi';
import type { Book } from '../types/book';
import type { RatingSummary } from '../types';
import { BookCard } from '../components/graph/BookCard';
import { AppLayout } from '../components/layout/AppLayout';

type SortKey = 'sold' | 'rating' | 'price_asc' | 'price_desc' | 'title';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'sold',       label: 'Bán chạy nhất' },
  { key: 'rating',     label: 'Đánh giá cao nhất' },
  { key: 'price_asc',  label: 'Giá: Thấp đến cao' },
  { key: 'price_desc', label: 'Giá: Cao đến thấp' },
  { key: 'title',      label: 'Tên sách A-Z' },
];

export const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [graphByIsbn, setGraphByIsbn] = useState<Record<string, BookListItem>>({});
  const [ratingsById, setRatingsById] = useState<Record<number, RatingSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('sold');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      bookApi.getAll(0, 500),
      graphService.getAllBooks(500).catch(() => [] as BookListItem[]),
    ])
      .then(async ([bookRes, graphBooks]) => {
        const booksData = bookRes.data.content;
        setBooks(booksData);
        setGraphByIsbn(
          graphBooks.reduce<Record<string, BookListItem>>((acc, book) => {
            if (book.isbn) acc[book.isbn] = book;
            return acc;
          }, {})
        );

        // Fetch MongoDB ratings for all books
        const bookIds = booksData.map(b => b.id).filter(Boolean) as number[];
        if (bookIds.length > 0) {
          try {
            const response = await fetch('http://localhost:8080/api/reviews/summaries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bookIds),
            });
            const ratings = await response.json();
            setRatingsById(ratings);
          } catch (err) {
            console.error('Failed to fetch rating summaries:', err);
          }
        }
      })
      .catch(() => setError('Không thể tải danh sách sách từ cơ sở dữ liệu.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    books.forEach((b) => {
      if (b.category?.id && b.category?.name) map.set(String(b.category.id), b.category.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [books]);

  const filtered = useMemo(() => {
    let result = [...books];
    if (activeCategory !== 'ALL') {
      result = result.filter((b) => String(b.category.id) === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.isbn?.toLowerCase().includes(q) ||
          b.author?.name?.toLowerCase().includes(q) ||
          b.category?.name?.toLowerCase().includes(q) ||
          b.publisher?.name?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const graphA = a.isbn ? graphByIsbn[a.isbn] : undefined;
      const graphB = b.isbn ? graphByIsbn[b.isbn] : undefined;
      const ratingA = a.id ? ratingsById[a.id] : undefined;
      const ratingB = b.id ? ratingsById[b.id] : undefined;
      switch (sortKey) {
        case 'sold':       return (graphB?.purchaseCount ?? 0) - (graphA?.purchaseCount ?? 0);
        case 'rating':     return (ratingB?.averageRating ?? 0) - (ratingA?.averageRating ?? 0);
        case 'price_asc':  return (a.price ?? 0) - (b.price ?? 0);
        case 'price_desc': return (b.price ?? 0) - (a.price ?? 0);
        case 'title':      return (a.title ?? '').localeCompare(b.title ?? '', 'en');
        default:           return 0;
      }
    });
    return result;
  }, [books, activeCategory, search, sortKey, graphByIsbn, ratingsById]);

  return (
    <AppLayout>
      <div className="page-stack">
        {/* Cream Hero Panel */}
        <div className="bg-[#f2f0eb] rounded-2xl p-8 md:p-12 mb-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#edebe9]">
          <div className="flex-1 space-y-4">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#00754A]">Siren Reads Bookstore flagship</span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#1E3932] font-serif leading-tight">
              Khám phá những trang sách tuyệt vời tại Siren Reads 📚
            </h1>
            <p className="text-gray-700 max-w-xl text-sm md:text-base leading-relaxed">
              Chào mừng bạn đến với Siren Reads. Khám phá những câu chuyện thú vị, quản lý giỏ hàng cá nhân, tích lũy điểm thưởng và nhận các đề xuất sách được cá nhân hóa đặc biệt dành riêng cho bạn.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  const searchEl = document.querySelector('.app-search-input') as HTMLInputElement;
                  searchEl?.focus();
                }}
                className="bg-[#00754A] text-white hover:bg-[#006241] font-bold text-xs tracking-wider uppercase rounded-full px-6 py-3.5 transition-all duration-200 active:scale-95 shadow-md cursor-pointer"
              >
                Tìm sách ngay
              </button>
            </div>
          </div>
          <div className="w-full md:w-1/3 flex justify-center">
            <span className="text-[100px] md:text-[120px] filter drop-shadow-md select-none animate-bounce" style={{ animationDuration: '3s' }}>📚</span>
          </div>
        </div>

        {/* Catalog Section Header */}
        <div className="mt-4">
          <h2 className="text-2xl font-extrabold text-[#006241]">Danh mục sách</h2>
          <p className="text-sm text-gray-500 mt-1">
            {books.length} sách · đang hiển thị {filtered.length}
          </p>
        </div>

        {/* Search + Sort */}
        <section className="toolbar-card">
          <div className="toolbar-content">
            <div>
              <h2 className="section-title">Duyệt sách</h2>
              <p className="section-subtitle">Tìm kiếm theo tên sách, ISBN, tác giả, thể loại hoặc nhà xuất bản.</p>
            </div>
            <div className="toolbar-controls">
              <div className="app-search-field flex-1">
                <svg className="app-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, ISBN, tác giả..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="app-search-input"
                />
              </div>

              <div className="relative sm:w-52">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="app-select w-full appearance-none pr-9"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Category tabs */}
        {!loading && categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`app-tab app-tab-sm app-tab-category ${
                activeCategory === 'ALL'
                  ? 'app-tab-active'
                  : ''
              }`}
            >
              Tất cả ({books.length})
            </button>
            {categories.map((cat) => {
              const count = books.filter((b) => String(b.category.id) === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`app-tab app-tab-sm app-tab-category ${
                    activeCategory === cat.id
                      ? 'app-tab-active'
                      : ''
                  }`}
                  title={`${cat.name} (${count})`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Siren Rewards Feature Banner */}
        <div className="bg-[#1E3932] text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-[#006241]">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-widest uppercase bg-[#00754A] text-white">
              Siren Rewards Bookstore ✨
            </span>
            <h3 className="text-xl md:text-2xl font-bold font-serif">
              Tích lũy Ngôi Sao - Đổi ngàn Sách hay 🌟
            </h3>
            <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
              Mỗi 10.000đ thanh toán qua ứng dụng Bookstore sẽ tích lũy ngay 1★. Đổi điểm thưởng để sở hữu những tựa sách yêu thích của bạn hoàn toàn miễn phí!
            </p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-3 md:gap-4 shrink-0 w-full md:w-auto">
            <div className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3 text-center transition-all min-w-[100px]">
              <span className="block text-lg font-bold text-[#cba258]">100 ★</span>
              <span className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold">Thiếu nhi / Truyện tranh</span>
            </div>
            <div className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3 text-center transition-all min-w-[100px]">
              <span className="block text-lg font-bold text-[#cba258]">200 ★</span>
              <span className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold">Văn học / Kỹ năng</span>
            </div>
            <div className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3 text-center transition-all min-w-[100px]">
              <span className="block text-lg font-bold text-[#cba258]">300 ★</span>
              <span className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold">Khoa học / Ngoại ngữ</span>
            </div>
            <div className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3 text-center transition-all min-w-[100px]">
              <span className="block text-lg font-bold text-[#cba258]">400 ★</span>
              <span className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold">Bản giới hạn / Chữ ký</span>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="app-loading-state">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {error && (
          <div className="app-alert-error">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="app-empty-state">
            <p>Không tìm thấy sách phù hợp.</p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-2 text-sm font-semibold text-primary hover:underline">
                Xóa tìm kiếm
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="app-grid-books">
            {filtered.map((book) => {
              const graph = book.isbn ? graphByIsbn[book.isbn] : undefined;
              const rating = book.id ? ratingsById[book.id] : undefined;
              return (
                <BookCard
                  key={book.isbn ?? book.id}
                  isbn={book.isbn ?? String(book.id)}
                  title={book.title ?? ''}
                  price={book.price}
                  avgRating={rating?.averageRating || 0}
                  ratingCount={rating?.totalReviews ? Number(rating.totalReviews) : 0}
                  purchaseCount={graph?.purchaseCount}
                  viewCount={graph?.viewCount}
                  coverUrl={graph?.coverUrl || book.coverUrl}
                  authorName={book.author?.name}
                  categoryName={book.category?.name}
                  status={book.businessStatus}
                  stockQuantity={book.stockQuantity}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
