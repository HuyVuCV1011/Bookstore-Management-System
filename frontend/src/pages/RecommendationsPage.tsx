import React, { useEffect, useMemo, useState } from 'react';
import { graphService } from '../services/graphService';
import { bookApi } from '../services/api/bookApi';
import { orderApi } from '../services/api/orderApi';
import type { BookListItem, BookRecommendation, CustomerCluster } from '../types/graph.types';
import type { Book } from '../types/book';
import { BookCard } from '../components/graph/BookCard';
import { AppLayout } from '../components/layout/AppLayout';
import { AdminLayout } from '../components/admin/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { BookCover } from '../components/common/BookCover';

type Tab = 'collaborative' | 'content' | 'basket';
type RecommendationCustomer = {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  itemCount: number;
  lastOrderedAt?: string;
  clusterName?: string;
};

const TABS: { id: Tab; label: string; desc: string }[] = [
  {
    id: 'collaborative',
    label: 'Khách hàng tương tự',
    desc: 'Nhận tối đa 10 cuốn sách dựa trên mẫu mua hàng từ khách hàng tương tự.',
  },
  {
    id: 'content',
    label: 'Cùng thể loại / Tác giả',
    desc: 'Tìm sách từ cùng thể loại hoặc tác giả với cuốn sách nguồn đã chọn.',
  },
  {
    id: 'basket',
    label: 'Mua cùng nhau',
    desc: 'Tìm sách thường được mua cùng nhau.',
  },
];

const BASIS_BADGE: Record<string, { label: string; color: string }> = {
  collaborative: { label: 'Tương tự', color: 'bg-purple-100 text-purple-700' },
  category:      { label: 'Cùng thể loại', color: 'bg-slate-100 text-primary' },
  author:        { label: 'Cùng tác giả', color: 'bg-soft-panel text-ink' },
  'co-purchase': { label: 'Mua cùng', color: 'bg-soft-panel text-ink' },
};

const pickRandom = <T,>(items: T[], limit = 8): T[] => {
  return [...items].sort(() => Math.random() - 0.5).slice(0, limit);
};

