import type { StoredImage } from '@openvaa/app-shared';
import type { Image } from '@openvaa/data';

/**
 * Convert a Supabase storage path to a fully-qualified public URL.
 *
 * Returns `undefined` when the input is null/undefined or missing a `path`.
 * The caller provides `supabaseUrl` (from `constants.PUBLIC_SUPABASE_URL`) to keep this utility pure and testable without env mocking.
 *
 * The `StoredImage` shape this consumes is declared beside its schema in `@openvaa/app-shared` (`data/schemas/storedImage.schema.ts`), because the shape is a property of the JSONB column and is therefore shared. This function stays in the adapter, because the `public-assets` bucket URL layout is Supabase Storage's and is not.
 */
export function parseStoredImage(stored: StoredImage | null | undefined, supabaseUrl: string): Image | undefined {
  if (!stored?.path) return undefined;

  function toUrl(p: string): string {
    return `${supabaseUrl}/storage/v1/object/public/public-assets/${p}`;
  }

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
