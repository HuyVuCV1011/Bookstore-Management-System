// frontend/src/types/cart.ts
export interface CartItem {
  bookId: number;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  stockQuantity: number;
  isbn?: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

export interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  addToCart: (bookId: number, quantity: number) => Promise<void>;
  addItem: (bookId: number, quantity: number) => Promise<void>;
  updateQuantity: (bookId: number, quantity: number) => Promise<void>;
  removeFromCart: (bookId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}
