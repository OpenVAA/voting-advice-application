import { isPlainObject } from './utils/isPlainObject.js';
import type { Image } from '@openvaa/data';

/**
 * A quick and dirty test to check whether an object may be an image.
 */
export function isImage(value: unknown): value is Image {
  return isPlainObject(value) && 'url' in value && typeof value.url === 'string';
}
