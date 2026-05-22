import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-gray-50 to-blue-50 dark:from-bg-dark dark:via-gray-900 dark:to-blue-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark hover:opacity-80 transition">
              📚 Nhà Sách
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/cart" className="text-text-secondary hover:text-primary transition">Giỏ hàng</Link>
              {user && (
                <>
                  <Link to="/wishlist" className="text-text-secondary hover:text-primary transition">Yêu thích</Link>
                  <Link to="/orders" className="text-text-secondary hover:text-primary transition">Đơn hàng</Link>
                </>
              )}
              <Link to="/demo/fast-search" className="text-primary font-medium hover:opacity-80 transition">⚡ Tìm nhanh</Link>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link to="/profile" className="hidden sm:flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition">
                    <span className="text-lg">👤</span>
                    <span>{user.fullName}</span>
                  </Link>
                  <Button variant="secondary" onClick={handleLogout} className="text-sm py-1.5">
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => navigate('/login')} className="text-sm py-1.5">
                    Đăng nhập
                  </Button>
                  <Button onClick={() => navigate('/register')} className="text-sm py-1.5">
                    Đăng ký
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-gray-800/50 border-t mt-auto">
        <div className="container mx-auto px-4 py-8 text-center text-text-secondary text-sm">
          &copy; 2026 Nhà Sách - Dự án đa cơ sở dữ liệu. Xây dựng với React, Spring Boot, Postgres, Mongo & Redis.
        </div>
      </footer>
    </div>
  );
};
