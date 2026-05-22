import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

export const FrapButton: React.FC = () => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const cartCount = cart?.totalItems || 0;

  return (
    <button
      onClick={() => navigate('/cart')}
      aria-label="View Cart"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#00754A] text-white transition-all duration-200 hover:bg-[#006241] active:scale-95 shadow-[0_0_6px_rgba(0,0,0,0.24),0_8px_12px_rgba(0,0,0,0.14)] active:shadow-[0_0_6px_rgba(0,0,0,0.24)] cursor-pointer"
      style={{
        marginRight: '-0.8rem', // Touch offset comfort adjustment
      }}
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#cba258] px-1.5 text-xs font-bold text-white shadow-sm animate-pulse">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </button>
  );
};
