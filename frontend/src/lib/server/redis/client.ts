import Redis from 'ioredis';
import { constants } from '../constants';

let redisClient: Redis | null = null;

/**
 * Get Redis client. Fails if connection cannot be established.
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = constants.REDIS_URL;

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false, // Try to connect immediately, fail on error
      tls: constants.REDIS_TLS_ENABLED ? {} : undefined,
      retryStrategy(times) {
        if (times > 3) {
           // Stop retrying
          console.error('[Redis] Max retries exhausted');
          return null;
        }
        return Math.min(times * 50, 2000);
      }
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redisClient.on('ready', () => {
      console.info('[Redis] Connected to', redisUrl);
    });
  }

  return redisClient;
}

/**
 * Close Redis connection. Call on server shutdown.
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.info('[Redis] Connection closed');
  }
}
