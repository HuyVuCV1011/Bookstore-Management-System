export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string>;
}

export type BusinessStatus = 'ACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';
