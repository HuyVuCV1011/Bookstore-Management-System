export type CdcStatus = {
  enabled: boolean;
  mongoConnected: boolean;
  lastSyncTime: string;
  queueDepth: number;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
};

export type CdcStats = {
  totalBooksPostgres: number;
  totalBooksMongo: number;
  syncSuccessCount: number;
  syncFailureCount: number;
  successRate: number;
  avgSyncDurationMs: number;
};
