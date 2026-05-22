export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'E_WALLET' | 'COD' | 'MOMO';

export interface OrderItem {
  id: string; // UUID
  bookId: number;
  isbn: string;
  title: string;
  bookTitle?: string;
  authorName?: string;
  categoryName?: string;
  coverUrl?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  subtotal?: number;
  discount?: number;
  notes?: string;
}

export interface Order {
  id: string; // UUID
  orderCode: string;
  userId: string;
  customerId?: number;
  customerName: string;
  salesEmployeeId?: string;
  customerEmail: string;
  status: OrderStatus;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderedAt: string;
  createdAt?: string;
  updatedAt?: string;
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod | string;
  paymentDate?: string;
  transactionReference?: string;
  shippingAddress: string;
  phoneNumber?: string;
  notes?: string;
  itemCount: number;
  items?: OrderItem[];
}

export interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  processingOrders: number;
  cancelledOrders: number;
  totalItems: number;
  totalRevenue: number;
}

export interface OrderDetail extends Order {
  customerEmail: string;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  items: {
    bookId: number;
    quantity: number;
  }[];
  shippingAddress: string;
  phoneNumber: string;
  paymentMethod: PaymentMethod;
  shippingFee: number;
}

export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus;
  notes?: string;
}
