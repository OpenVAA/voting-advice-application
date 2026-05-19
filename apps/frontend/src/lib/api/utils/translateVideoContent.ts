import { translateObject } from '$lib/i18n';
import type { LocalizedVideoContent, VideoContent } from '@openvaa/app-shared';

export function translateVideoContent(
  data: LocalizedVideoContent | null,
  locale: string | null
): VideoContent | undefined {
  if (data && typeof data === 'object') {
    return translateObject(data, locale) ?? undefined;
  }
  return undefined;
}
