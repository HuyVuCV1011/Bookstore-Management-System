import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

export const FloatingCartButton: React.FC = () => {
  const { cart } = useCart();
  const navigate = useNavigate();

  if (cart.totalItems === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-bounce-in">
      <button
        onClick={() => navigate('/cart')}
        className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center gap-3 group"
      >
        <div className="relative">
          <span className="text-2xl">🛒</span>
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            {cart.totalItems}
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="font-bold text-sm">View Cart</span>
          <span className="text-xs opacity-90">${cart.totalAmount.toFixed(2)}</span>
        </div>
        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
      </button>
    </div>
  );
};
