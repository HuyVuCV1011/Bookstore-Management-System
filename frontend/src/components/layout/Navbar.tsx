import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useEffect } from 'react';
import { wishlistApi } from '../../services/api/wishlistApi';

const navLinks = [
  { to: '/orders',         label: 'Đơn hàng',        roles: ['CUSTOMER', 'STAFF', 'ADMIN'] },
  { to: '/recommendations',label: 'Đề xuất',         roles: ['CUSTOMER', 'STAFF', 'ADMIN'] },
  { to: '/demo/fast-search', label: '⚡ Tìm nhanh',   roles: ['GUEST', 'CUSTOMER', 'STAFF', 'ADMIN'] },
  { to: '/analytics',      label: 'Phân tích',       roles: ['STAFF', 'ADMIN'] },
  { to: '/admin/users',    label: 'Người dùng',      roles: ['ADMIN'] },
  { to: '/admin/books',    label: 'Quản lý sách',    roles: ['STAFF', 'ADMIN'] },
];

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name?.trim() || email?.trim() || 'User';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};


const getRoleLabel = (role?: string) => {
  if (role === 'ADMIN') return 'QUẢN TRỊ VIÊN';
  if (role === 'STAFF') return 'NHÂN VIÊN';
  return 'KHÁCH HÀNG';
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const initials = getInitials(user?.fullName, user?.email);
  const roleLabel = getRoleLabel(user?.role);

  // Get cart count from CartContext (reactive to cart changes)
  const cartCount = cart?.totalItems || 0;

  const updateWishlistCount = () => {
    if (!user) {
      // For guest users, read wishlist from localStorage
      try {
        const guestWishlist = localStorage.getItem('bookstore_guest_wishlist');
        if (guestWishlist) {
          const bookIds = JSON.parse(guestWishlist);
          setWishlistCount(bookIds.length);
        } else {
          setWishlistCount(0);
        }
      } catch {
        setWishlistCount(0);
      }
      return;
    }

    // Fetch wishlist count for authenticated users
    wishlistApi.getWishlist()
      .then((res) => {
        const bookIds = res.data?.bookIds || [];
        setWishlistCount(bookIds.length);
      })
      .catch(() => setWishlistCount(0));
  };

  useEffect(() => {
    updateWishlistCount();

    // Listen for wishlist updates
    const handleWishlistUpdate = () => updateWishlistCount();
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Redirect to homepage after logout
  };

  const visibleLinks = navLinks.filter(
    (l) => {
      const userRole = user?.role || 'GUEST';
      return l.roles.includes(userRole);
    }
  );
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));

  return (
    <header className="sticky top-0 z-40 border-b border-[#edebe9] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),_0_2px_2px_rgba(0,0,0,0.06),_0_0_2px_rgba(0,0,0,0.07)] backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-10">
        <div className="flex items-center h-[72px] md:h-[83px] lg:h-[99px] justify-between gap-4">
          
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8 lg:gap-12 flex-1">
            {/* Logo */}
            <Link to="/" className="font-bold text-lg md:text-xl text-[#006241] shrink-0 flex items-center gap-3 tracking-[0.05em]">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#006241] text-white shadow-md transition-transform hover:scale-105">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                </svg>
              </span>
              <span className="hidden sm:inline font-extrabold uppercase">SIREN READS BOOKSTORE</span>
              <span className="sm:hidden font-extrabold uppercase">BOOKSTORE</span>
            </Link>

            {/* Desktop nav links - Hidden for ADMIN and STAFF */}
            {user?.role !== 'ADMIN' && user?.role !== 'STAFF' && (
              <nav className="hidden xl:flex items-center gap-6">
                {visibleLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`font-sans font-bold text-[13px] tracking-[0.1em] uppercase hover:text-[#00754A] transition-colors py-2 border-b-2 ${
                      isActive(link.to)
                        ? 'border-[#00754A] text-[#00754A]'
                        : 'border-transparent text-[rgba(0,0,0,0.87)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Cart, Wishlist, and Auth Actions */}
          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            {/* Cart & Wishlist - Hidden for ADMIN and STAFF */}
            {user?.role !== 'ADMIN' && user?.role !== 'STAFF' && (
              <div className="flex items-center gap-3">
                {/* Wishlist */}
                <Link
                  to="/wishlist"
                  className="relative rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#00754A]"
                  title="Yêu thích"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#cba258] px-1 text-[11px] font-bold text-white shadow-sm">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#00754A]"
                  title="Giỏ hàng"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00754A] px-1 text-[11px] font-bold text-white shadow-sm">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* Authentication Buttons / User Menu */}
            <div className="hidden xl:flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/profile" className="account-pill cursor-pointer hover:bg-gray-50 transition-colors py-1 px-3 border border-[#edebe9] rounded-full flex items-center gap-2">
                    <span className="account-avatar bg-[#006241] text-white rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold">{initials}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-black leading-tight">{user.fullName}</p>
                      <span className="text-[10px] uppercase font-semibold text-[#00754A] tracking-wider">{roleLabel}</span>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-black bg-white px-5 py-2 text-xs font-bold tracking-wider uppercase text-black hover:bg-gray-50 transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="rounded-full border border-black bg-white px-5 py-2 text-xs font-bold tracking-wider uppercase text-black hover:bg-gray-50 transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-black hover:bg-gray-900 px-5 py-2 text-xs font-bold tracking-wider uppercase text-white transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              className="xl:hidden p-2 text-black hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="xl:hidden overflow-hidden border-t border-[#edebe9] bg-white animate-fadeIn">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-2">
            {/* Nav links */}
            {user?.role !== 'ADMIN' && user?.role !== 'STAFF' && visibleLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-bold tracking-wider uppercase ${
                  isActive(link.to)
                    ? 'bg-[#00754A] text-white'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Auth actions */}
            <div className="mt-4 border-t border-[#edebe9] pt-4">
              {user ? (
                <div className="flex flex-col gap-3">
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <span className="account-avatar bg-[#006241] text-white rounded-full h-10 w-10 flex items-center justify-center text-sm font-bold">{initials}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-black">{user.fullName}</p>
                      <span className="text-xs uppercase font-semibold text-[#00754A] tracking-wider">{user.role}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="w-full text-center rounded-full border border-black bg-white py-3 text-xs font-bold tracking-wider uppercase text-black hover:bg-gray-50 transition-all duration-200 active:scale-95"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center rounded-full border border-black bg-white py-3 text-xs font-bold tracking-wider uppercase text-black hover:bg-gray-50 transition-all"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center rounded-full bg-black py-3 text-xs font-bold tracking-wider uppercase text-white hover:bg-gray-900 transition-all shadow-sm"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
