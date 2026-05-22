// frontend/src/components/cart/CartItem.tsx
import React from 'react';
import type { CartItem as CartItemType } from '../../types/cart';
import { useCart } from '../../contexts/CartContext';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= item.stockQuantity) {
      updateQuantity(item.bookId, newQuantity);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all p-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Book Info */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            {item.title}
          </h3>
          {item.isbn && (
            <p className="text-sm text-text-secondary mb-2">
              ISBN: {item.isbn}
            </p>
          )}
          <p className="text-xl font-semibold text-primary mb-1">
            {item.price.toLocaleString('vi-VN')} đ
          </p>
          <p className="text-sm text-text-secondary">
            Còn {item.stockQuantity} sản phẩm
          </p>
        </div>

        {/* Quantity Controls & Actions */}
        <div className="flex items-center gap-4">
          {/* Quantity Control */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition text-text-primary-light dark:text-text-primary-dark font-bold"
            >
              −
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              min={1}
              max={item.stockQuantity}
              className="w-16 text-center bg-transparent border-none text-text-primary-light dark:text-text-primary-dark font-semibold focus:outline-none"
            />
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= item.stockQuantity}
              className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition text-text-primary-light dark:text-text-primary-dark font-bold"
            >
              +
            </button>
          </div>

          {/* Subtotal */}
          <div className="min-w-[120px] text-right">
            <p className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {item.subtotal.toLocaleString('vi-VN')} đ
            </p>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => removeFromCart(item.bookId)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            title="Xóa khỏi giỏ hàng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
