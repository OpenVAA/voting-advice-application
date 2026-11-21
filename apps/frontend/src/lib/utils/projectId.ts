/**
 * The one rule for a configured project id, shared by the Supabase adapter and the server's start-up check.
 */

import { isCanonicalUuid } from './uuid';

/**
 * What is wrong with a raw project id, if anything. It reads nothing but its argument and never throws, so the server's start-up check and the Supabase adapter's `resolveProjectId` apply the same rule.
 * @param raw - The raw value. A non-string is checked for too, because the process environment can hand one over despite the type.
 * @returns `'missing'` for an absent value, a non-string or a value that is empty once trimmed, `'invalid'` for one that is not a canonical uuid once trimmed and lower-cased, else `undefined`.
 */
export function projectIdProblem(raw: string | undefined): 'missing' | 'invalid' | undefined {
  const normalised = typeof raw === 'string' ? normaliseProjectId(raw) : '';
  if (normalised === '') return 'missing';
  // Tested after trimming and lower-casing, so a padded or upper-case configuration value normalises rather than fails.
  return isCanonicalUuid(normalised) ? undefined : 'invalid';
}

/**
 * The normalised form of a project id, the form it is compared in.
 * @param raw - The raw value.
 * @returns The value trimmed and lower-cased.
 */
export function normaliseProjectId(raw: string): string {
  return raw.trim().toLowerCase();
}
