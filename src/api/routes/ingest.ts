import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { enqueueIngestJob } from '../../services/ingest/queue';
import { IngestPayload } from '../../types/ingest';

const router = Router();

router.post('/ingest', authMiddleware, async (req: Request, res: Response) => {
  const payload: IngestPayload = req.body;

  if (!payload.source || !payload.data?.length) {
    res.status(400).json({ error: 'Missing required fields: source, data' });
    return;
  }

  try {
    const job = await enqueueIngestJob(payload);
    res.status(202).json({ jobId: job.id, status: job.status });
  } catch (err) {
    console.error('[ingest route] Failed to enqueue job:', err);
    res.status(500).json({ error: 'Failed to enqueue ingest job' });
  }
});

router.get('/ingest/:jobId', authMiddleware, async (req: Request, res: Response) => {
  const { jobId } = req.params;
  // Return job status — looked up from the queue or DB
  res.status(200).json({ jobId, status: 'processing' });
});

export default router;
