import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCover } from '../common/BookCover';

type BookCardProps = {
  isbn: string;
  title: string;
  price?: number | null;
  avgRating?: number | null;
  ratingCount?: number | null;
  purchaseCount?: number | null;
  viewCount?: number | null;
  coverUrl?: string | null;
  authorName?: string | null;
  categoryName?: string | null;
  badge?: string;
  badgeColor?: string;
  extra?: React.ReactNode;
  clickable?: boolean;
  status?: string | null;
  stockQuantity?: number | null;
};

const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

const StarIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d={STAR_PATH} />
  </svg>
);

export const BookCard: React.FC<BookCardProps> = ({
  isbn,
  title,
  price,
  avgRating,
  ratingCount,
  purchaseCount,
  viewCount,
  coverUrl,
  authorName,
  categoryName,
  badge,
  badgeColor = 'bg-primary text-white',
  extra,
  clickable = true,
  status,
  stockQuantity,
}) => {
  const navigate = useNavigate();
  const isOutOfStock = status === 'OUT_OF_STOCK';
  const isDiscontinued = status === 'DISCONTINUED';
  const hasRating = avgRating != null && avgRating > 0;

  return (
    <div
      onClick={clickable ? () => navigate(`/books/${isbn}`) : undefined}
      className={`product-card rounded-card overflow-hidden flex flex-col bg-white${clickable ? ' cursor-pointer' : ''}`}
    >
      {/* Cover image */}
      <div className="relative h-48 bg-surface-muted overflow-hidden">
        <BookCover
          title={title}
          isbn={isbn}
          coverUrl={coverUrl}
          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
        />
        {(isOutOfStock || isDiscontinued) && (
          <div className="absolute inset-0 bg-white/20" />
        )}
        {badge && (
          <span className={`absolute top-2 left-2 ${badgeColor} text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm`}>
            {badge}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <div className="h-[4.75rem] overflow-hidden">
          <h3 className="mt-1 text-base font-bold text-ink leading-snug line-clamp-2">
            {title}
          </h3>

          {authorName && (
            <p className="mt-0.5 text-xs font-semibold text-gray-600 truncate">
              {authorName}
            </p>
          )}
        </div>

        <div className="mt-1 space-y-1.5 text-xs">
          <p className="truncate font-medium text-gray-500">
            ISBN: <span className="font-semibold text-gray-700">{isbn}</span>
          </p>
          {categoryName && (
            <span className="inline-flex max-w-full items-center rounded-full border border-[#00754A]/20 bg-[#d4e9e2]/30 px-2 py-0.5 text-[11px] font-semibold text-[#006241]">
              <span className="truncate">{categoryName}</span>
            </span>
          )}
        </div>

        {extra && <div className="mt-1">{extra}</div>}

        <div className="mt-auto pt-1">
          {price != null ? (
            <p className="price-tag text-lg">
              {price.toLocaleString('vi-VN')}
              <span className="text-sm font-normal">₫</span>
            </p>
          ) : (
            <p className="text-gray-400 text-sm">—</p>
          )}

          {/* Fixed-height zone keeps price aligned across all cards in a row */}
          <div className="min-h-[3.5rem]">
            {hasRating ? (
              <div className="mt-0.5 flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => {
                    const fillPercent = Math.max(0, Math.min(1, avgRating - (s - 1))) * 100;

                    return (
                      <span key={s} className="relative inline-block h-3.5 w-3.5">
                        <StarIcon className="absolute inset-0 h-3.5 w-3.5 text-gray-200" />
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                          <StarIcon className="h-3.5 w-3.5 text-accent" />
                        </span>
                      </span>
                    );
                  })}
                </div>
                <span className="text-[11px] font-semibold text-gray-600">
                  {avgRating.toFixed(1)}
                  {(ratingCount ?? 0) > 0 ? ` (${ratingCount})` : ''}
                </span>
              </div>
            ) : (
              <p className="mt-0.5 text-[10px] font-semibold text-gray-500">Chưa có đánh giá</p>
            )}

            {(purchaseCount != null || viewCount != null) && (
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] font-semibold text-gray-600">
                {purchaseCount != null && <span>Đã bán {purchaseCount}</span>}
                {viewCount != null && <span>{viewCount} lượt xem</span>}
              </div>
            )}

            {isOutOfStock ? (
              <div className="mt-1">
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  Hết hàng
                </span>
              </div>
            ) : isDiscontinued ? (
              <div className="mt-1">
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-border">
                  Ngừng bán
                </span>
              </div>
            ) : stockQuantity != null && (
              <div className="mt-1 text-[11px] font-semibold text-gray-600">
                Tồn kho: {stockQuantity}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
