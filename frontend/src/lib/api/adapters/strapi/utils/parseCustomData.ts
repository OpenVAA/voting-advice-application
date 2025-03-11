import { isLocalizedObject } from '@openvaa/app-shared';
import { translateObject } from '$lib/i18n';
import { parseQuestionInfoSections } from './parseQuestionInfoSections';

const LOCALIZED_CUSTOM_PROPERTIES: Array<string> = ['video'] as const;

/**
 * Parse (localized) properties in customData.
 */
export function parseCustomData(data: object | null | undefined, locale: string | null): object | null {
  if (!data) return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (LOCALIZED_CUSTOM_PROPERTIES.includes(key) && isLocalizedObject(value)) {
      out[key] = translateObject(value, locale);
    } else if (key === 'infoSections') {
      out[key] = parseQuestionInfoSections(value, locale);
    } else {
      out[key] = value;
    }
  }
  return out;
}
