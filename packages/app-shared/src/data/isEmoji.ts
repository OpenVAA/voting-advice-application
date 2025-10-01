import { isPlainObject } from './utils/isPlainObject.js';
import type { Emoji } from './customData.type.js';

/**
 * Typeguard for `Emoji` objects.
 */
export function isEmoji(value: unknown): value is Emoji {
  return isPlainObject(value) && 'emoji' in value && typeof value.emoji === 'string';
}
