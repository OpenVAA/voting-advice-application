import { describe, expect, test } from 'vitest';
import { getImageUrl } from './image';
import type { Image } from '@openvaa/data';

describe('getImageUrl', () => {
  test('should return default url when no format is specified', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      alt: 'Test image'
    };
    expect(getImageUrl({ image })).toBe('https://openvaa.org/image.jpg');
  });

  test('should return format url when available', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      formats: {
        thumbnail: { url: 'https://openvaa.org/thumb.jpg' },
        small: { url: 'https://openvaa.org/small.jpg' }
      }
    };
    expect(getImageUrl({ image, format: 'thumbnail' })).toBe('https://openvaa.org/thumb.jpg');
    expect(getImageUrl({ image, format: 'small' })).toBe('https://openvaa.org/small.jpg');
  });

  test('should fallback to default url when requested format is unavailable', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      formats: {
        thumbnail: { url: 'https://openvaa.org/thumb.jpg' }
      }
    };
    expect(getImageUrl({ image, format: 'large' })).toBe('https://openvaa.org/image.jpg');
  });

  test('should fallback to default url when formats is null', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      formats: null
    };
    expect(getImageUrl({ image, format: 'thumbnail' })).toBe('https://openvaa.org/image.jpg');
  });

  test('should return dark variant from default when requested', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      urlDark: 'https://openvaa.org/image-dark.jpg'
    };
    expect(getImageUrl({ image, dark: true })).toBe('https://openvaa.org/image-dark.jpg');
  });

  test('should return dark variant from format when available', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      urlDark: 'https://openvaa.org/image-dark.jpg',
      formats: {
        thumbnail: {
          url: 'https://openvaa.org/thumb.jpg',
          urlDark: 'https://openvaa.org/thumb-dark.jpg'
        }
      }
    };
    expect(getImageUrl({ image, format: 'thumbnail', dark: true })).toBe('https://openvaa.org/thumb-dark.jpg');
  });

  test('should fallback to default dark variant when format dark variant is unavailable', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      urlDark: 'https://openvaa.org/image-dark.jpg',
      formats: {
        thumbnail: {
          url: 'https://openvaa.org/thumb.jpg'
        }
      }
    };
    expect(getImageUrl({ image, format: 'thumbnail', dark: true })).toBe('https://openvaa.org/image-dark.jpg');
  });

  test('should fallback to normal url when dark variant is unavailable', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg'
    };
    expect(getImageUrl({ image, dark: true })).toBe('https://openvaa.org/image.jpg');
  });

  test('should return format url when dark is requested but unavailable in both format and default', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      formats: {
        thumbnail: {
          url: 'https://openvaa.org/thumb.jpg'
        }
      }
    };
    expect(getImageUrl({ image, format: 'thumbnail', dark: true })).toBe('https://openvaa.org/thumb.jpg');
  });

  test('should handle null urlDark gracefully', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      urlDark: null
    };
    expect(getImageUrl({ image, dark: true })).toBe('https://openvaa.org/image.jpg');
  });

  test('should handle undefined dark parameter', () => {
    const image: Image = {
      url: 'https://openvaa.org/image.jpg',
      urlDark: 'https://openvaa.org/image-dark.jpg'
    };
    expect(getImageUrl({ image, dark: undefined })).toBe('https://openvaa.org/image.jpg');
  });
});
