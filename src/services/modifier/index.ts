const WEBHOOK_URL = process.env.NOTIFY_WEBHOOK_URL;

interface CompletionEvent {
  jobId: string;
  recordsProcessed: number;
  completedAt: string;
}

export async function notifyCompletion(
  jobId: string,
  recordsProcessed: number
): Promise<void> {
  const event: CompletionEvent = {
    jobId,
    recordsProcessed,
    completedAt: new Date().toISOString(),
  };

  console.log(`[notifier] Job ${jobId} complete — ${recordsProcessed} records processed`);

  if (!WEBHOOK_URL) {
    console.warn('[notifier] No NOTIFY_WEBHOOK_URL set, skipping webhook');
    return;
  }

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`[notifier] Webhook failed with status ${response.status}`);
  }

  console.log(`[notifier] Webhook delivered for job ${jobId}`);
}
