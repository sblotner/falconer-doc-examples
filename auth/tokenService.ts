// auth/tokenService.ts
// Last updated: token refresh refactor (v2.4.0)

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { z } from 'zod';

const ACCESS_TOKEN_TTL_SECONDS = 900;      // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 2592000; // 30 days
const REFRESH_BUFFER_MS = 5 * 60 * 1000;  // 5-minute buffer before expiry
const MAX_REFRESH_ATTEMPTS_PER_HOUR = 10;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const RefreshTokenPayloadSchema = z.object({
  userId: z.string(),
  roles: z.array(z.string()),
  issuedAt: z.number(),
});

type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadSchema>;

/**
 * Issues a new access/refresh token pair for a user.
 * Access tokens expire in 15 minutes; refresh tokens in 30 days.
 * Algorithm upgraded to RS256 in v2.4.0 (previously HS256).
 */
export async function issueTokenPair(userId: string, roles: string[]): Promise<TokenPair> {
  const accessToken = jwt.sign(
    { sub: userId, roles, type: 'access' },
    process.env.JWT_PRIVATE_KEY!,
    { algorithm: 'RS256', expiresIn: ACCESS_TOKEN_TTL_SECONDS }
  );

  const refreshToken = randomUUID();

  const payload: RefreshTokenPayload = { userId, roles, issuedAt: Date.now() };

  await redis.set(
    `refresh:${refreshToken}`,
    JSON.stringify(payload),
    { EX: REFRESH_TOKEN_TTL_SECONDS }
  );

  logger.info({ userId }, 'Token pair issued');

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

/**
 * Rotates a refresh token. The old token is immediately invalidated
 * (rotation enforced — reuse of a consumed token triggers account lockout).
 */
export async function rotateRefreshToken(refreshToken: string, userId: string): Promise<TokenPair> {
  // Rate limit refresh attempts per user
  const rateLimitKey = `refresh_attempts:${userId}`;
  const attempts = await redis.incr(rateLimitKey);
  if (attempts === 1) {
    await redis.expire(rateLimitKey, 3600); // 1-hour sliding window
  }
  if (attempts > MAX_REFRESH_ATTEMPTS_PER_HOUR) {
    logger.warn({ userId }, 'Refresh token rate limit exceeded');
    throw new TokenRateLimitError('Too many token refresh attempts');
  }

  const raw = await redis.get(`refresh:${refreshToken}`);

  if (!raw) {
    // Token not found — may indicate reuse attack
    logger.warn({ refreshToken }, 'Refresh token reuse detected or token expired');
    throw new TokenReuseError('Refresh token invalid or already consumed');
  }

  const parseResult = RefreshTokenPayloadSchema.safeParse(JSON.parse(raw));
  if (!parseResult.success) {
    logger.error({ refreshToken }, 'Refresh token payload failed validation');
    throw new TokenReuseError('Refresh token payload is malformed');
  }

  const { userId: storedUserId, roles } = parseResult.data;

  // Invalidate old token immediately (rotation)
  await redis.del(`refresh:${refreshToken}`);

  return issueTokenPair(storedUserId, roles);
}

/**
 * Validates an access token. Returns decoded payload or throws.
 * Uses RS256 public key for verification.
 */
export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, { algorithms: ['RS256'] });
}

export class TokenReuseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenReuseError';
  }
}

export class TokenRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenRateLimitError';
  }
}
