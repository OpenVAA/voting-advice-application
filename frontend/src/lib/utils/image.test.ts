import { describe, expect, test } from 'vitest';
import { getImageUrl } from './image';
import type { Image } from '@openvaa/data';

describe('getImageUrl', () => {
  test('should return default url when no format is specified', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      alt: 'Test image'
    };
    expect(getImageUrl({ image })).toBe('https://example.com/image.jpg');
  });

  test('should return format url when available', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      formats: {
        thumbnail: { url: 'https://example.com/thumb.jpg' },
        small: { url: 'https://example.com/small.jpg' }
      }
    };
    expect(getImageUrl({ image, format: 'thumbnail' })).toBe('https://example.com/thumb.jpg');
    expect(getImageUrl({ image, format: 'small' })).toBe('https://example.com/small.jpg');
  });

  test('should fallback to default url when requested format is unavailable', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      formats: {
        thumbnail: { url: 'https://example.com/thumb.jpg' }
      }
    };
    expect(getImageUrl({ image, format: 'large' })).toBe('https://example.com/image.jpg');
  });

  test('should fallback to default url when formats is null', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      formats: null
    };
    expect(getImageUrl({ image, format: 'thumbnail' })).toBe('https://example.com/image.jpg');
  });

  test('should return dark variant from default when requested', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      urlDark: 'https://example.com/image-dark.jpg'
    };
    expect(getImageUrl({ image, dark: true })).toBe('https://example.com/image-dark.jpg');
  });

  test('should return dark variant from format when available', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      urlDark: 'https://example.com/image-dark.jpg',
      formats: {
        thumbnail: {
          url: 'https://example.com/thumb.jpg',
          urlDark: 'https://example.com/thumb-dark.jpg'
        }
      }
    };
    expect(getImageUrl({ image, format: 'thumbnail', dark: true })).toBe('https://example.com/thumb-dark.jpg');
  });

  test('should fallback to default dark variant when format dark variant is unavailable', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      urlDark: 'https://example.com/image-dark.jpg',
      formats: {
        thumbnail: {
          url: 'https://example.com/thumb.jpg'
        }
      }
    };
    expect(getImageUrl({ image, format: 'thumbnail', dark: true })).toBe('https://example.com/image-dark.jpg');
  });

  test('should fallback to normal url when dark variant is unavailable', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg'
    };
    expect(getImageUrl({ image, dark: true })).toBe('https://example.com/image.jpg');
  });

  test('should return format url when dark is requested but unavailable in both format and default', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      formats: {
        thumbnail: {
          url: 'https://example.com/thumb.jpg'
        }
      }
    };
    expect(getImageUrl({ image, format: 'thumbnail', dark: true })).toBe('https://example.com/thumb.jpg');
  });

  test('should handle null urlDark gracefully', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      urlDark: null
    };
    expect(getImageUrl({ image, dark: true })).toBe('https://example.com/image.jpg');
  });

  test('should handle undefined dark parameter', () => {
    const image: Image = {
      url: 'https://example.com/image.jpg',
      urlDark: 'https://example.com/image-dark.jpg'
    };
    expect(getImageUrl({ image, dark: undefined })).toBe('https://example.com/image.jpg');
  });
});
