import type { Image } from '@openvaa/data';

/**
 * Shape of the image JSONB stored in Supabase content tables.
 * Required: `path`. Optional: `pathDark`, `alt`, dimensions, focal point.
 *
 * @see database skill — StoredImage structure in schema conventions.
 */
export interface StoredImage {
  path: string;
  pathDark?: string;
  alt?: string;
  width?: number;
  height?: number;
  focalPoint?: { x: number; y: number };
}

/**
 * Convert a Supabase storage path to a fully-qualified public URL.
 *
 * Returns `undefined` when the input is null/undefined or missing a `path`.
 * The caller provides `supabaseUrl` (from `constants.PUBLIC_SUPABASE_URL`)
 * to keep this utility pure and testable without env mocking.
 */
export function parseStoredImage(
  stored: StoredImage | null | undefined,
  supabaseUrl: string
): Image | undefined {
  if (!stored?.path) return undefined;

  const toUrl = (p: string) => `${supabaseUrl}/storage/v1/object/public/public-assets/${p}`;

  const image: Image = {
    url: toUrl(stored.path)
  };

  if (stored.pathDark) {
    image.urlDark = toUrl(stored.pathDark);
  }

  if (stored.alt) {
    image.alt = stored.alt;
  }

  return image;
}
