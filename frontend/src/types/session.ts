export interface Session {
  sessionId: string;
  userId: string;
  userEmail: string;
  deviceInfo: string;
  ipAddress: string;
  revoked: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  revokedSessions: number;
  expiredSessions: number;
}

export interface SessionFilters {
  email?: string;
  userId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface SessionResponse {
  content: Session[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
