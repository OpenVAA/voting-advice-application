import { type HeroContent, isEmoji, isImage, isLocalizedObject, type LocalizedHeroContent } from '@openvaa/app-shared';
import { translateObject } from '$lib/i18n';

/**
 * Translate possibly localized hero content object into a `HeroContent` object.
 */
export function translateHeroContent(
  hero: LocalizedHeroContent | undefined,
  locale: string | null
): HeroContent | undefined {
  if (isEmoji(hero) || isImage(hero)) return hero;
  if (isLocalizedObject(hero)) return translateObject(hero, locale);
  return undefined;
}
