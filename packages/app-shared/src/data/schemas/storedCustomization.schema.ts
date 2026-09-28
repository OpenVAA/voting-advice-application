import { z } from 'zod';
import { StoredImageSchema } from './storedImage.schema';

/**
 * A localised string as it is stored: an object keyed by locale. Mirrors `LocalizedString` in `../localized.type`.
 */
const LocalizedStringSchema = z.record(z.string(), z.string());

/**
 * The stored shape of the `app_settings.customization` JSONB column.
 *
 * ## Stored, not application
 *
 * The APPLICATION type is `AppCustomization`, declared in the FRONTEND at `apps/frontend/src/lib/contexts/app/appCustomization.type.ts`, and it deliberately stays there: it depends on the generated frontend translation-key union, and moving it would drag the i18n catalog into this shared package. The prohibition grep that guards this is a literal search for that union's name, so the name is described here rather than spelled. `AppCustomization` is the OUTPUT of the derive step in `SupabaseDataProvider._getAppCustomization`, not the output of the parse step this schema performs.
 *
 * Four measured divergences between the two:
 *
 * 1. `publisherName` is a LOCALE OBJECT in storage and a `string` in the type.
 * 2. `publisherLogo`, `poster` and `candPoster` are {@link StoredImageSchema}-shaped — a storage **path** — in storage, and `Image` — a resolved **URL** — in the type.
 * 3. `translationOverrides` values are locale objects in storage and plain strings in the type.
 * 4. `candidateAppFAQ[].question` and `.answer` are locale objects in storage and strings in the type.
 *
 * Every field is optional: the column is `DEFAULT '{}'::jsonb` (`apps/supabase/supabase/schema/106-app-settings.sql:19`) and the provider returns `{}` on `PGRST116`, so `{}` MUST parse.
 *
 * ## Strict at every level
 *
 * Strictness is per-object and does not descend, including into array elements. The FAQ entry object and the image object therefore carry their own strict setting, and `storedCustomization.schema.test.ts` holds a rejection case for each.
 */
export const StoredCustomizationSchema = z.strictObject({
  /** The name of the VAA publisher, stored as a locale object. */
  publisherName: LocalizedStringSchema.optional(),
  /** The publisher logo, stored as a storage path. */
  publisherLogo: StoredImageSchema.nullable().optional(),
  /** The Voter App frontpage poster, stored as a storage path. */
  poster: StoredImageSchema.nullable().optional(),
  /** The Candidate App frontpage poster, stored as a storage path. */
  candPoster: StoredImageSchema.nullable().optional(),
  /** Translation overrides keyed by translation key, each value a locale object. */
  translationOverrides: z.record(z.string(), LocalizedStringSchema).optional(),
  /** Candidate App FAQ entries, each field a locale object. */
  candidateAppFAQ: z
    .array(
      z.strictObject({
        question: LocalizedStringSchema,
        answer: LocalizedStringSchema
      })
    )
    .optional()
});

/**
 * The stored shape of the `app_settings.customization` JSONB column. NOT a substitute for the frontend's `AppCustomization`, which is the derived application-side shape.
 */
export type StoredCustomization = z.infer<typeof StoredCustomizationSchema>;
