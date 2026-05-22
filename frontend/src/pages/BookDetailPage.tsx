import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { graphService } from '../services/graphService';
import { bookApi } from '../services/api/bookApi';
import { wishlistApi } from '../services/api/wishlistApi';
import { reviewApi } from '../services/api/reviewApi';
import type { BookDetail, BookListItem, BookRecommendation, BookReview } from '../types/graph.types';
import type { Book } from '../types/book';
import type { Review } from '../types';
import { BookCard } from '../components/graph/BookCard';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { BookCover } from '../components/common/BookCover';

const VIEW_SESSION_KEY = 'bookstore.productViewSessionId';
const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

const StarIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d={STAR_PATH} />
  </svg>
);

const BookFormatIcon: React.FC<{ format: 'PAPERBACK' | 'HARDCOVER' | 'DELUXE' | 'COLLECTOR'; active: boolean }> = ({ format, active }) => {
  const sizes = {
    PAPERBACK: 'w-5 h-5',
    HARDCOVER: 'w-6 h-6',
    DELUXE: 'w-7 h-7',
    COLLECTOR: 'w-8 h-8',
  };
  return (
    <div className={`flex items-center justify-center rounded-full transition-all duration-200 ${active ? 'ring-2 ring-[#00754A] p-2 bg-[#d4e9e2]/30' : 'p-2 border border-transparent hover:border-gray-200'}`}>
      <svg className={`${sizes[format]} text-[#00754A]`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
  );
};

const getProductViewSessionId = () => {
  const existing = sessionStorage.getItem(VIEW_SESSION_KEY);
  if (existing) return existing;

  const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(VIEW_SESSION_KEY, id);
  return id;
};

const getInitials = (name?: string | null) => {
  const source = (name || 'Customer').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatReviewDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ').slice(0, 16);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeRatingEligibilityMessage = (message?: string | null) => {
  if (!message) return 'Chỉ khách hàng đã hoàn tất đơn hàng có sách này mới có thể đánh giá';
  if (message.includes('completed order') || message.includes('completed this purchase')) {
    return 'Đăng nhập bằng tài khoản khách hàng đã mua sách này để đánh giá';
  }
  return message.replace(/\.$/, '');
};

export const BookDetailPage: React.FC = () => {
  const { isbn } = useParams<{ isbn: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart: addToCartContext } = useCart();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [similarBooks, setSimilarBooks] = useState<BookRecommendation[]>([]);
  const [boughtTogether, setBoughtTogether] = useState<BookRecommendation[]>([]);
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [mongoReviews, setMongoReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [catalogByIsbn, setCatalogByIsbn] = useState<Record<string, Book>>({});
  const [graphByIsbn, setGraphByIsbn] = useState<Record<string, BookListItem>>({});
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [ratingAllowed, setRatingAllowed] = useState(false);
  const [ratingEligibilityMessage, setRatingEligibilityMessage] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  // Custom format & options states
  const [selectedFormat, setSelectedFormat] = useState<'PAPERBACK' | 'HARDCOVER' | 'DELUXE' | 'COLLECTOR'>('HARDCOVER');
  const [bookmarkOption, setBookmarkOption] = useState('Bookmark Siren Reads');
  const [wrapOption, setWrapOption] = useState('Đóng gói tiêu chuẩn');
  const [extraBookmarkCount, setExtraBookmarkCount] = useState(0);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  useEffect(() => {
    if (!isbn) return;
    setLoading(true);
    setBook(null);
    setSimilarBooks([]);
    setBoughtTogether([]);
    setReviews([]);
    setMongoReviews([]);
    setUserReview(null);
    setCatalogByIsbn({});
    setGraphByIsbn({});
    setIsEditingReview(false);
    setRatingAllowed(false);
    setRatingEligibilityMessage('');
    setRatingError('');
    setRating(0);
    setReviewText('');
    setQuantity(1);
    setIsInWishlist(false);
    setCartSuccess(false);
    setSelectedFormat('HARDCOVER');
    setBookmarkOption('Bookmark Siren Reads');
    setWrapOption('Đóng gói tiêu chuẩn');
    setExtraBookmarkCount(0);
    setShowCustomizeModal(false);

    const viewPromise = graphService.recordView({
      customerId: user?.id ?? '',
      isbn,
      durationSeconds: 0,
      sessionId: getProductViewSessionId(),
    }).catch(() => {});

    viewPromise.then(() => Promise.all([
      graphService.getBookDetail(isbn),
      graphService.getContentBasedRecommendations(isbn),
      graphService.getBoughtTogetherRecommendations(isbn),
      graphService.getBookReviews(isbn).catch(() => [] as BookReview[]),
      bookApi.getAll(0, 500).catch(() => null),
      graphService.getAllBooks(500).catch(() => [] as BookListItem[]),
      user?.id
        ? graphService.getRatingEligibility(isbn).catch(() => ({
            canRate: false,
            message: 'Chỉ khách hàng đã hoàn tất đơn hàng có sách này mới có thể đánh giá',
          }))
        : Promise.resolve({
            canRate: false,
            message: 'Đăng nhập bằng tài khoản khách hàng đã mua sách này để đánh giá',
          }),
    ]))
      .then(([detail, similar, together, bookReviews, catalogRes, graphBooks, eligibility]) => {
        setBook(detail);
        setSimilarBooks(similar);
        setBoughtTogether(together);
        setReviews(bookReviews);
        setRatingAllowed(eligibility.canRate);
        setRatingEligibilityMessage(eligibility.message);
        setCatalogByIsbn(
          (catalogRes?.data.content ?? []).reduce<Record<string, Book>>((acc, item) => {
            if (item.isbn) acc[item.isbn] = item;
            return acc;
          }, {})
        );
        setGraphByIsbn(
          graphBooks.reduce<Record<string, BookListItem>>((acc, item) => {
            if (item.isbn) acc[item.isbn] = item;
            return acc;
          }, {})
        );
        const catalog = isbn ? (catalogRes?.data.content ?? []).find(b => b.isbn === isbn) : undefined;
        if (catalog?.id) {
          reviewApi.getByBook(catalog.id, undefined, 0, 50)
            .then((res) => {
              const content = res.data.content ?? [];
              setMongoReviews(content);

              if (user?.id) {
                const existingReview = content.find((item) => item.userId === user.id);
                if (existingReview) {
                  setUserReview(existingReview);
                  setRating(existingReview.rating);
                  setReviewText(existingReview.comment ?? '');
                }
              }
            })
            .catch(() => setMongoReviews([]));

          if (user?.id) {
            // Check backend for authenticated users
            wishlistApi.checkItem(catalog.id)
              .then((res) => setIsInWishlist(res.data))
              .catch(() => setIsInWishlist(false));
          } else {
            // Check localStorage for guest users
            try {
              const guestWishlist = localStorage.getItem('bookstore_guest_wishlist');
              const bookIds: number[] = guestWishlist ? JSON.parse(guestWishlist) : [];
              setIsInWishlist(bookIds.includes(catalog.id));
            } catch {
              setIsInWishlist(false);
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [isbn, user?.id]);

  const handleSubmitRating = async () => {
    if (!rating || !isbn || !user?.id) return;
    if (!isEditingReview && !ratingAllowed) return;

    setRatingSubmitting(true);
    setRatingError('');
    try {
      const bookId = catalogBook?.id;
      if (!bookId) {
        setRatingError('Không tìm thấy thông tin sách để gửi đánh giá');
        return;
      }

      if (userReview && isEditingReview) {
        await reviewApi.update(userReview.id, {
          rating,
          comment: reviewText || '',
        });
      } else {
        await reviewApi.create({
          bookId,
          rating,
          comment: reviewText || '',
        });
      }

      const [updatedDetail, updatedReviews, updatedMongoReviews] = await Promise.all([
        graphService.getBookDetail(isbn),
        graphService.getBookReviews(isbn).catch(() => [] as BookReview[]),
        reviewApi.getByBook(bookId, undefined, 0, 50),
      ]);
      if (updatedDetail) {
        setBook(updatedDetail);
        setGraphByIsbn((current) => {
          const currentBook = current[isbn];
          if (!currentBook) return current;

          return {
            ...current,
            [isbn]: {
              ...currentBook,
              avgRating: updatedDetail.avgRating,
              ratingCount: updatedDetail.ratingCount ?? 0,
              purchaseCount: updatedDetail.purchaseCount ?? currentBook.purchaseCount,
              viewCount: updatedDetail.viewCount ?? currentBook.viewCount,
            },
          };
        });
      }
      setReviews(updatedReviews);
      const content = updatedMongoReviews.data.content ?? [];
      setMongoReviews(content);
      setUserReview(content.find((item) => item.userId === user.id) ?? null);
      setIsEditingReview(false);
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      setRatingError(normalizeRatingEligibilityMessage(apiError.response?.data?.message) ?? 'Chưa thể gửi đánh giá lúc này.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const catalogBook = isbn ? catalogByIsbn[isbn] : undefined;
  const graphBook = isbn ? graphByIsbn[isbn] : undefined;
  const stockQuantity = catalogBook?.stockQuantity;
  const maxQuantity = Math.max(1, Math.min(stockQuantity ?? 99, 99));
  const canAddToCart = stockQuantity == null || stockQuantity > 0;
  const approvedMongoReviews = mongoReviews.filter((item) => item.moderated);
  const visibleMongoReviews = mongoReviews.filter((item) => item.moderated || item.userId === user?.id);
  const mongoAverageRating = approvedMongoReviews.length > 0
    ? approvedMongoReviews.reduce((sum, item) => sum + item.rating, 0) / approvedMongoReviews.length
    : null;
  const displayAverageRating = mongoAverageRating ?? (graphBook?.avgRating ?? book?.avgRating ?? null);
  const displayRatingCount = approvedMongoReviews.length > 0
    ? approvedMongoReviews.length
    : ((graphBook?.ratingCount ?? book?.ratingCount) ?? 0);

  // Dynamic pricing based on formats and options
  const basePrice = catalogBook?.price ?? graphBook?.price ?? book?.price ?? 0;
  const formatMultiplier = {
    PAPERBACK: 0.9,
    HARDCOVER: 1.0,
    DELUXE: 1.25,
    COLLECTOR: 1.5,
  };
  const wrapPrice = wrapOption.includes('gỗ') ? 20000 : wrapOption.includes('kraft') ? 10000 : 0;
  const extraBookmarkPrice = extraBookmarkCount * 15000;
  const dynamicPrice = Math.round(basePrice * formatMultiplier[selectedFormat] + wrapPrice + extraBookmarkPrice);

  const getRewardsStars = (price: number) => {
    if (price < 100000) return 100;
    if (price < 200000) return 200;
    if (price < 300000) return 300;
    return 400;
  };
  const rewardsStars = getRewardsStars(basePrice);

  const adjustQuantity = (delta: number) => {
    setQuantity((current) => Math.min(maxQuantity, Math.max(1, current + delta)));
  };

  const handleAddToCart = async () => {
    if (!catalogBook?.id) return;
    setAddingToCart(true);
    try {
      // Use CartContext's addToCart method - works for both guest and authenticated users
      await addToCartContext(catalogBook.id, quantity);
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!catalogBook?.id) return;
    setAddingToWishlist(true);
    try {
      if (isInWishlist) {
        if (user) {
          await wishlistApi.removeItem(catalogBook.id);
        } else {
          const guestWishlist = localStorage.getItem('bookstore_guest_wishlist');
          const bookIds: number[] = guestWishlist ? JSON.parse(guestWishlist) : [];
          localStorage.setItem(
            'bookstore_guest_wishlist',
            JSON.stringify(bookIds.filter((id) => id !== catalogBook.id))
          );
        }
        setIsInWishlist(false);
      } else {
        if (user) {
          await wishlistApi.addItem(catalogBook.id);
        } else {
          const guestWishlist = localStorage.getItem('bookstore_guest_wishlist');
          const bookIds: number[] = guestWishlist ? JSON.parse(guestWishlist) : [];

          if (!bookIds.includes(catalogBook.id)) {
            bookIds.push(catalogBook.id);
            localStorage.setItem('bookstore_guest_wishlist', JSON.stringify(bookIds));
          }
        }
        setIsInWishlist(true);
      }
      // Dispatch event to update wishlist count in navbar
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      console.error('Failed to update wishlist', error);
    } finally {
      setAddingToWishlist(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-stack">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <button onClick={() => navigate(-1)} className="font-medium hover:text-primary transition-colors">
            ← Quay lại
          </button>
          {book && (
            <>
              <span>/</span>
              <span className="max-w-xl truncate font-bold text-gray-900">
                {catalogBook?.title || graphBook?.title || book.title}
              </span>
            </>
          )}
        </nav>

        {loading && (
          <div className="app-loading-state">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {!loading && !book && (
          <div className="app-empty-state">
            Không tìm thấy sách <strong>{isbn}</strong>.
          </div>
        )}

        {!loading && book && (
          <div className="app-card app-card-pad flex flex-col gap-8 sm:flex-row sm:items-stretch bg-white">
            {/* Cover */}
            <div className="w-full sm:w-80 lg:w-[400px] shrink-0 sm:self-stretch">
              <div className="h-[460px] sm:h-[620px] bg-[#f2f0eb] rounded-card overflow-hidden flex flex-col items-center justify-center border border-border shadow-sm p-4 gap-6">
                <BookCover
                  title={catalogBook?.title || graphBook?.title || book.title || 'BookStore'}
                  isbn={catalogBook?.isbn || graphBook?.isbn || book.isbn}
                  coverUrl={graphBook?.coverUrl || catalogBook?.coverUrl || book.coverUrl}
                  subtitle={catalogBook?.category?.name || graphBook?.categoryName || book.categoryName}
                  className="h-full w-full object-cover rounded-xl shadow-md"
                />
              </div>
            </div>

            {/* Info */}
            <div className="w-full flex-1 min-w-0 flex flex-col justify-between">
              <div>
                {/* Category tag + Rewards badge */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {(catalogBook?.category?.name || graphBook?.categoryName || book.categoryName) && (
                    <span className="inline-block text-xs bg-[#00754A]/10 text-[#00754A] border border-[#00754A]/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      {catalogBook?.category?.name || graphBook?.categoryName || book.categoryName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#cba258] text-[#cba258] text-[11px] font-extrabold tracking-wider uppercase select-none">
                    {rewardsStars}★ item
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3 font-serif">
                  {catalogBook?.title || graphBook?.title || book.title}
                </h1>

                {/* Rating + sold */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 border-b border-[#edebe9] pb-3 text-sm">
                  {displayAverageRating != null && displayAverageRating > 0 ? (
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((s) => {
                        const fillPercent = Math.max(0, Math.min(1, displayAverageRating - (s - 1))) * 100;

                        return (
                          <span key={s} className="relative inline-block h-[16px] w-[16px]">
                            <StarIcon className="absolute inset-0 h-[16px] w-[16px] text-gray-300" />
                            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                              <StarIcon className="h-[16px] w-[16px] text-[#cba258]" />
                            </span>
                          </span>
                        );
                      })}
                      <span className="text-[14px] text-[#1E3932] font-extrabold ml-1">{displayAverageRating.toFixed(1)}</span>
                      {displayRatingCount > 0 && (
                        <span className="text-gray-500 font-medium">({displayRatingCount} đánh giá)</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 font-semibold">Chưa có đánh giá</span>
                  )}
                  {(graphBook?.purchaseCount ?? book.purchaseCount) != null && (
                    <span className="text-gray-500 font-medium">Đã bán: <strong className="text-gray-800 font-bold">{graphBook?.purchaseCount ?? book.purchaseCount}</strong></span>
                  )}
                  {(graphBook?.viewCount ?? book.viewCount) != null && (
                    <span className="text-gray-500 font-medium">Xem: <strong className="text-gray-800 font-bold">{graphBook?.viewCount ?? book.viewCount}</strong></span>
                  )}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-6 bg-[#f2f0eb]/50 p-4 rounded-xl">
                  <div>
                    <span className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">ISBN</span>
                    <span className="font-semibold text-gray-800">{catalogBook?.isbn || graphBook?.isbn || book.isbn}</span>
                  </div>
                  {(catalogBook?.author?.name || graphBook?.authorName || book.authorName) && (
                    <div>
                      <span className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tác giả</span>
                      <span className="font-bold text-[#006241]">{catalogBook?.author?.name || graphBook?.authorName || book.authorName}</span>
                    </div>
                  )}
                  {(catalogBook?.publisher?.name || graphBook?.publisherName || book.publisherName) && (
                    <div>
                      <span className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nhà xuất bản</span>
                      <span className="font-semibold text-gray-800">{catalogBook?.publisher?.name || graphBook?.publisherName || book.publisherName}</span>
                    </div>
                  )}
                  {(catalogBook?.publicationYear || graphBook?.publishedYear || book.publishedYear) && (
                    <div>
                      <span className="block font-bold text-gray-400 uppercase tracking-wider mb-0.5">Năm phát hành</span>
                      <span className="font-semibold text-gray-800">{catalogBook?.publicationYear || graphBook?.publishedYear || book.publishedYear}</span>
                    </div>
                  )}
                </div>

                {/* Format Options Selector */}
                <div className="mb-6">
                  <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                    Chọn định dạng sách (Format)
                  </span>
                  <div className="grid grid-cols-4 gap-2 bg-[#f2f0eb]/40 p-2.5 rounded-2xl border border-gray-100">
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('PAPERBACK')}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
                    >
                      <BookFormatIcon format="PAPERBACK" active={selectedFormat === 'PAPERBACK'} />
                      <span className="text-[12px] font-bold text-[#1E3932]">Paperback</span>
                      <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Bìa Mềm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('HARDCOVER')}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
                    >
                      <BookFormatIcon format="HARDCOVER" active={selectedFormat === 'HARDCOVER'} />
                      <span className="text-[12px] font-bold text-[#1E3932]">Hardcover</span>
                      <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Bìa Cứng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('DELUXE')}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
                    >
                      <BookFormatIcon format="DELUXE" active={selectedFormat === 'DELUXE'} />
                      <span className="text-[12px] font-bold text-[#1E3932]">Deluxe</span>
                      <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Bản Đặc biệt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('COLLECTOR')}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
                    >
                      <BookFormatIcon format="COLLECTOR" active={selectedFormat === 'COLLECTOR'} />
                      <span className="text-[12px] font-bold text-[#1E3932]">Collector's</span>
                      <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Bản Giới hạn</span>
                    </button>
                  </div>
                </div>

                {/* Option selectors (Add-ins / Milk select) */}
                <div className="mb-6 space-y-3">
                  <div className="relative bg-white border border-[#d6dbde] rounded p-2.5 focus-within:border-[#00754A] transition-colors shadow-sm">
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                      Quà tặng kèm (Add-ins)
                    </label>
                    <select
                      value={bookmarkOption}
                      onChange={(e) => setBookmarkOption(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-gray-900 border-none outline-none appearance-none pr-8 pt-1 cursor-pointer"
                    >
                      <option value="Không kèm">Không kèm Bookmark</option>
                      <option value="Bookmark Siren Reads">Bookmark Siren Reads (Miễn phí)</option>
                      <option value="Postcard nghệ thuật">Postcard &amp; Bookmark nghệ thuật</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative bg-white border border-[#d6dbde] rounded p-2.5 focus-within:border-[#00754A] transition-colors shadow-sm">
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                      Đóng gói / Bao bì (Bọc sách)
                    </label>
                    <select
                      value={wrapOption}
                      onChange={(e) => setWrapOption(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-gray-900 border-none outline-none appearance-none pr-8 pt-1 cursor-pointer"
                    >
                      <option value="Đóng gói tiêu chuẩn">Bọc plastic tiêu chuẩn</option>
                      <option value="Hộp quà gỗ Siren Reads (+20.000₫)">Hộp quà gỗ Siren Reads (+20.000₫)</option>
                      <option value="Hộp giấy kraft mộc mạc (+10.000₫)">Hộp giấy kraft mộc mạc (+10.000₫)</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white border border-[#d6dbde] rounded p-2.5 shadow-sm">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                        Phụ kiện / Kẹp sách kim loại
                      </label>
                      <span className="text-[11px] text-gray-500 font-medium">Kẹp sách kim loại (+15.000₫/cái)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setExtraBookmarkCount(c => Math.max(0, c - 1))}
                        className="w-8 h-8 rounded-full border border-[#d6dbde] flex items-center justify-center text-gray-600 hover:border-[#00754A] hover:bg-gray-50 font-bold text-md cursor-pointer select-none"
                      >
                        −
                      </button>
                      <span className="text-xs font-extrabold w-4 text-center text-gray-900">{extraBookmarkCount}</span>
                      <button
                        type="button"
                        onClick={() => setExtraBookmarkCount(c => Math.min(5, c + 1))}
                        className="w-8 h-8 rounded-full border border-[#d6dbde] flex items-center justify-center text-gray-600 hover:border-[#00754A] hover:bg-gray-50 font-bold text-md cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {/* Price Display */}
                {(catalogBook?.price ?? graphBook?.price ?? book.price) != null && (
                  <div className="mb-4 bg-[#006241]/5 p-4 rounded-2xl flex items-center justify-between border border-[#006241]/10">
                    <div>
                      <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng giá tạm tính</span>
                      <p className="price-tag text-2xl font-extrabold text-[#006241]">
                        {dynamicPrice.toLocaleString('vi-VN')}
                        <span className="text-sm font-normal ml-0.5">₫</span>
                      </p>
                    </div>
                    {stockQuantity != null && (
                      <div className="text-right">
                        <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Trạng thái</span>
                        <span className={`text-xs font-bold ${stockQuantity > 0 ? 'text-[#00754A]' : 'text-[#c82014]'}`}>
                          {stockQuantity > 0 ? `Còn hàng (Tồn: ${stockQuantity})` : 'Hết hàng'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Purchase controls */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Stepper */}
                    <div className="inline-flex items-center bg-[#f2f0eb] rounded-full p-1 gap-2.5 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => adjustQuantity(-1)}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        −
                      </button>
                      <span className="text-sm font-extrabold w-5 text-center text-[#1E3932]">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => adjustQuantity(1)}
                        disabled={quantity >= maxQuantity}
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!canAddToCart || addingToCart}
                      onClick={handleAddToCart}
                      className="flex-1 bg-[#00754A] hover:bg-[#006241] text-white font-bold text-xs tracking-wider uppercase rounded-full px-6 py-3.5 transition-all duration-200 active:scale-95 shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer text-center"
                    >
                      {addingToCart ? 'Đang thêm...' : cartSuccess ? '✓ Đã thêm!' : 'Thêm vào đơn hàng'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCustomizeModal(true)}
                      className="border-1.5 border-[#00754A] text-[#00754A] hover:bg-[#00754A]/5 font-bold text-xs tracking-wider uppercase rounded-full px-6 py-3.5 transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Tùy chỉnh ✨
                    </button>

                    <button
                      type="button"
                      disabled={addingToWishlist}
                      onClick={handleToggleWishlist}
                      className={`border rounded-full p-3 transition-all cursor-pointer ${
                        isInWishlist
                          ? 'border-[#cba258] bg-[#cba258]/10 text-[#cba258]'
                          : 'border-[#d6dbde] bg-white text-gray-500 hover:border-gray-400'
                      }`}
                      title={isInWishlist ? 'Bỏ khỏi mục yêu thích' : 'Thêm vào mục yêu thích'}
                    >
                      <span className="text-sm block h-5 w-5 flex items-center justify-center">{isInWishlist ? '♥' : '♡'}</span>
                    </button>
                  </div>
                  {!canAddToCart && (
                    <p className="text-xs font-semibold text-[#c82014] mt-1">Sách này hiện đang hết hàng tại mọi chi nhánh.</p>
                  )}
                </div>
              </div>

              {/* Rating form */}
              <div className="mt-4 rounded-card bg-bg-light p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[15px] font-bold text-primary-dark">Đánh giá sách này</p>
                  {userReview && !isEditingReview && (
                    <div className="flex items-center gap-3 text-sm font-semibold">
                      <button
                        type="button"
                        onClick={() => setIsEditingReview(true)}
                        className="text-primary-dark underline-offset-2 hover:underline"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
                          try {
                            await reviewApi.delete(userReview.id);
                            setUserReview(null);
                            setRating(0);
                            setReviewText('');
                            if (catalogBook?.id) {
                              const res = await reviewApi.getByBook(catalogBook.id, undefined, 0, 50);
                              setMongoReviews(res.data.content ?? []);
                            }
                          } catch (error) {
                            console.error('Failed to delete review', error);
                            setRatingError('Không thể xóa đánh giá lúc này');
                          }
                        }}
                        className="text-error underline-offset-2 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
                {userReview && !isEditingReview ? (
                  <div className="space-y-2 text-[15px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-primary-dark">
                        Đánh giá của bạn: {userReview.rating}/5
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${
                        userReview.moderated
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}>
                        {userReview.moderated ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </div>
                    {userReview.comment ? (
                      <p className="text-gray-700">{userReview.comment}</p>
                    ) : (
                      <p className="font-medium text-gray-500">Không có nhận xét.</p>
                    )}
                  </div>
                ) : !ratingAllowed && !isEditingReview ? (
                  <p className="text-[15px] font-medium text-gray-600">
                    {normalizeRatingEligibilityMessage(ratingEligibilityMessage)}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="text-[28px] transition-transform hover:scale-110"
                        >
                          <span className={star <= (hoverRating || rating) ? 'text-[#b88745]' : 'text-gray-400'}>★</span>
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="text-sm text-gray-500 ml-1">
                          {['','Kém','Không tốt','Trung bình','Tốt','Xuất sắc'][rating]}
                        </span>
                      )}
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
                      <textarea
                        rows={2}
                        placeholder="Nhận xét (không bắt buộc)..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="block min-h-[60px] flex-1 px-3 py-2 text-[15px] border border-primary/30 rounded bg-white outline-none focus:border-primary focus:shadow-input-focus resize-none placeholder:text-gray-400"
                      />
                      <button
                        onClick={handleSubmitRating}
                        disabled={!rating || ratingSubmitting}
                        className="btn-primary h-10 px-4 py-2 text-sm disabled:!bg-gray-300 disabled:!text-gray-600 disabled:!shadow-none disabled:cursor-not-allowed disabled:opacity-100 sm:w-34"
                      >
                        {ratingSubmitting ? 'Đang gửi...' : isEditingReview ? 'Cập nhật' : 'Gửi đánh giá'}
                      </button>
                      {isEditingReview && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingReview(false);
                            setRating(userReview?.rating ?? 0);
                            setReviewText(userReview?.comment ?? '');
                          }}
                          className="btn-secondary h-10 px-4 py-2 text-sm"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                    {ratingError && (
                      <p className="text-sm font-medium text-error">{ratingError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Review history */}
              <div className="mt-4 rounded-card bg-bg-light p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[15px] font-bold text-primary-dark">
                    Lịch sử đánh giá{' '}
                    <span className="text-xs font-medium italic text-gray-500">
                      (Nhận xét từ khách hàng đã mua sách)
                    </span>
                  </p>
                  <span className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-bold text-primary">
                    {catalogBook ? visibleMongoReviews.length : reviews.length} đánh giá
                  </span>
                </div>

                {catalogBook && visibleMongoReviews.length === 0 ? (
                  <p className="text-[15px] font-medium text-gray-600">
                    Chưa có đánh giá nào.
                  </p>
                ) : catalogBook ? (
                  <div className="divide-y divide-border">
                    {visibleMongoReviews.map((review) => (
                      <div key={review.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                            {getInitials(review.userName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="font-semibold text-gray-900">{review.userName || 'Khách hàng'}</p>
                              <span className="text-xs font-medium text-gray-400">{formatReviewDate(review.createdAt)}</span>
                              {!review.moderated && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                  Chờ duyệt
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="relative inline-block h-[15px] w-[15px]">
                                  <StarIcon className="absolute inset-0 h-[15px] w-[15px] text-gray-300" />
                                  {star <= review.rating && (
                                    <StarIcon className="absolute inset-0 h-[15px] w-[15px] text-[#b88745]" />
                                  )}
                                </span>
                              ))}
                              <span className="ml-1 text-xs font-bold text-[#8a6335]">{review.rating.toFixed(1)}</span>
                            </div>
                            {review.comment ? (
                              <p className="mt-2 text-[14px] leading-6 text-gray-700">{review.comment}</p>
                            ) : (
                              <p className="mt-2 text-[14px] font-medium text-gray-400">Không có nhận xét.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-[15px] font-medium text-gray-600">
                    Chưa có đánh giá nào.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {reviews.map((review, index) => (
                      <div key={`${review.customerName}-${review.ratedAt}-${index}`} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                            {getInitials(review.customerName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="font-semibold text-gray-900">{review.customerName || 'Khách hàng'}</p>
                              <span className="text-xs font-medium text-gray-400">{formatReviewDate(review.ratedAt)}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const score = review.score ?? 0;
                                const fillPercent = Math.max(0, Math.min(1, score - (star - 1))) * 100;

                                return (
                                  <span key={star} className="relative inline-block h-[15px] w-[15px]">
                                    <StarIcon className="absolute inset-0 h-[15px] w-[15px] text-gray-300" />
                                    <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                                      <StarIcon className="h-[15px] w-[15px] text-[#b88745]" />
                                    </span>
                                  </span>
                                );
                              })}
                              {review.score != null && (
                                <span className="ml-1 text-xs font-bold text-[#8a6335]">{review.score.toFixed(1)}</span>
                              )}
                            </div>
                            {review.reviewText ? (
                              <p className="mt-2 text-[14px] leading-6 text-gray-700">{review.reviewText}</p>
                            ) : (
                              <p className="mt-2 text-[14px] font-medium text-gray-400">Không có nhận xét.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Description Band */}
        {book && (catalogBook?.description || book.description) && (
          <div className="bg-[#1E3932] text-white rounded-2xl p-8 md:p-10 my-4 space-y-6 border border-[#006241]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#cba258] text-[#cba258] text-[12px] font-bold tracking-wider uppercase select-none">
                {rewardsStars}★ item
              </span>
              <div className="text-xs md:text-sm text-gray-300 font-bold uppercase tracking-wider">
                Ấn bản tuyển chọn đặc quyền 📚
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl md:text-2xl font-bold font-serif text-white">Giới thiệu tác phẩm</h3>
              <p className="text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-line">
                {catalogBook?.description || book.description}
              </p>
            </div>

            <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm font-semibold text-white">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4.5 w-4.5 text-[#00754A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Giấy ngà chống mỏi mắt
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4.5 w-4.5 text-[#00754A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mực in organic thân thiện môi trường
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4.5 w-4.5 text-[#00754A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hỗ trợ đổi trả tại 100+ cửa hàng
                </span>
              </div>
              <button
                onClick={() => {
                  const detailsEl = document.getElementById('book-technical-details');
                  detailsEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border border-white hover:bg-white hover:text-[#1E3932] text-white font-bold text-xs tracking-wider uppercase rounded-full px-5 py-2.5 transition-all duration-200 cursor-pointer"
              >
                Thông số bản in
              </button>
            </div>
          </div>
        )}

        {/* Technical & Print Details (Nutrition Table Style) */}
        {book && (
          <div id="book-technical-details" className="bg-white rounded-2xl p-6 md:p-8 border border-[#edebe9] shadow-sm my-4">
            <h3 className="text-lg font-bold text-[#1E3932] font-serif mb-6 border-b border-gray-100 pb-3">
              Thông số chi tiết & Quy chuẩn Bản in 📖
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Ingredients / Print notes */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold uppercase text-[#006241] tracking-wider">
                  Quy trình đóng gói &amp; Vận chuyển
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Mỗi quyển sách khi rời khỏi kho Bookstore đều được kiểm tra kỹ lưỡng về chất lượng gáy, trang sách và bìa ngoài. Sách được bọc màng co bảo vệ và chống thấm nước, đặt kèm túi hút ẩm để duy trì độ mịn của giấy ngà.
                </p>
                <div className="p-4 bg-[#edebe9]/30 rounded-xl">
                  <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Cam kết từ chuyên viên bảo quản sách:</span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Sản phẩm được bảo quản trong nhiệt độ tiêu chuẩn 22°C - 25°C, độ ẩm 45% - 50% tại kho trung tâm để ngăn ngừa hiện tượng ố vàng hoặc ẩm mốc tự nhiên.
                  </p>
                </div>
              </div>

              {/* Right Column: Nutrition Label/Value Rows */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold uppercase text-[#006241] tracking-wider mb-2">
                  Thông số bản in chuẩn hóa
                </h4>
                <div className="divide-y divide-[#e7e7e7]">
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-gray-600">Khổ sách (Kích thước)</span>
                    <span className="font-semibold text-gray-900 font-sans">14.5 x 20.5 cm</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-gray-600">Định lượng giấy gáy</span>
                    <span className="font-semibold text-gray-900 font-sans">80 gsm Phần Lan</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-gray-600">Loại bìa (Mặc định)</span>
                    <span className="font-semibold text-gray-900">{selectedFormat === 'PAPERBACK' ? 'Bìa mềm' : selectedFormat === 'HARDCOVER' ? 'Bìa cứng ép nhũ' : selectedFormat === 'DELUXE' ? 'Bìa cứng khâu gáy đục lỗ' : 'Bìa da đặc biệt khâu thủ công'}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-gray-600">Nhà xuất bản đại diện</span>
                    <span className="font-semibold text-gray-900">{catalogBook?.publisher?.name || graphBook?.publisherName || book.publisherName || 'NXB Trẻ'}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-gray-600">Hình thức in ấn</span>
                    <span className="font-semibold text-gray-900">Offset 4 màu chất lượng cao</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customize Modal */}
        {showCustomizeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[#edebe9]">
              <div className="bg-[#1E3932] p-5 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg font-serif">Tùy chọn đóng gói & Quà tặng 📚</h3>
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="text-white/80 hover:text-white text-2xl font-bold line-height-none focus:outline-none cursor-pointer"
                >
                  &times;
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500">Thiết lập các chi tiết đóng gói và quà tặng để bản in sách của bạn hoàn hảo nhất.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Lời nhắn viết tay trên bưu thiếp</label>
                    <input
                      type="text"
                      placeholder="VD: Chúc mừng sinh nhật, Nhắn gửi yêu thương..."
                      className="w-full px-3 py-2 text-sm border border-[#d6dbde] rounded focus:border-[#00754A] focus:ring-1 focus:ring-[#00754A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tên người sở hữu sách (Book Owner)</label>
                    <input
                      type="text"
                      placeholder="VD: Anh Minh, Chị Lan..."
                      className="w-full px-3 py-2 text-sm border border-[#d6dbde] rounded focus:border-[#00754A] focus:ring-1 focus:ring-[#00754A] outline-none font-script text-base"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">Tên viết tay bằng nét bút Kalam nghệ thuật.</span>
                  </div>

                  <div className="p-3 bg-[#edebe9]/40 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-[#1E3932] block">Tóm tắt tùy chọn:</span>
                    <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                      <li>Phiên bản: <span className="font-semibold text-gray-800">{selectedFormat === 'PAPERBACK' ? 'Paperback (Bản thường)' : selectedFormat === 'HARDCOVER' ? 'Hardcover (Bìa cứng)' : selectedFormat === 'DELUXE' ? 'Deluxe Edition (Bản đặc biệt)' : 'Collector\'s Sign (Bản giới hạn)'}</span></li>
                      <li>Bookmark: <span className="font-semibold text-gray-800">{bookmarkOption}</span></li>
                      <li>Đóng gói: <span className="font-semibold text-gray-800">{wrapOption}</span></li>
                      <li>Kẹp sách kim loại: <span className="font-semibold text-gray-800">{extraBookmarkCount} cái</span></li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowCustomizeModal(false)}
                    className="w-full bg-[#00754A] hover:bg-[#006241] text-white font-bold text-xs tracking-wider uppercase rounded-full py-3.5 transition-all duration-200 active:scale-95 shadow-md cursor-pointer"
                  >
                    Xác nhận tùy chỉnh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bought together */}
        {!loading && boughtTogether.length > 0 && (
          <RecommendSection
            title="Thường mua cùng nhau"
            subtitle="Các sách thường được mua trong cùng một đơn hàng"
            books={boughtTogether}
            catalogByIsbn={catalogByIsbn}
            graphByIsbn={graphByIsbn}
          />
        )}

        {/* Similar */}
        {!loading && similarBooks.length > 0 && (
          <RecommendSection
            title="Sách tương tự"
            subtitle="Cùng thể loại hoặc tác giả"
            books={similarBooks}
            catalogByIsbn={catalogByIsbn}
            graphByIsbn={graphByIsbn}
          />
        )}
      </div>
    </AppLayout>
  );
};

const RecommendSection: React.FC<{
  title: string;
  subtitle: string;
  books: BookRecommendation[];
  catalogByIsbn: Record<string, Book>;
  graphByIsbn: Record<string, BookListItem>;
}> = ({ title, subtitle, books, catalogByIsbn, graphByIsbn }) => (
  <section>
    <div className="flex items-baseline gap-2 mb-3">
      <h2 className="section-title">{title}</h2>
      <span className="text-xs text-gray-400">{subtitle}</span>
    </div>
    <div className="app-grid-books">
      {books.map((book, i) => {
        const catalog = catalogByIsbn[book.isbn];
        const graph = graphByIsbn[book.isbn];

        return (
          <BookCard
            key={`${book.isbn}-${i}`}
            isbn={catalog?.isbn || graph?.isbn || book.isbn}
            title={catalog?.title || graph?.title || book.title}
            price={catalog?.price ?? graph?.price ?? book.price}
            avgRating={graph?.avgRating ?? book.avgRating}
            ratingCount={graph?.ratingCount}
            purchaseCount={graph?.purchaseCount}
            viewCount={graph?.viewCount}
            coverUrl={graph?.coverUrl || catalog?.coverUrl || book.coverUrl}
            authorName={catalog?.author?.name || graph?.authorName}
            categoryName={catalog?.category?.name || graph?.categoryName}
            status={catalog?.businessStatus}
            stockQuantity={catalog?.stockQuantity}
          />
        );
      })}
    </div>
  </section>
);
