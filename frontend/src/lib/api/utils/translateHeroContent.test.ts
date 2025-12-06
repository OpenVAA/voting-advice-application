import { describe, expect, test, vi } from 'vitest';
import { translateHeroContent } from './translateHeroContent';
import type { Emoji, LocalizedHeroContent } from '@openvaa/app-shared';
import type { Image } from '@openvaa/data';

// Mock the i18n module
vi.mock('$lib/i18n', () => ({
  translateObject: vi.fn((obj, locale) => {
    // Simple mock that returns the value for the locale key or first available value
    if (obj && typeof obj === 'object' && locale && locale in obj) {
      return obj[locale as keyof typeof obj];
    }
    return Object.values(obj)[0];
  })
}));

describe('translateHeroContent', () => {
  test('should return emoji content as-is', () => {
    const emoji: Emoji = { emoji: '🎃' };
    expect(translateHeroContent(emoji as unknown as LocalizedHeroContent, 'en')).toEqual({ emoji: '🎃' });
  });

  test('should return image content as-is', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      alt: 'Test image'
    };
    expect(translateHeroContent(image as unknown as LocalizedHeroContent, 'en')).toEqual(image);
  });

  test('should translate localized object for given locale', () => {
    const localizedImage = {
      en: { url: 'https://example.com/en-image.jpg', alt: 'English' },
      fi: { url: 'https://example.com/fi-image.jpg', alt: 'Finnish' }
    };

    const result = translateHeroContent(localizedImage, 'en');
    expect(result).toEqual({
      url: 'https://example.com/en-image.jpg',
      alt: 'English'
    });
  });

  test('should handle null locale', () => {
    const localizedImage = {
      en: { url: 'https://example.com/en-image.jpg', alt: 'English' },
      fi: { url: 'https://example.com/fi-image.jpg', alt: 'Finnish' }
    };

    const result = translateHeroContent(localizedImage, null);
    // Should return first available value when locale is null
    expect(result).toEqual(localizedImage.en);
  });

  test('should return undefined for undefined input', () => {
    expect(translateHeroContent(undefined, 'en')).toBeUndefined();
  });
});
