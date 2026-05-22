export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RECEIVING'
  | 'COMPLETED'
  | 'CANCELLED';

export type PurchaseOrder = {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  status: PurchaseOrderStatus;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  totalAmount: number;
  itemCount?: number;
  notes: string | null;
  createdBy: string;
  receivedBy: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderDetail = PurchaseOrder & {
  items: PurchaseOrderItem[];
};

export type PurchaseOrderItem = {
  id: number;
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  lineTotal: number;
  notes: string | null;
};

export type CreatePurchaseOrderRequest = {
  supplierId: number;
  expectedDeliveryDate?: string;
  notes?: string;
  items: {
    bookId: number;
    quantity: number;
    unitCost: number;
    notes?: string;
  }[];
};

export type UpdatePurchaseOrderRequest = CreatePurchaseOrderRequest;

export type ReceiveGoodsRequest = {
  items: {
    itemId: number;
    quantityReceived: number;
  }[];
};

export type PageResponse<T> = {
  data: T[];
  content?: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
