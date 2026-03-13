import { Request, Response, NextFunction } from 'express';

const API_KEY_HEADER = 'x-api-key';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers[API_KEY_HEADER];

  if (!apiKey || typeof apiKey !== 'string') {
    res.status(401).json({ error: 'Missing API key' });
    return;
  }

  const isValid = await validateApiKey(apiKey);
  if (!isValid) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
}

async function validateApiKey(key: string): Promise<boolean> {
  // Look up key in the database and check expiry
  const validKeys = process.env.VALID_API_KEYS?.split(',') ?? [];
  return validKeys.includes(key);
}
