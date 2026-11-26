import type Redis from 'ioredis';

/**
 * Fixed window rate limiter using Redis
 * Limits requests per IP address
 *
 * Note: Uses fixed windows, not sliding windows. Allows bursts at window boundaries.
 */
export class RateLimiter {
  private readonly keyPrefix = 'ratelimit:';
  private readonly maxRequests: number;
  private readonly windowSeconds: number;

  constructor(
    private redis: Redis,
    maxRequests = 20, // 20 requests
    windowSeconds = 60 // per 60 seconds
  ) {
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
  }

  private getKey(identifier: string): string {
    return `${this.keyPrefix}${identifier}`;
  }

  /**
   * Check if request is allowed
   * @param identifier - Usually IP address
   * @returns true if allowed, false if rate limited
   */
  async checkLimit(identifier: string): Promise<boolean> {
    const key = this.getKey(identifier);

    const current = await this.redis.incr(key);

    if (current === 1) {
      // First request in window - set expiration
      await this.redis.expire(key, this.windowSeconds);
    }

    return current <= this.maxRequests;
  }

  /**
   * Get remaining requests for identifier
   */
  async getRemaining(identifier: string): Promise<number> {
    const key = this.getKey(identifier);
    const current = await this.redis.get(key);
    const used = current ? parseInt(current, 10) : 0;
    return Math.max(0, this.maxRequests - used);
  }
}