const getInitials = (name: string, email: string) => {
  const source = name.trim() || email.trim() || 'Customer';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const RecommendationsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('collaborative');
  const [isbn, setIsbn] = useState('');
  const [results, setResults] = useState<BookRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [catalogBooks, setCatalogBooks] = useState<Book[]>([]);
  const [catalogByIsbn, setCatalogByIsbn] = useState<Record<string, Book>>({});
  const [graphByIsbn, setGraphByIsbn] = useState<Record<string, BookListItem>>({});
  const [customerClusters, setCustomerClusters] = useState<CustomerCluster[]>([]);
  const [recommendationCustomers, setRecommendationCustomers] = useState<RecommendationCustomer[]>([]);
  const [collaborativeCustomerId, setCollaborativeCustomerId] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [openPicker, setOpenPicker] = useState<'customer' | 'book' | null>(null);
  const [randomBookIsbns, setRandomBookIsbns] = useState<string[]>([]);
  const [randomCustomerIds, setRandomCustomerIds] = useState<string[]>([]);
  const isStaffOrAdmin = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const collaborativeTabCopy = isStaffOrAdmin
    ? TABS[0]
    : {
        id: 'collaborative' as const,
        label: 'Đề xuất cho bạn',
        desc: 'Đề xuất riêng tư được tạo từ hoạt động tài khoản của bạn.',
      };
  const activeTabCopy = activeTab === 'collaborative'
    ? collaborativeTabCopy
    : TABS.find((tab) => tab.id === activeTab);

  const loadBookIndex = async () => {
    const [catalogRes, graphBooks, clusters, completedOrdersRes] = await Promise.all([
      bookApi.getAll(0, 500).catch(() => null),
      graphService.getAllBooks(500).catch(() => [] as BookListItem[]),
      isStaffOrAdmin ? graphService.getCustomerClusters().catch(() => [] as CustomerCluster[]) : Promise.resolve([]),
      isStaffOrAdmin ? orderApi.getAll(0, 500, '', 'COMPLETED').catch(() => null) : Promise.resolve(null),
    ]);

    const catalog = catalogRes?.data.content ?? [];
    setCatalogBooks(catalog);
    setCatalogByIsbn(
      catalog.reduce<Record<string, Book>>((acc, book) => {
        if (book.isbn) acc[book.isbn] = book;
        return acc;
      }, {})
    );
    setGraphByIsbn(
      graphBooks.reduce<Record<string, BookListItem>>((acc, book) => {
        if (book.isbn) acc[book.isbn] = book;
        return acc;
      }, {})
    );
    setCustomerClusters(clusters);

    const clusterByCustomerId = clusters.reduce<Record<string, string>>((acc, cluster) => {
      cluster.customerIds.forEach((customerId) => {
        acc[customerId] = cluster.clusterName;
      });
      return acc;
    }, {});
    const customersById = (completedOrdersRes?.data.content ?? []).reduce<Record<string, RecommendationCustomer>>((acc, order) => {
      if (!order.userId) return acc;
      const current = acc[order.userId] ?? {
        id: order.userId,
        name: order.customerName,
        email: order.customerEmail,
        orderCount: 0,
        itemCount: 0,
        lastOrderedAt: order.orderedAt,
        clusterName: clusterByCustomerId[order.userId],
      };

      current.name = order.customerName || current.name;
      current.email = order.customerEmail || current.email;
      current.orderCount += 1;
      current.itemCount += order.itemCount ?? 0;
      if (!current.lastOrderedAt || new Date(order.orderedAt).getTime() > new Date(current.lastOrderedAt).getTime()) {
        current.lastOrderedAt = order.orderedAt;
      }
      current.clusterName = clusterByCustomerId[order.userId] || current.clusterName;
      acc[order.userId] = current;
      return acc;
    }, {});

    setRecommendationCustomers(
      Object.values(customersById).sort((a, b) =>
        new Date(b.lastOrderedAt ?? 0).getTime() - new Date(a.lastOrderedAt ?? 0).getTime()
      )
    );
  };

  useEffect(() => {
    loadBookIndex().catch(() => {});
  }, [isStaffOrAdmin]);

  useEffect(() => {
    if (!collaborativeCustomerId && user?.id) {
      setCollaborativeCustomerId(user.id);
    }
  }, [collaborativeCustomerId, user?.id]);

  const selectedSourceBook = isbn ? catalogByIsbn[isbn] : undefined;

  const activeBooks = useMemo(() => (
    catalogBooks.filter((book) => book.isbn && book.businessStatus !== 'DISCONTINUED')
  ), [catalogBooks]);

  const sourceBooks = useMemo(() => {
    const q = sourceSearch.trim().toLowerCase();
    const filtered = q
      ? activeBooks.filter((book) =>
          book.title.toLowerCase().includes(q) ||
          book.isbn?.toLowerCase().includes(q) ||
          book.author?.name?.toLowerCase().includes(q) ||
          book.category?.name?.toLowerCase().includes(q)
      )
      : activeBooks;

    return filtered.slice(0, 8);
  }, [activeBooks, sourceSearch]);

  const sourceSuggestions = useMemo(() => {
    if (sourceSearch.trim()) return sourceBooks;

    const randomBooks = randomBookIsbns
      .map((bookIsbn) => catalogByIsbn[bookIsbn])
      .filter(Boolean);

    return (randomBooks.length > 0 ? randomBooks : activeBooks).slice(0, 8);
  }, [activeBooks, catalogByIsbn, randomBookIsbns, sourceBooks, sourceSearch]);

  const customerById = useMemo(() => (
    recommendationCustomers.reduce<Record<string, RecommendationCustomer>>((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {})
  ), [recommendationCustomers]);

  const customerOptions = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();

    return recommendationCustomers.filter((customer) => {
      if (!q) return true;
      return (
        customer.id.toLowerCase().includes(q) ||
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.clusterName?.toLowerCase().includes(q)
      );
    });
  }, [customerSearch, recommendationCustomers]);

  const customerSuggestions = useMemo(() => {
    if (customerSearch.trim()) return customerOptions.slice(0, 8);

    const randomIds = randomCustomerIds.length > 0
      ? randomCustomerIds.map((customerId) => customerById[customerId]).filter(Boolean)
      : pickRandom(customerOptions, 8);

    return randomIds.slice(0, 8);
  }, [customerById, customerOptions, customerSearch, randomCustomerIds]);

  useEffect(() => {
    if (activeTab === 'collaborative' && isStaffOrAdmin) {
      setCollaborativeCustomerId((current) => (
        current && customerById[current] ? current : recommendationCustomers[0]?.id ?? ''
      ));
    }
  }, [activeTab, customerById, isStaffOrAdmin, recommendationCustomers]);

  const selectedCustomer = customerById[collaborativeCustomerId];
  const selectedCustomerCluster = customerClusters.find((cluster) =>
    cluster.customerIds.includes(collaborativeCustomerId)
  );

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      let recommendationPromise: Promise<BookRecommendation[]>;

      if (activeTab === 'collaborative') {
        recommendationPromise = isStaffOrAdmin
          ? graphService.getCollaborativeRecommendations(collaborativeCustomerId || user!.id)
          : graphService.getMyCollaborativeRecommendations();
      } else if (activeTab === 'content') {
        recommendationPromise = graphService.getContentBasedRecommendations(isbn.trim());
      } else {
        recommendationPromise = graphService.getBoughtTogetherRecommendations(isbn.trim());
      }

      const data = await recommendationPromise;

      setResults(data);
    } catch {
      setError('Could not load recommendations. Make sure Neo4j is running and contains data.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setResults([]);
    setError(null);
    setSearched(false);
    setSourceSearch('');
    setCustomerSearch('');
    setOpenPicker(null);
  };

  const openBookPicker = () => {
    setOpenPicker('book');
    setRandomBookIsbns(pickRandom(activeBooks.map((book) => book.isbn!).filter(Boolean), 8));
  };

  const openCustomerPicker = () => {
    setOpenPicker('customer');
    setRandomCustomerIds(pickRandom(customerOptions.map((customer) => customer.id), 8));
  };

  const closePickerSoon = () => {
    window.setTimeout(() => setOpenPicker(null), 120);
  };

  const selectSourceBook = (book: Book) => {
    setIsbn(book.isbn ?? '');
    setSourceSearch('');
    setOpenPicker(null);
  };

  const selectCustomer = (customerId: string) => {
    setCollaborativeCustomerId(customerId);
    setCustomerSearch('');
    setOpenPicker(null);
  };

  const needsBookId = activeTab === 'content' || activeTab === 'basket';
  const Layout = (user?.role === 'ADMIN' || user?.role === 'STAFF') ? AdminLayout : AppLayout;

  return (
    <Layout>
      <div className="page-stack">
        <div>
          <h1 className="page-title">Đề xuất sách</h1>
          <p className="page-subtitle">Đề xuất thông minh được hỗ trợ bởi Neo4j Graph Database.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`app-tab ${
                activeTab === tab.id
                  ? 'app-tab-active'
                  : ''
              }`}
            >
              <span>{tab.id === 'collaborative' ? collaborativeTabCopy.label : tab.label}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <section className="toolbar-card">
          <p className="mb-3 text-sm text-gray-500">
            {activeTabCopy?.desc}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {activeTab === 'collaborative' && (
              <div className="flex-1 space-y-3">
                {isStaffOrAdmin ? (
                  <>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="app-search-field">
                    <svg className="app-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={openCustomerPicker}
                      onBlur={closePickerSoon}
                      placeholder="Tìm khách hàng theo tên, email hoặc nhóm quan tâm..."
                      className="app-search-input"
                    />
                    {openPicker === 'customer' && (
                      <div className="app-dropdown-panel max-h-80">
                        {customerSuggestions.length === 0 ? (
                          <div className="app-dropdown-empty">Không tìm thấy khách hàng có đơn hoàn thành.</div>
                        ) : (
                          customerSuggestions.map((customer) => {
                            const cluster = customerClusters.find((item) => item.customerIds.includes(customer.id));
                            const isSelected = customer.id === collaborativeCustomerId;

                            return (
                              <button
                                key={customer.id}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  selectCustomer(customer.id);
                                }}
                                className={`flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-soft-panel ${
                                  isSelected ? 'bg-soft-panel' : 'bg-white'
                                }`}
                              >
                                <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                                  {getInitials(customer.name, customer.email)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-gray-800">{customer.name}</p>
                                  <p className="truncate text-xs text-gray-500">{customer.email}</p>
                                  <p className="truncate text-xs text-gray-400">
                                    {cluster?.clusterName || customer.clusterName || 'Khách hàng có đơn hoàn thành'} · {customer.orderCount} đơn hàng
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSearch}
                    loading={loading}
                    disabled={!collaborativeCustomerId}
                    className="!w-full !px-5 !py-2.5 !text-sm !whitespace-nowrap lg:!w-auto lg:min-w-[190px]"
                  >
                    Tìm đề xuất
                  </Button>
                </div>

                <div className="border border-border bg-soft-panel rounded-card p-3 flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-full bg-primary text-white flex items-center justify-center text-base font-bold">
                    {selectedCustomer ? getInitials(selectedCustomer.name, selectedCustomer.email) : 'KH'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Khách hàng đã chọn</p>
                    <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                      {selectedCustomer?.name || 'Chưa chọn khách hàng có đơn hoàn thành'}
                    </p>
                    <p className="line-clamp-1 text-xs text-gray-500">
                      {selectedCustomerCluster
                        ? `Nhóm quan tâm: ${selectedCustomerCluster.clusterName}`
                        : selectedCustomer?.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedCustomer
                        ? `${selectedCustomer.orderCount} đơn hoàn thành · ${selectedCustomer.itemCount} sản phẩm đã mua`
                        : 'Chỉ hiển thị người dùng có đơn hoàn thành.'}
                    </p>
                  </div>
                </div>
                  </>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="rounded-card border border-border bg-soft-panel p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Đề xuất riêng tư của bạn</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{user?.fullName || 'Khách hàng hiện tại'}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Chúng tôi sử dụng lịch sử mua hàng và tương tác của bạn để đề xuất sách. ID và nhóm khách hàng khác được ẩn.
                      </p>
                    </div>
                    <Button
                      onClick={handleSearch}
                      loading={loading}
                      disabled={!user?.id}
                      className="!w-full !px-5 !py-2.5 !text-sm !whitespace-nowrap lg:!w-auto lg:min-w-[190px]"
                    >
                      Tìm đề xuất
                    </Button>
                  </div>
                )}
              </div>
            )}
            {needsBookId && (
              <div className="flex-1 space-y-3">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="app-search-field">
                      <svg className="app-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        value={sourceSearch}
                        onChange={(e) => setSourceSearch(e.target.value)}
                        onFocus={openBookPicker}
                        onBlur={closePickerSoon}
                        placeholder="Tìm sách nguồn theo tên, ISBN, tác giả..."
                        className="app-search-input"
                      />
                      {openPicker === 'book' && (
                        <div className="app-dropdown-panel max-h-96">
                          {sourceSuggestions.length === 0 ? (
                            <div className="app-dropdown-empty">Không tìm thấy sách phù hợp.</div>
                          ) : (
                            sourceSuggestions.map((book) => {
                              const graph = book.isbn ? graphByIsbn[book.isbn] : undefined;
                              const isSelected = book.isbn === isbn;

                              return (
                                <button
                                  key={book.isbn ?? book.id}
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    selectSourceBook(book);
                                  }}
                                  className={`flex w-full gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-soft-panel ${
                                    isSelected ? 'bg-soft-panel' : 'bg-white'
                                  }`}
                                >
                                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded border border-border bg-gray-100">
                                    <BookCover
                                      title={book.title}
                                      isbn={book.isbn}
                                      coverUrl={graph?.coverUrl || book.coverUrl}
                                      subtitle={book.category?.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-1 text-sm font-semibold text-gray-800">{book.title}</p>
                                    <p className="mt-0.5 truncate text-xs text-gray-400">{book.author?.name || '—'}</p>
                                    <p className="truncate text-xs text-gray-400">{book.category?.name || '—'}</p>
                                    <p className="mt-0.5 price-tag text-sm">
                                      {book.price.toLocaleString('vi-VN')}<span className="text-[10px] font-normal">₫</span>
                                    </p>
                                  </div>
                                  <div className="hidden shrink-0 text-right text-[11px] text-gray-400 sm:block">
                                    <p>Đã bán {graph?.purchaseCount ?? 0}</p>
                                    <p>{graph?.viewCount ?? 0} lượt xem</p>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleSearch}
                      loading={loading}
                      disabled={!isbn.trim()}
                      className="!w-full !px-5 !py-2.5 !text-sm !whitespace-nowrap lg:!w-auto lg:min-w-[190px]"
                    >
                      Tìm đề xuất
                    </Button>
                  </div>

                  {selectedSourceBook && (
                    <div className="border border-border bg-soft-panel rounded-card p-3 flex items-center gap-3">
                      <div className="h-16 w-11 shrink-0 overflow-hidden rounded border border-border bg-white">
                        <BookCover
                          title={selectedSourceBook.title}
                          isbn={selectedSourceBook.isbn}
                          coverUrl={graphByIsbn[selectedSourceBook.isbn ?? '']?.coverUrl || selectedSourceBook.coverUrl}
                          subtitle={selectedSourceBook.category?.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sách đã chọn</p>
                        <p className="line-clamp-1 text-sm font-semibold text-gray-900">{selectedSourceBook.title}</p>
                        <p className="line-clamp-1 text-xs text-gray-500">
                          {selectedSourceBook.author?.name || '—'} · {selectedSourceBook.category?.name || '—'}
                        </p>
                        <p className="text-xs text-gray-400">ISBN: {selectedSourceBook.isbn}</p>
                      </div>
                      <p className="price-tag shrink-0 text-base">
                        {selectedSourceBook.price.toLocaleString('vi-VN')}<span className="text-xs font-normal">₫</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
        </section>

        {/* Results */}
        {error && (
          <div className="app-alert-error">{error}</div>
        )}

        {searched && !loading && !error && results.length === 0 && (
          <div className="app-empty-state">
            <p>Không tìm thấy đề xuất. Cần có dữ liệu mua hàng trong Neo4j.</p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <p className="mb-3 text-sm text-gray-500">
              Tìm thấy <strong className="text-gray-800">{results.length}</strong> đề xuất
            </p>
            <div className="app-grid-books">
              {results.map((book, i) => {
                const basisInfo = book.basis ? BASIS_BADGE[book.basis] : null;
                const catalog = book.isbn ? catalogByIsbn[book.isbn] : undefined;
                const graph = book.isbn ? graphByIsbn[book.isbn] : undefined;

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
                    badge={basisInfo?.label}
                    badgeColor={basisInfo?.color}
                    extra={book.score != null ? (
                      <div className="space-y-0.5 text-xs font-medium text-gray-500">
                        <span className="truncate block">
                          Điểm: <strong className="text-gray-600">{book.score.toFixed(2)}</strong>
                        </span>
                      </div>
                    ) : undefined}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
