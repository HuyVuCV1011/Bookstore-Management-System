import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Cart, CartContextType, CartItem } from '../types/cart';
import { bookApi } from '../services/api/bookApi';
import { cartApi } from '../services/api/cartApi';
import { wishlistApi } from '../services/api/wishlistApi';
import { useAuth } from './AuthContext';

const GUEST_WISHLIST_KEY = 'bookstore_guest_wishlist';

interface BackendCartItem {
  bookId: number;
  quantity: number;
}

interface BackendCart {
  items?: BackendCartItem[];
}

const emptyCart: Cart = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// Get guest wishlist from localStorage
const getGuestWishlist = (): number[] => {
  try {
    const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Clear guest wishlist from localStorage
const clearGuestWishlist = (): void => {
  localStorage.removeItem(GUEST_WISHLIST_KEY);
};

const normalizeCartItems = (data: BackendCart | Record<string, unknown>): BackendCartItem[] => {
  if ('items' in data && Array.isArray(data.items)) {
    return data.items;
  }

  return Object.entries(data).map(([bookId, quantity]) => ({
    bookId: Number(bookId),
    quantity: Number(quantity),
  }));
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(true);

  const buildCart = async (items: BackendCartItem[]): Promise<Cart> => {
    const enrichedItems = await Promise.all(
      items.map(async (item): Promise<CartItem | null> => {
        try {
          const response = await bookApi.getById(item.bookId);
          const book = response.data;

          return {
            bookId: book.id,
            title: book.title,
            price: Number(book.price),
            quantity: item.quantity,
            subtotal: Number(book.price) * item.quantity,
            stockQuantity: book.stockQuantity,
            isbn: book.isbn,
          };
        } catch (error) {
          console.error('Failed to load cart book details', error);
          return null;
        }
      })
    );

    const validItems = enrichedItems.filter((item): item is CartItem => item !== null);

    return {
      items: validItems,
      totalItems: validItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: validItems.reduce((sum, item) => sum + item.subtotal, 0),
    };
  };

  const refreshCart = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Fetch from backend for all users (backend handles cookies for guests)
      const response = await cartApi.getCart();
      const items = normalizeCartItems(response.data);
      setCart(await buildCart(items));
    } catch (error) {
      console.error('Failed to refresh cart', error);
      setCart(emptyCart);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const syncCart = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated) {
          // User just logged in - merge guest wishlist with backend
          // Cart is auto-merged by backend on login
          const guestWishlistIds = getGuestWishlist();

          // Merge wishlist
          if (guestWishlistIds.length > 0) {
            console.log('Merging guest wishlist with user wishlist:', guestWishlistIds);
            for (const bookId of guestWishlistIds) {
              try {
                await wishlistApi.addItem(bookId);
              } catch (error) {
                console.error('Failed to add item to wishlist:', error);
              }
            }
            clearGuestWishlist();
          }
        }

        await refreshCart();
      } finally {
        setIsLoading(false);
      }
    };

    syncCart();
  }, [isAuthenticated, isAuthLoading]);

  const addToCart = async (bookId: number, quantity: number): Promise<void> => {
    // Add to backend for all users (backend handles cookies for guests)
    await cartApi.addItem({ bookId, quantity });
    await refreshCart();
  };

  const updateQuantity = async (bookId: number, quantity: number): Promise<void> => {
    if (quantity <= 0) {
      await removeFromCart(bookId);
      return;
    }

    // Update in backend for all users (backend handles cookies for guests)
    await cartApi.updateItem({ bookId, quantity });
    await refreshCart();
  };

  const removeFromCart = async (bookId: number): Promise<void> => {
    // Remove from backend for all users (backend handles cookies for guests)
    await cartApi.removeItem(bookId);
    await refreshCart();
  };

  const clearCart = async (): Promise<void> => {
    // Clear in backend for all users (backend handles cookies for guests)
    await cartApi.clearCart();
    setCart(emptyCart);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        addItem: addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
