import { IngestPayload } from '../../types/ingest';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateIngestPayload(payload: IngestPayload): ValidationResult {
  const errors: string[] = [];

  if (!payload.source || payload.source.trim() === '') {
    errors.push('source is required and cannot be empty');
  }

  if (!Array.isArray(payload.data)) {
    errors.push('data must be an array');
  } else if (payload.data.length === 0) {
    errors.push('data array cannot be empty');
  } else if (payload.data.length > 10_000) {
    errors.push('data array exceeds maximum batch size of 10,000 records');
  }

  if (payload.metadata) {
    for (const [key, value] of Object.entries(payload.metadata)) {
      if (typeof value !== 'string') {
        errors.push(`metadata.${key} must be a string`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
