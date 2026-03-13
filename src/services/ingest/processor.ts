import { IngestJob, IngestResult } from '../../types/ingest';
import { validateIngestPayload } from './validator';
import { saveRecords } from '../storage';
import { notifyCompletion } from '../notifier';

const MAX_RETRIES = 3;

export async function processIngestJob(job: IngestJob): Promise<IngestResult> {
  console.log(`[processor] Starting job ${job.id}`);
  job.status = 'processing';
  job.updatedAt = new Date();

  const payload = job.payload as any;
  const validation = validateIngestPayload(payload);

  if (!validation.valid) {
    job.status = 'failed';
    return {
      jobId: job.id,
      status: 'failed',
      recordsProcessed: 0,
      errors: validation.errors,
      completedAt: new Date(),
    };
  }

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const records = payload.data.map(normalizeRecord);
      await saveRecords(job.sourceId, records);
      await notifyCompletion(job.id, records.length);

      job.status = 'complete';
      job.updatedAt = new Date();

      return {
        jobId: job.id,
        status: 'complete',
        recordsProcessed: records.length,
        errors: [],
        completedAt: new Date(),
      };
    } catch (err) {
      attempt++;
      job.retries = attempt;
      console.warn(`[processor] Job ${job.id} attempt ${attempt} failed:`, err);
    }
  }

  job.status = 'failed';
  return {
    jobId: job.id,
    status: 'failed',
    recordsProcessed: 0,
    errors: [`Exceeded max retries (${MAX_RETRIES})`],
    completedAt: new Date(),
  };
}

function normalizeRecord(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    ...raw,
    _ingestedAt: new Date().toISOString(),
    _source: 'ingest-pipeline',
  };
}
