export type IngestStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface IngestJob {
  id: string;
  sourceId: string;
  payload: Record<string, unknown>;
  status: IngestStatus;
  retries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IngestResult {
  jobId: string;
  status: IngestStatus;
  recordsProcessed: number;
  errors: string[];
  completedAt: Date;
}

export interface IngestPayload {
  source: string;
  data: Record<string, unknown>[];
  metadata?: Record<string, string>;
}
