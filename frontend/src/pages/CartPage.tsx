import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { AppLayout } from '../components/layout/AppLayout';
import { CartItem } from '../components/cart/CartItem';
import { CartSummary } from '../components/cart/CartSummary';

export const CartPage: React.FC = () => {
  const { cart, isLoading, clearCart } = useCart();
  const navigate = useNavigate();

  const handleClear = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) return;
    try {
      await clearCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-stack">
        {/* Page Header */}
        <div className="app-card-muted app-card-pad flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="page-title">Giỏ hàng</h1>
            <p className="page-subtitle">
              Bạn có {cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0} sản phẩm trong giỏ hàng
            </p>
          </div>
          {cart && cart.items.length > 0 && (
            <button
              onClick={handleClear}
              className="btn-secondary inline-flex h-10 shrink-0 items-center justify-center gap-2 px-4 text-sm text-red-600 hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa giỏ hàng
            </button>
          )}
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="app-card-muted app-card-pad text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="section-title mb-2">Giỏ hàng trống</h2>
            <p className="section-subtitle mb-6 max-w-md mx-auto">
              Có vẻ như bạn chưa thêm sách nào. Bắt đầu duyệt để tìm cuốn sách tuyệt vời tiếp theo của bạn!
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-buy inline-flex h-10 items-center justify-center px-6 text-sm"
            >
              Duyệt sách →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              {cart.items.map((item) => (
                <CartItem key={item.bookId} item={item} />
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <CartSummary />
                <div className="app-card-muted app-card-pad mt-3 flex gap-3 items-start">
                  <span className="text-2xl">🚚</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Miễn phí vận chuyển</p>
                    <p className="text-xs text-gray-600 mt-0.5">Đơn hàng của bạn đủ điều kiện miễn phí vận chuyển!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CartPage;
