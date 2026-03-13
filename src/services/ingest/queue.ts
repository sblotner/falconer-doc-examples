import { IngestJob, IngestPayload, IngestStatus } from '../../types/ingest';
import { processIngestJob } from './processor';

const jobQueue: IngestJob[] = [];

export async function enqueueIngestJob(payload: IngestPayload): Promise<IngestJob> {
  const job: IngestJob = {
    id: generateJobId(),
    sourceId: payload.source,
    payload: { data: payload.data, metadata: payload.metadata },
    status: 'pending',
    retries: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  jobQueue.push(job);
  console.log(`[queue] Enqueued job ${job.id} for source ${job.sourceId}`);

  // Process asynchronously — don't await
  processIngestJob(job).catch((err) => {
    console.error(`[queue] Job ${job.id} failed:`, err);
    job.status = 'failed';
  });

  return job;
}

export function getQueueDepth(): number {
  return jobQueue.filter((j) => j.status === 'pending').length;
}

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
