export type EventType =
  | 'VIEW'
  | 'CLICK'
  | 'ADD_TO_CART'
  | 'PURCHASE'
  | 'LIKE'
  | 'REVIEW'
  | 'SHARE'
  | 'BOOKMARK'
  | 'SEARCH';

export interface InteractionEvent {
  id: string;
  userId: string;
  userEmail: string;
  bookId: number;
  bookTitle: string;
  eventType: EventType;
  eventTime: string;
  metadata: string;
  flagged: boolean;
  flagReason?: string;
  flaggedAt?: string;
  flaggedByEmail?: string;
}

export interface InteractionEventStats {
  totalEvents: number;
  eventsToday: number;
  flaggedEvents: number;
  uniqueUsers: number;
}

export interface EventDistribution {
  eventType: EventType;
  count: number;
  percentage: number;
}

export interface TopBook {
  bookId: number;
  bookTitle: string;
  count: number;
}

export interface InteractionEventFilters {
  eventType?: EventType[];
  flagged?: boolean;
  userId?: string;
  bookId?: number;
  eventTimeFrom?: string;
  eventTimeTo?: string;
  search?: string;
}

export interface InteractionEventResponse {
  events: InteractionEvent[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export interface FlagRequest {
  reason: string;
}
