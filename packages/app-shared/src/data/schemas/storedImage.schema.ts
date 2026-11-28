import { z } from 'zod';

/**
 * The shape of the image JSONB stored in the Supabase content tables.
 *
 * ## Stored, not application
 *
 * This describes what the DATABASE holds — a storage `path` relative to the `public-assets` bucket. The APPLICATION type is `Image` from `@openvaa/data`, which carries a fully-qualified `url` instead. `parseStoredImage` in the Supabase adapter is the derive step between them, and it stays in the adapter because the URL layout is Supabase Storage's, not this package's.
 *
 * ## `z.strictObject` at BOTH levels is not redundant
 *
 * Strictness is a PER-OBJECT setting and does not descend. A top-level-only strict schema parses `{ path: 'a/b.png', focalPoint: { x: 1, y: 2, bogus: 3 } }` with **success** and silently strips `bogus`. `focalPoint` therefore carries its own strict setting, and `storedImage.schema.test.ts` holds one rejection case per level.
 *
 * Every `image` column in the schema is nullable, so call sites that read one use `StoredImageSchema.nullable()`. The schema itself is non-nullable so it can be reused as a member of `StoredCustomizationSchema`.
 */
export const StoredImageSchema = z.strictObject({
  /** The storage path of the default image, relative to the `public-assets` bucket. */
  path: z.string(),
  /** The storage path of the dark-mode variant. */
  pathDark: z.string().optional(),
  /** The alt text. */
  alt: z.string().optional(),
  /** The intrinsic width in pixels. */
  width: z.number().optional(),
  /** The intrinsic height in pixels. */
  height: z.number().optional(),
  /** The focal point used when the image is cropped. */
  focalPoint: z.strictObject({ x: z.number(), y: z.number() }).optional()
});

/**
 * The stored shape of an image JSONB value.
 */
export type StoredImage = z.infer<typeof StoredImageSchema>;
