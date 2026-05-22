import React, { useEffect, useState } from 'react';
import { graphService } from '../services/graphService';
import type { CategoryGrowth, InfluentialBook, CustomerCluster, BookListItem } from '../types/graph.types';
import { bookApi } from '../services/api/bookApi';
import { orderApi } from '../services/api/orderApi';
import type { Book } from '../types/book';
import { AppLayout } from '../components/layout/AppLayout';
import { AdminLayout } from '../components/admin/AdminLayout';
import { BookCard } from '../components/graph/BookCard';
import { useAuth } from '../contexts/AuthContext';

type AnalyticsCustomer = {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  itemCount: number;
  lastOrderedAt?: string;
};

const getInitials = (name: string, email: string) => {
  const source = name.trim() || email.trim() || 'Customer';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatLatestPurchase = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ');
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')}₫`;

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const isStaffOrAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [categoryGrowth, setCategoryGrowth] = useState<CategoryGrowth[]>([]);
  const [influentialBooks, setInfluentialBooks] = useState<InfluentialBook[]>([]);
  const [clusters, setClusters] = useState<CustomerCluster[]>([]);
  const [customerById, setCustomerById] = useState<Record<string, AnalyticsCustomer>>({});
  const [catalogByIsbn, setCatalogByIsbn] = useState<Record<string, Book>>({});
  const [graphByIsbn, setGraphByIsbn] = useState<Record<string, BookListItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const categorySummary = {
    categoryCount: categoryGrowth.length,
    totalRevenue: categoryGrowth.reduce((sum, cat) => sum + cat.revenue, 0),
    totalCustomers: categoryGrowth.reduce((sum, cat) => sum + cat.customerCount, 0),
    totalSold: categoryGrowth.reduce((sum, cat) => sum + cat.totalSold, 0),
    latestPurchase: categoryGrowth
      .map((cat) => cat.latestPurchasedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] ?? null,
  };

  useEffect(() => {
    const fetches = [
      graphService.getCategoryGrowth().then(setCategoryGrowth),
      graphService.getInfluentialBooks().then(setInfluentialBooks),
      bookApi.getAll(0, 500).then((res) => {
        setCatalogByIsbn(
          res.data.content.reduce<Record<string, Book>>((acc, book) => {
            if (book.isbn) acc[book.isbn] = book;
            return acc;
          }, {})
        );
      }),
      graphService.getAllBooks(500).then((books) => {
        setGraphByIsbn(
          books.reduce<Record<string, BookListItem>>((acc, book) => {
            if (book.isbn) acc[book.isbn] = book;
            return acc;
          }, {})
        );
      }),
      ...(isStaffOrAdmin ? [
        graphService.getCustomerClusters().then(setClusters),
        orderApi.getAll(0, 500, '', 'COMPLETED').then((res) => {
          const customers = res.data.content.reduce<Record<string, AnalyticsCustomer>>((acc, order) => {
            if (!order.userId) return acc;
            const current = acc[order.userId] ?? {
              id: order.userId,
              name: order.customerName,
              email: order.customerEmail,
              orderCount: 0,
              itemCount: 0,
              lastOrderedAt: order.orderedAt,
            };

            current.name = order.customerName || current.name;
            current.email = order.customerEmail || current.email;
            current.orderCount += 1;
            current.itemCount += order.itemCount ?? 0;
            if (!current.lastOrderedAt || new Date(order.orderedAt).getTime() > new Date(current.lastOrderedAt).getTime()) {
              current.lastOrderedAt = order.orderedAt;
            }
            acc[order.userId] = current;
            return acc;
          }, {});
          setCustomerById(customers);
        }),
      ] : []),
    ];
    Promise.all(fetches)
      .catch(() => setError('Could not load analytics data. Make sure PostgreSQL and Neo4j are running.'))
      .finally(() => setLoading(false));
  }, [isStaffOrAdmin]);

  if (loading) {
    return (
      <AppLayout>
        <div className="app-loading-state">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </AppLayout>
    );
  }

  const Layout = isStaffOrAdmin ? AdminLayout : AppLayout;

  return (
    <Layout>
      <div className="page-stack">
        <div>
          <h1 className="page-title">Phân tích đồ thị</h1>
          <p className="page-subtitle">
            Phân tích Neo4j nâng cao cho nhân viên và quản trị viên.
          </p>
        </div>

        {error && (
          <div className="app-alert-error">{error}</div>
        )}

        <section className="stats-grid">
          <SummaryCard label="Thể loại" value={categorySummary.categoryCount.toLocaleString('en-US')} />
          <SummaryCard label="Tổng doanh thu" value={formatMoney(categorySummary.totalRevenue)} />
          <SummaryCard label="Sách đã bán" value={categorySummary.totalSold.toLocaleString('en-US')} />
          <SummaryCard label="Mua hàng gần nhất" value={formatLatestPurchase(categorySummary.latestPurchase)} />
        </section>

        <DashboardCharts categories={categoryGrowth} />

        {/* Category Growth */}
        <Section title="Tăng trưởng theo thể loại (30 ngày)" subtitle="Các thể loại xếp hạng theo số đơn hoàn thành trong 30 ngày qua">
          {categoryGrowth.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-light">
                    <th className="table-th text-left">#</th>
                    <th className="table-th text-left">THỂ LOẠI</th>
                    <th className="table-th text-right">DOANH THU</th>
                    <th className="table-th text-right">TB / GIAO DỊCH</th>
                    <th className="table-th text-right">KHÁCH HÀNG</th>
                    <th className="table-th text-right">ĐÃ BÁN</th>
                    <th className="table-th text-right">MUA GẦN NHẤT</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryGrowth.map((cat, i) => (
                    <tr key={cat.categoryId} className={`border-b border-border ${i % 2 !== 0 ? 'bg-bg-light' : ''}`}>
                      <td className="py-3 px-4 text-sm font-bold text-gray-400">{i + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{cat.categoryName}</td>
                      <td className="py-3 px-4 text-right text-accent font-semibold">
                        {formatMoney(cat.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 font-semibold">
                        {cat.totalSold > 0 ? formatMoney(Math.round(cat.revenue / cat.totalSold)) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-primary">{cat.customerCount}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{cat.totalSold}</td>
                      <td className="py-3 px-4 text-right text-gray-600 font-medium">
                        {formatLatestPurchase(cat.latestPurchasedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Influential Books */}
        <Section title="Sách có ảnh hưởng cao" subtitle="Điểm ảnh hưởng = lượt mua x3 + lượt xem x1 + kết nối khách hàng x2">
          {influentialBooks.length === 0 ? (
            <Empty />
          ) : (
            <div className="app-grid-books p-4">
              {influentialBooks.map((book) => {
                const catalog = book.isbn ? catalogByIsbn[book.isbn] : undefined;
                const graph = book.isbn ? graphByIsbn[book.isbn] : undefined;

                return (
                  <BookCard
                    key={book.isbn}
                    isbn={catalog?.isbn || graph?.isbn || book.isbn}
                    title={catalog?.title || graph?.title || book.title}
                    price={catalog?.price ?? graph?.price}
                    avgRating={graph?.avgRating ?? book.avgRating}
                    ratingCount={graph?.ratingCount}
                    purchaseCount={graph?.purchaseCount}
                    viewCount={graph?.viewCount}
                    coverUrl={graph?.coverUrl || catalog?.coverUrl || book.coverUrl}
                    authorName={catalog?.author?.name || graph?.authorName}
                    categoryName={catalog?.category?.name || graph?.categoryName}
                    status={catalog?.businessStatus}
                    stockQuantity={catalog?.stockQuantity}
                    badge={book.influenceScore.toFixed(1)}
                    badgeColor="bg-soft-panel text-ink"
                  />
                );
              })}
            </div>
          )}
        </Section>

        {/* Customer Clusters */}
        {isStaffOrAdmin && (
          <Section title="Nhóm quan tâm của khách hàng" subtitle="Khách hàng được nhóm theo thể loại họ mua nhiều nhất">
            {clusters.length === 0 ? (
              <Empty />
            ) : (
              <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
                {clusters.map((cluster) => {
                  const knownCustomers = cluster.customerIds
                    .map((id) => customerById[id])
                    .filter(Boolean)
                    .sort((a, b) => b.orderCount - a.orderCount || b.itemCount - a.itemCount);
                  const displayCount = knownCustomers.length || cluster.clusterSize;
                  const totalOrders = knownCustomers.reduce((sum, customer) => sum + customer.orderCount, 0);
                  const totalItems = knownCustomers.reduce((sum, customer) => sum + customer.itemCount, 0);

                  return (
                    <div key={cluster.clusterName} className="overflow-hidden rounded-card border border-primary/30 bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-3 border-b border-primary/20 bg-soft-panel px-4 py-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary">Thể loại yêu thích</p>
                          <h3 className="mt-0.5 text-base font-bold text-gray-950">{cluster.clusterName}</h3>
                          <p className="mt-1 text-xs font-medium text-gray-500">
                            Dựa trên lịch sử mua hàng hoàn thành
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white">
                          {displayCount} khách hàng
                        </span>
                      </div>

                      <div className="p-4">
                        {knownCustomers.length > 0 && (
                          <div className="mb-4 grid grid-cols-2 gap-2">
                            <div className="rounded-card border border-border bg-bg-light px-3 py-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Đơn hoàn thành</p>
                              <p className="mt-1 text-xl font-bold text-primary">{totalOrders}</p>
                            </div>
                            <div className="rounded-card border border-border bg-bg-light px-3 py-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Sách đã mua</p>
                              <p className="mt-1 text-xl font-bold text-primary">{totalItems}</p>
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                            Khách hàng trong nhóm
                          </p>
                          <div>
                            {knownCustomers.length > 0 ? (
                              <div className="cluster-customer-table">
                                <div className="cluster-customer-head">
                                  <span>Khách hàng</span>
                                  <span>Đơn hàng</span>
                                  <span>Sách</span>
                                </div>
                                {knownCustomers.map((customer) => (
                                  <div key={customer.id} className="cluster-customer-row">
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                                        {getInitials(customer.name, customer.email)}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-gray-900">{customer.name}</p>
                                        <p className="truncate text-xs font-medium text-gray-500">{customer.email}</p>
                                      </div>
                                    </div>
                                    <div className="cluster-customer-metric">
                                      <span>{customer.orderCount}</span>
                                    </div>
                                    <div className="cluster-customer-metric">
                                      <span>{customer.itemCount}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-card bg-bg-light px-3 py-3 text-sm font-medium text-gray-500">
                                Chưa tìm thấy tài khoản thực tương ứng cho nhóm này.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        )}
      </div>
    </Layout>
  );
};

const Section: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({
  title, subtitle, children,
}) => (
  <section>
    <div className="mb-2">
      <h2 className="section-title">{title}</h2>
    <p className="section-subtitle">{subtitle}</p>
  </div>
  <div className="app-card">{children}</div>
  </section>
);

const Empty: React.FC = () => (
  <div className="py-6 text-center text-sm font-medium text-gray-500">
    Chưa có dữ liệu. Vui lòng đồng bộ dữ liệu vào Neo4j trước.
  </div>
);

const SummaryCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="stat-card">
    <p className="stat-label">{label}</p>
    <p className="stat-value">{value}</p>
  </div>
);

const DashboardCharts: React.FC<{ categories: CategoryGrowth[] }> = ({ categories }) => {
  if (categories.length === 0) return null;

  const maxRevenue = Math.max(...categories.map((cat) => cat.revenue), 1);
  const maxCustomers = Math.max(...categories.map((cat) => cat.customerCount), 1);
  const totalSold = categories.reduce((sum, cat) => sum + cat.totalSold, 0);
  const latestItems = [...categories]
    .sort((a, b) => new Date(b.latestPurchasedAt ?? 0).getTime() - new Date(a.latestPurchasedAt ?? 0).getTime())
    .slice(0, 4);

  return (
    <section>
      <div className="mb-2">
<h2 className="section-title">Biểu đồ tổng quan</h2>
        <p className="section-subtitle">Cái nhìn nhanh về doanh thu, cơ cấu bán hàng và hoạt động mua hàng gần đây.</p>
      </div>
      <div className="grid items-stretch gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div className="app-card app-card-pad flex h-full flex-col gap-3">
          <div className="analytics-chart-panel">
            <div className="analytics-chart-header">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Doanh thu theo thể loại</h3>
                <p className="text-xs font-medium text-gray-500">Đơn hoàn thành trong 30 ngày qua</p>
              </div>
              <span className="rounded-full border border-border bg-bg-light px-2.5 py-1 text-xs font-bold text-primary">
                {categories.length} thể loại
              </span>
            </div>

            <div className="analytics-revenue-plot">
              {categories.map((cat, index) => {
                const height = Math.max(10, Math.round((cat.revenue / maxRevenue) * 100));

                return (
                  <div key={cat.categoryId} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="text-[11px] font-bold text-price">{formatMoney(cat.revenue)}</div>
                    <div className="flex h-36 w-full items-end justify-center">
                      <div
                        className={`w-full max-w-12 rounded-t-md border border-primary/20 ${
                          index === 0 ? 'bg-primary' : 'bg-accent'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${cat.categoryName}: ${formatMoney(cat.revenue)}`}
                      />
                    </div>
                    <p className="line-clamp-2 min-h-8 text-center text-[11px] font-semibold leading-4 text-gray-600">
                      {cat.categoryName}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="analytics-chart-panel">
            <div className="analytics-chart-header">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Phạm vi khách hàng</h3>
                <p className="text-xs font-medium text-gray-500">Khách hàng duy nhất theo thể loại</p>
              </div>
              <span className="text-xs font-bold text-gray-500">
                tối đa {maxCustomers} khách hàng
              </span>
            </div>
            <div className="analytics-reach-list">
              {categories.map((cat) => {
                const width = Math.max(8, Math.round((cat.customerCount / maxCustomers) * 100));

                return (
                  <div key={cat.categoryId} className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-semibold text-gray-800">{cat.categoryName}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-bg-light ring-1 ring-border">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                    <span className="text-right text-xs font-bold text-primary">{cat.customerCount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="app-card app-card-pad flex h-full flex-col">
          <div className="rounded-card border border-border bg-bg-light px-3 py-3">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900">Cơ cấu bán hàng</h3>
              <p className="text-xs font-medium text-gray-500">Tỷ trọng sách bán theo thể loại</p>
            </div>
            <div className="space-y-3">
              {categories.map((cat) => {
                const percent = totalSold > 0 ? Math.round((cat.totalSold / totalSold) * 100) : 0;

                return (
                  <div key={cat.categoryId}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-semibold text-gray-800">{cat.categoryName}</span>
                      <span className="shrink-0 font-bold text-gray-500">{percent}% · {cat.totalSold} đã bán</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-bg-light ring-1 ring-border">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(percent, 4)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex-1 rounded-card border border-border bg-bg-light px-3 py-3">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-gray-900">Hoạt động mua hàng gần đây</h3>
              <p className="text-xs font-medium text-gray-500">Mua hàng theo thể loại gần nhất từ đồ thị</p>
            </div>
            <div className="space-y-2">
              {latestItems.map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between gap-3 rounded-card border border-border bg-bg-light px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{cat.categoryName}</p>
                    <p className="text-xs font-medium text-gray-500">{cat.totalSold} giao dịch · {formatMoney(cat.revenue)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {formatLatestPurchase(cat.latestPurchasedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
