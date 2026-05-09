import { describe, expect,it } from 'vitest';
import { parseStoredImage } from '../utils/storageUrl';
import type { StoredImage } from '../utils/storageUrl';

describe('parseStoredImage', () => {
  const supabaseUrl = 'http://localhost:54321';

  it('converts path to full URL', () => {
    const result = parseStoredImage({ path: 'proj/candidate/id/photo.jpg' }, supabaseUrl);
    expect(result).toEqual({
      url: 'http://localhost:54321/storage/v1/object/public/public-assets/proj/candidate/id/photo.jpg'
    });
  });

  it('converts pathDark to urlDark', () => {
    const result = parseStoredImage({ path: 'img.jpg', pathDark: 'img-dark.jpg' }, supabaseUrl);
    expect(result).toEqual({
      url: 'http://localhost:54321/storage/v1/object/public/public-assets/img.jpg',
      urlDark: 'http://localhost:54321/storage/v1/object/public/public-assets/img-dark.jpg'
    });
  });

  it('includes alt text', () => {
    const result = parseStoredImage({ path: 'img.jpg', alt: 'Photo' }, supabaseUrl);
    expect(result).toEqual({
      url: 'http://localhost:54321/storage/v1/object/public/public-assets/img.jpg',
      alt: 'Photo'
    });
  });

  it('returns undefined for null input', () => {
    const result = parseStoredImage(null, supabaseUrl);
    expect(result).toBeUndefined();
  });

  it('returns undefined for missing path', () => {
    // reason: fixture intentionally omits required `path` to exercise the missing-path guard
    const result = parseStoredImage({} as Partial<StoredImage> as StoredImage, supabaseUrl);
    expect(result).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    const result = parseStoredImage(undefined, supabaseUrl);
    expect(result).toBeUndefined();
  });

  it('includes both pathDark and alt when provided', () => {
    const result = parseStoredImage(
      { path: 'img.jpg', pathDark: 'img-dark.jpg', alt: 'A photo' },
      supabaseUrl
    );
    expect(result).toEqual({
      url: 'http://localhost:54321/storage/v1/object/public/public-assets/img.jpg',
      urlDark: 'http://localhost:54321/storage/v1/object/public/public-assets/img-dark.jpg',
      alt: 'A photo'
    });
  });
});
