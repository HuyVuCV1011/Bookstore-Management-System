import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { BookCard } from '../components/graph/BookCard';
import { graphService } from '../services/graphService';
import { bookApi } from '../services/api/bookApi';
import { reviewApi } from '../services/api/reviewApi';
import type { BookListItem } from '../types/graph.types';
import type { Book } from '../types/book';
import type { RatingSummary } from '../types';

type HomeBestseller = {
  book: Book;
  graph?: BookListItem;
  rating?: RatingSummary;
  rank: number;
};

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [bestsellers, setBestsellers] = useState<HomeBestseller[]>([]);

  const isStaffOrAdmin = user?.role === 'STAFF' || user?.role === 'ADMIN';

  useEffect(() => {
    if (isStaffOrAdmin) {
      Promise.all([
        bookApi.getAll(0, 500),
        graphService.getAllBooks(500).catch(() => [] as BookListItem[]),
      ])
        .then(async ([bookRes, graphBooks]) => {
          const graphByIsbn = graphBooks.reduce<Record<string, BookListItem>>((acc, book) => {
            if (book.isbn) acc[book.isbn] = book;
            return acc;
          }, {});

          const topBooks = [...bookRes.data.content]
            .sort((a, b) => {
              const soldA = a.isbn ? graphByIsbn[a.isbn]?.purchaseCount ?? 0 : 0;
              const soldB = b.isbn ? graphByIsbn[b.isbn]?.purchaseCount ?? 0 : 0;
              return soldB - soldA;
            })
            .slice(0, 8);

          // Fetch MongoDB ratings for top books
          const bookIds = topBooks.map(b => b.id).filter(Boolean) as number[];
          let ratingSummaries: Record<number, RatingSummary> = {};

          if (bookIds.length > 0) {
            try {
              const response = await reviewApi.getBulkSummaries(bookIds);
              ratingSummaries = response.data;
            } catch (err) {
              console.error('Failed to fetch rating summaries:', err);
            }
          }

          setBestsellers(
            topBooks.map((book, index) => ({
              book,
              graph: book.isbn ? graphByIsbn[book.isbn] : undefined,
              rating: book.id ? ratingSummaries[book.id] : undefined,
              rank: index + 1,
            }))
          );
        })
        .catch(() => setBestsellers([]));
    } else {
      setBestsellers([]);
    }
  }, [isStaffOrAdmin]);

  return (
    <AppLayout>
      <div className="page-stack">
        {/* Welcome banner */}
        <div className="app-card-muted app-card-pad flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="page-title">
              Welcome, {user?.fullName}!
            </h1>
            <p className="page-subtitle">
              Explore the catalog with graph-powered recommendations.
            </p>
          </div>
          <Link
            to="/"
            className="btn-buy inline-flex h-10 shrink-0 items-center justify-center px-4 text-sm"
          >
            Browse all books →
          </Link>
        </div>

        {/* Quick nav cards */}
        <div className={`grid gap-3 ${isStaffOrAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          <Link to="/" className="quick-link-card group">
            <p className="section-title group-hover:text-primary">Book Catalog</p>
            <p className="section-subtitle">Browse and search</p>
          </Link>
          <Link to="/recommendations" className="quick-link-card group">
            <p className="section-title group-hover:text-primary">Recommendations</p>
            <p className="section-subtitle">Personalized picks</p>
          </Link>
          {isStaffOrAdmin && (
            <Link to="/analytics" className="quick-link-card group">
              <p className="section-title group-hover:text-primary">Analytics</p>
              <p className="section-subtitle">Graph analytics</p>
            </Link>
          )}
        </div>

        {/* Bestsellers */}
        {bestsellers.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Bestselling Books</h2>
              <Link to="/" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
            </div>
            <div className="app-grid-books">
              {bestsellers.map(({ book, graph, rating, rank }) => (
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
                  badge={`#${rank}`}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};
