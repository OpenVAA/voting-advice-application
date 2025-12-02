import { isPlainObject } from './utils/isPlainObject.js';
import type { Emoji } from './customData.type.js';

/**
 * Typeguard for `Emoji` objects.
 * Note: Does not currently validate that the string is actually an emoji character, because the `/\P{Extended_Pictographic}/u` filtering breaks on Safari.
 * See: https://developer.apple.com/forums/thread/729609
 */
export function isEmoji(value: unknown): value is Emoji {
  return isPlainObject(value) && 'emoji' in value && typeof value.emoji === 'string';
}
