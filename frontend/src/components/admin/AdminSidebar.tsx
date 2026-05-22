import React from 'react';
import { NavLink } from 'react-router-dom';

export const AdminSidebar: React.FC = () => {
  const links = [
    { to: '/', label: 'Cửa hàng' },
    { to: '/admin/books', label: 'Quản lý sách' },
    { to: '/admin/categories', label: 'Danh mục' },
    { to: '/admin/authors', label: 'Tác giả' },
    { to: '/admin/publishers', label: 'Nhà xuất bản' },
    { to: '/admin/customers', label: 'Khách hàng' },
    { to: '/admin/staff', label: 'Nhân viên kho' },
    { to: '/admin/users', label: 'Người dùng' },
  ];

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-border bg-white lg:block">
      <div className="border-b border-border px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Admin</p>
        <h2 className="mt-1 text-lg font-bold text-gray-900">Operations</h2>
      </div>
      <nav className="space-y-1 px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-button px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-700 hover:bg-bg-light hover:text-primary'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
