/**
 * Helper functions for rate limiting in API routes
 */

/**
 * Create a rate limit error response
 *
 * @param message - Error message to display
 * @param retryAfter - Seconds until retry is allowed
 * @returns Response with 429 status and retry headers
 */
export function createRateLimitResponse(message: string, retryAfter: number = 60): Response {
  return new Response(
    JSON.stringify({
      error: message,
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  );
}
