const DB_URL = process.env.DATABASE_URL ?? 'postgres://localhost:5432/appdb';

interface StoredRecord {
  sourceId: string;
  data: Record<string, unknown>;
  savedAt: Date;
}

// Simulated in-memory store — replace with real DB client (e.g. pg, Prisma)
const store: StoredRecord[] = [];

export async function saveRecords(
  sourceId: string,
  records: Record<string, unknown>[]
): Promise<void> {
  console.log(`[storage] Saving ${records.length} records for source ${sourceId}`);

  const rows = records.map((data) => ({
    sourceId,
    data,
    savedAt: new Date(),
  }));

  store.push(...rows);
  console.log(`[storage] Saved ${rows.length} records. Total stored: ${store.length}`);
}

export async function getRecordsBySource(sourceId: string): Promise<StoredRecord[]> {
  return store.filter((r) => r.sourceId === sourceId);
}
