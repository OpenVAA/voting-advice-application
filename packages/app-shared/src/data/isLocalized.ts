import { isImage } from './isImage.js';
import { isPlainObject } from './utils/isPlainObject.js';
import type { LocalizedObject, LocalizedString } from './localized.type.js';

/**
 * Quick and dirty test to check whether an object may be a localized string.
 */
export function isLocalizedString(value: unknown): value is LocalizedString {
  return isLocalizedObject(value) && Object.values(value).every((v) => v == null || typeof v === 'string');
}

/**
 * Quick and dirty test to check whether an object may be a localized object.
 */
export function isLocalizedObject(value: unknown): value is LocalizedObject {
  return isPlainObject(value) && !isImage(value);
}
