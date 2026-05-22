import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../services/api/searchApi';
import type { BookSearch } from '../types';
import { AppLayout } from '../components/layout/AppLayout';

export const FastSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [perf, setPerf] = useState<number | null>(null);
  const navigate = useNavigate();
  const debounceTimer = useRef<any>(null);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchTrending = async () => {
    try {
      const res = await searchApi.getTrendingKeywords(5);
      setTrending(res.data);
    } catch (err) {
      console.error('Failed to fetch trending keywords');
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  const handleSearch = async (val: string) => {
    if (!val.trim()) {
      setResults([]);
      setSuggestions([]);
      setPerf(null);
      return;
    }

    setLoading(true);
    const start = performance.now();
    try {
      // Parallel fetch: Redis search (returns results + suggestions) and autocomplete
      const [redisSearchRes, suggestRes] = await Promise.all([
        searchApi.redisSearch(val, 8),
        searchApi.getAutocomplete(val)
      ]);

      // Redis search response contains: { results, count, query, source, responseTime, suggestions }
      const searchResults = redisSearchRes.data.results || [];

      // Convert BookResponse to BookSearch format for display
      const formattedResults = searchResults.map((book: any) => ({
        id: book.id,
        title: book.title,
        authorName: book.author?.name || 'Unknown',
        categoryName: book.category?.name || 'Unknown',
        price: book.price,
        isbn: book.isbn,
        businessStatus: book.businessStatus
      }));

      setResults(formattedResults);
      setSuggestions(suggestRes.data);
      const end = performance.now();
      setPerf(Math.round(end - start));
    } catch (err) {
      console.error('Redis search failed', err);
      setResults([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      handleSearch(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer.current);
  }, [query]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            ⚡ Tìm Kiếm Nhanh Redis
          </h1>
          <p className="text-text-secondary text-lg">
            Trải nghiệm tìm kiếm siêu nhanh được hỗ trợ bởi Redis Autocomplete.
            <br />
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block italic">
              Khu vực Demo
            </span>
          </p>
        </div>

        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-2xl">
            🔍
          </div>
          <input
            type="text"
            autoFocus
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm (vd: 'Harry', 'Nguyễn', 'Văn học')..."
            className="w-full pl-16 pr-6 py-6 text-2xl border-4 border-primary/20 rounded-3xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-xl"
          />
          {loading && (
            <div className="absolute right-6 inset-y-0 flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && query && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (s.bookId) navigate(`/books/${s.bookId}`);
                    else setQuery(s.title);
                    setShowSuggestions(false);
                  }}
                  className="px-6 py-4 hover:bg-primary/5 cursor-pointer flex items-center gap-3 border-b last:border-0"
                >
                  <span className="opacity-40">✨</span>
                  <span className="font-medium">{s.title}</span>
                  {s.bookId && <span className="text-xs text-text-secondary ml-auto uppercase font-mono">Xem chi tiết</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending Keywords */}
        {trending.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-text-secondary mr-2">Xu hướng:</span>
            {trending.map((t, i) => (
              <button
                key={i}
                onClick={() => setQuery(t)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border rounded-full text-sm hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {perf !== null && (
          <div className="flex justify-between items-center mb-6 px-4">
            <p className="text-sm text-text-secondary">
              Tìm thấy <span className="font-bold text-text-primary-light">{results.length}</span> kết quả
            </p>
            <p className="text-sm font-mono text-green-500 bg-green-50 px-3 py-1 rounded-full border border-green-100">
              ⚡ Thời gian: {perf}ms
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/books/${book.id}`)}
              className="flex gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border hover:border-primary hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center text-3xl group-hover:bg-primary/5 transition-colors">
                📖
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
                <p className="text-sm text-text-secondary">{book.authorName}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-text-secondary uppercase tracking-tight">
                    {book.categoryName}
                  </span>
                  <span className="font-black text-primary">{book.price?.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {query && !loading && results.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <div className="text-6xl mb-4">💨</div>
            <p className="text-xl">Không tìm thấy kết quả cho "{query}"</p>
          </div>
        )}

        {!query && (
          <div className="text-center py-20 opacity-30">
            <p className="text-lg italic">Bắt đầu nhập để xem kết quả...</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
