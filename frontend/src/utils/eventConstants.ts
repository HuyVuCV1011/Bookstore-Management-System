import type { EventType } from '../types/interactionEvent';

export const EVENT_COLORS: Record<EventType, string> = {
  VIEW: '#3B82F6',        // Blue
  CLICK: '#8B5CF6',       // Purple
  ADD_TO_CART: '#F97316', // Orange
  PURCHASE: '#10B981',    // Green
  LIKE: '#EC4899',        // Pink
  REVIEW: '#6366F1',      // Indigo
  SHARE: '#14B8A6',       // Teal
  BOOKMARK: '#EAB308',    // Yellow
  SEARCH: '#6B7280'       // Gray
};

export const EVENT_LABELS: Record<EventType, string> = {
  VIEW: 'Xem',
  CLICK: 'Click',
  ADD_TO_CART: 'Thêm giỏ',
  PURCHASE: 'Mua',
  LIKE: 'Thích',
  REVIEW: 'Đánh giá',
  SHARE: 'Chia sẻ',
  BOOKMARK: 'Đánh dấu',
  SEARCH: 'Tìm kiếm'
};

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'VIEW', label: 'Xem' },
  { value: 'CLICK', label: 'Click' },
  { value: 'ADD_TO_CART', label: 'Thêm giỏ' },
  { value: 'PURCHASE', label: 'Mua' },
  { value: 'LIKE', label: 'Thích' },
  { value: 'REVIEW', label: 'Đánh giá' },
  { value: 'SHARE', label: 'Chia sẻ' },
  { value: 'BOOKMARK', label: 'Đánh dấu' },
  { value: 'SEARCH', label: 'Tìm kiếm' }
];
