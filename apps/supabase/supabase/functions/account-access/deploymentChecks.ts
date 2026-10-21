/**
 * The two questions asked of a deployment before any sign-in link is issued, and for how long a yes may be believed.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * A link proves control of an address only on a deployment whose auth service creates no account for an unproven one. The database cannot see how the auth service is configured, so the function asks the served settings and issues nothing when the answer is not a clear yes.
 */

/** How long a positive answer to "is public sign-up closed" is believed. A deployment reopened later stops being served links within this time. */
export const SIGN_UP_CHECK_TTL_MS = 60000;

/** How long a positive answer to "does the auth service admit this callback URL" is believed. */
export const REDIRECT_CHECK_TTL_MS = 600000;

/**
 * Whether the served auth settings say that an address is confirmed only by a mail round trip.
 *
 * @param settings - The decoded body of the auth service's settings endpoint, of any shape
 * @returns True only when `settings` is an object whose `disable_signup` is the boolean `true` and whose `mailer_autoconfirm` is the boolean `false`; false for a missing key, a string, null and a non-object
 */
export function isSignUpClosed(settings: unknown): boolean {
  if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) return false;
  const { disable_signup: disableSignup, mailer_autoconfirm: mailerAutoconfirm } = settings as Record<string, unknown>;
  return disableSignup === true && mailerAutoconfirm === false;
}

/** A memory of positive answers, each believed for a bounded time. */
export interface ExpiringPositive {
  /** Whether a positive answer for the key was remembered less than the lifetime ago. */
  isFresh(key: string): boolean;
  /** Remember, as of now, a positive answer for the key. */
  remember(key: string): void;
}

/**
 * Create a memory of positive answers.
 *
 * It holds, per key, the time a positive answer was remembered. It has no way to remember a negative answer, so a refusal is asked again on the next request, and an entry past its lifetime is dropped when the next answer is remembered.
 *
 * @param ttlMs - The lifetime of a remembered answer, in milliseconds
 * @param now - The clock, in milliseconds
 * @returns The memory
 */
export function createExpiringPositive(ttlMs: number, now: () => number): ExpiringPositive {
  const rememberedAt = new Map<string, number>();
  const isWithinLifetime = (at: number, current: number) => current >= at && current - at < ttlMs;

  return {
    isFresh(key) {
      const at = rememberedAt.get(key);
      return at !== undefined && isWithinLifetime(at, now());
    },
    remember(key) {
      const current = now();
      for (const [other, at] of rememberedAt) {
        if (!isWithinLifetime(at, current)) rememberedAt.delete(other);
      }
      rememberedAt.set(key, current);
    }
  };
}
