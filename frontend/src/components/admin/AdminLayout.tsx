import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '../layout/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosConfig';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavLink {
  label: string;
  path: string;
  icon: React.ReactNode;
  section?: string;
  roles?: string[]; // Which roles can see this link
}

const navLinks: NavLink[] = [
  {
    label: 'Tổng quan',
    path: '/admin/dashboard',
    section: 'Chính',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Đơn hàng',
    path: '/orders',
    section: 'Chính',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Đề xuất',
    path: '/recommendations',
    section: 'Chính',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    label: 'Sách',
    path: '/admin/books',
    section: 'Danh mục',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: 'Thể loại',
    path: '/admin/categories',
    section: 'Danh mục',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    label: 'Tác giả',
    path: '/admin/authors',
    section: 'Danh mục',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Nhà xuất bản',
    path: '/admin/publishers',
    section: 'Danh mục',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: 'Đánh giá',
    path: '/admin/reviews',
    section: 'Danh mục',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    label: 'Khách hàng',
    path: '/admin/customers',
    section: 'Khách hàng & Bảo mật',
    roles: ['ADMIN'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Người dùng',
    path: '/admin/users',
    section: 'Khách hàng & Bảo mật',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Nhân viên kho',
    path: '/admin/staff',
    section: 'Khách hàng & Bảo mật',
    roles: ['ADMIN'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Quản lý Phiên',
    path: '/admin/sessions',
    section: 'Khách hàng & Bảo mật',
    roles: ['ADMIN'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    label: 'Phân tích',
    path: '/analytics',
    section: 'Phân tích',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Thống kê danh mục',
    path: '/admin/catalog-statistics',
    section: 'Phân tích',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Sách phổ biến',
    path: '/admin/popular-books',
    section: 'Phân tích',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: 'Phân tích Tương tác',
    path: '/admin/interaction-events',
    section: 'Phân tích',
    roles: ['ADMIN'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
  {
    label: 'Giám sát CDC',
    path: '/admin/cdc-monitoring',
    section: 'Hệ thống',
    roles: ['ADMIN'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  {
    label: 'Sức khỏe hệ thống',
    path: '/admin/system-health',
    section: 'Hệ thống',
    roles: ['ADMIN'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const fetchHealth = () => {
        axiosInstance.get('/admin/system/health')
          .then(res => setHealthData(res.data))
          .catch(err => console.error('Failed to fetch health data for sidebar:', err));
      };

      fetchHealth();
      const interval = setInterval(fetchHealth, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Filter links based on user role
  const filteredLinks = navLinks.filter(link => {
    if (!link.roles) return true; // No role restriction
    return link.roles.includes(user?.role || '');
  });

  // Group filtered links by section
  const sections = filteredLinks.reduce((acc, link) => {
    const section = link.section || 'Other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(link);
    return acc;
  }, {} as Record<string, NavLink[]>);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary-light">
      <Navbar />
      <div className="flex">
        {/* Fixed Left Sidebar */}
        <aside className="w-64 min-h-screen bg-white border-r border-border">
          <nav className="p-4">
            {Object.entries(sections).map(([sectionName, links]) => (
              <div key={sectionName} className="mb-6">
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {sectionName}
                </h3>
                <ul className="space-y-1">
                  {links.map((link) => {
                    const isActive = location.pathname === link.path ||
                                     (link.path !== '/' && location.pathname.startsWith(link.path));

                    let badgeElement = null;
                    if (link.path === '/admin/cdc-monitoring' && healthData) {
                      const mongoProj = healthData.projections?.find((p: any) => p.targetDatabase === 'MongoDB');
                      const neo4jProj = healthData.projections?.find((p: any) => p.targetDatabase === 'Neo4j');
                      const backlog = Math.max(mongoProj?.backlogDepth || 0, neo4jProj?.backlogDepth || 0);
                      const isDegraded = mongoProj?.status === 'DEGRADED' || neo4jProj?.status === 'DEGRADED' ||
                                         mongoProj?.status === 'LAGGING' || neo4jProj?.status === 'LAGGING';

                      if (backlog > 0) {
                        badgeElement = (
                          <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {backlog}
                          </span>
                        );
                      } else if (isDegraded) {
                        badgeElement = (
                          <span className="ml-auto h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        );
                      }
                    }

                    if (link.path === '/admin/system-health' && healthData) {
                      const hasDown = healthData.postgresStatus === 'DOWN' ||
                                      healthData.mongoDbStatus === 'DOWN' ||
                                      healthData.redisStatus === 'DOWN' ||
                                      healthData.cassandraStatus === 'DOWN' ||
                                      healthData.neo4jStatus === 'DOWN';
                      if (hasDown) {
                        badgeElement = (
                          <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Lỗi
                          </span>
                        );
                      } else {
                        badgeElement = (
                          <span className="ml-auto h-2.5 w-2.5 rounded-full bg-green-500" />
                        );
                      }
                    }

                    return (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {link.icon}
                            <span>{link.label}</span>
                          </div>
                          {badgeElement}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
