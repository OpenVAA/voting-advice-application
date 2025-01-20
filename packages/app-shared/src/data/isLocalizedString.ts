import { isImage } from './isImage.js';
import { isPlainObject } from './utils/isPlainObject.js';
import type { LocalizedString } from './extendedData.type';

/**
 * Quick and dirty test to check whether an object may be a localized string.
 */
export function isLocalizedString(value: unknown): value is LocalizedString {
  return (
    isPlainObject(value) &&
    !isImage(value) &&
    Object.entries(value).every(([k, v]) => typeof k === 'string' && typeof v === 'string')
  );
}
