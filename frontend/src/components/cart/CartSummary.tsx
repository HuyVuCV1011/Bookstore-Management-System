// frontend/src/components/cart/CartSummary.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

export const CartSummary: React.FC = () => {
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
        📋 Tóm tắt đơn hàng
      </h2>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Số lượng sản phẩm:</span>
          <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
            {cart.totalItems}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Tạm tính:</span>
          <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
            {cart.totalAmount.toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      <div className="border-t dark:border-gray-700 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            Tổng cộng:
          </span>
          <span className="text-2xl font-bold text-primary">
            {cart.totalAmount.toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={cart.items.length === 0}
        className="w-full py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        🎉 Tiến hành thanh toán
      </button>

      <p className="text-xs text-text-secondary text-center mt-4">
        Phí vận chuyển sẽ được tính ở bước thanh toán
      </p>
    </div>
  );
};
