import * as m from '$lib/paraglide/messages';
import { logDebugError } from '$lib/utils/logger';
import { getOverride } from './overrides';

type MessageModule = Record<string, (params?: Record<string, unknown>) => string>;

/**
 * Translation wrapper: checks runtime overrides first, then falls back to Paraglide.
 *
 * Usage: t('dynamic.appName') or t('results.candidate.numShown', { numShown: count })
 *
 * @param key - Dot-notation translation key (e.g., 'dynamic.appName')
 * @param params - Optional parameters for interpolation
 * @returns Translated string
 */
export function t(key: string, params?: Record<string, unknown>): string {
  // 1. Check runtime overrides (from backend translationOverrides)
  const override = getOverride(key, params);
  if (override !== undefined) return override;

  // 2. Fall back to Paraglide compiled message
  const messageFn = (m as unknown as MessageModule)[key];
  if (typeof messageFn === 'function') {
    try {
      return messageFn(params);
    } catch (e) {
      logDebugError(e);
      return key;
    }
  }

  // 3. Key not found -- return key as fallback
  return key;
}

/**
 * Non-reactive get() for use outside Svelte component context.
 * Same as t() since Paraglide functions are already non-reactive.
 */
t.get = t;
