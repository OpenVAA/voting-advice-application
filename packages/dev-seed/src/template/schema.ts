/**
 * Template schema — zod v4 declarative shape for the `@openvaa/dev-seed` input template.
 *
 * The core covers top-level `seed` / `externalIdPrefix` / `projectId`, plus per-entity fragments for each of the 12 non-system public tables ({@link https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/migrations}).
 *
 * Extensions — the latent-factor emitter fields, and the localization / portrait / default-dataset fields — attach via `.extend()`, NOT `.merge()`, which is deprecated in zod v4.
 *
 * Design contract:
 *  - Every field is `.optional()` — a `{}` template MUST pass validation.
 *  - Defaults (count, prefix, UUIDs) live in per-generator `defaults(ctx)` methods, NOT in the schema. Keeping the schema declarative means extending generators later doesn't require schema churn.
 *  - Hand-authored `fixed[]` rows are partial records (`z.record(z.string(), z.unknown())`).
 *    `unknown`-style escape hatches that accept arbitrary `any` are forbidden; `z.unknown()` forces consumers to narrow before use.
 */

import { z } from 'zod';
import type { Template } from './types';

/**
 * Per-entity fragment. Used for all 12 non-system public tables.
 *
 * `count` — target number of synthetic rows the generator emits.
 * `fixed` — explicit hand-authored partial rows (merged with synthetic ones).
 *
 * NOTE: `.optional()` is applied at each use site below — not baked into the fragment definition — so every template field stays visibly optional at the schema level (enforcement).
 *
 * ## `.strict()` here is NOT redundant with `TemplateSchema.strict()`
 *
 * `.strict()` is a PER-OBJECT setting; it does not descend. Measured at this tree's zod (4.3.6): a top-level-only strict schema parses `{ candidates: { fixed: [...], bogus: 3 } }` with **success** and silently strips `bogus`. Both objects therefore carry `.strict()`, and `tests/template.test.ts` holds each direction with its own case.
 */
const perEntityFragment = z
  .object({
    count: z.number().int().nonnegative().optional(),
    /**
     * ⚠ **Deliberately a LOOSE record — do not "complete" this tightening.**
     *
     * Row-level unknown keys are the runtime guard's authority: `assertKnownRowProps` in `./permittedKeys`. Its allow-list is per-collection and DERIVED — DB columns, their camel forms, `LINK_SENTINELS`, the non-column consts and the RPC relationship refs. Restating that allow-list here would create a second row-level authority that can drift from `LINK_SENTINELS`, which is exactly the parallel-list shape this package forbids. One row-level authority, and it is not this one.
     */
    fixed: z.array(z.record(z.string(), z.unknown())).optional()
  })
  .strict();

/**
 * latent-factor emitter configuration.
 *
 * Top-level optional, every nested field optional. `.strict()` rejects typos (e.g. `latent.loading` vs `latent.loadings`) so error messages point at the offending field instead of silently dropping it. `.superRefine()` enforces the invariant that `eigenvalues.length === dimensions` when both are provided — prevents downstream sub-steps from reading past the array bounds or operating on a degenerate space.
 *
 * Keyed `centroids` / `loadings` use `z.record(z.string(), ...)` because the keys are organization / question `external_id`s; zod v4 requires the key type argument.
 */
const latentBlock = z
  .object({
    dimensions: z.number().int().positive().optional(),
    eigenvalues: z.array(z.number().nonnegative()).optional(),
    // per-organization centroid anchors keyed by organization external_id.
    centroids: z.record(z.string(), z.array(z.number())).optional(),
    spread: z.number().nonnegative().optional(),
    // per-question loading vectors keyed by question external_id.
    loadings: z.record(z.string(), z.array(z.number())).optional(),
    noise: z.number().nonnegative().optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    // eigenvalues length must match dimensions when both are provided.
    if (
      data.eigenvalues !== undefined &&
      data.dimensions !== undefined &&
      data.eigenvalues.length !== data.dimensions
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['eigenvalues'],
        message: `Expected length ${data.dimensions}, got ${data.eigenvalues.length}`
      });
    }
  });

/**
 * Accept any UUID-shaped string (8-4-4-4-12 hex groups).
 *
 * We deliberately do NOT use `z.string().uuid()` — zod v4's `.uuid()` enforces RFC 4122 version compliance (v1-v8 only, plus the nil/max sentinels). The `TEST_PROJECT_ID` fixture used throughout the codebase (`00000000-0000-0000-0000-000000000001`, from seed.sql bootstrap) carries a `0` version nibble and is rejected by the strict validator. Postgres' `uuid` column type accepts it fine — the value is a legitimate UUID-shaped identifier the database stores without complaint. Rejecting it in the template schema would mean the validator contradicts `buildCtx`'s documented default projectId.
 *
 * The regex below is the 8-4-4-4-12 hex shape from RFC 9562 without the version nibble constraint — matches what Postgres actually accepts.
 */
const UUID_SHAPE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const TemplateSchema = z
  .object({
    seed: z.number().int().optional(),
    /**
     * ISO datetime every generated date is drawn relative to; defaults to `SEED_REF_DATE` in `buildCtx`.
     *
     * Validated here rather than only in {@link Template}, because the schema closes `.strict()` and every loader branch — built-in included — runs through it: a type-only field would be rejected as an unknown key at seed time.
     */
    refDate: z.iso.datetime().optional(),
    externalIdPrefix: z.string().optional(),
    projectId: z.string().regex(UUID_SHAPE, 'Invalid UUID').optional(),
    /**
     * when `true`, the pipeline post-processes every localized JSONB field (`name`, `short_name`, `info`, question `choices[].label`, etc.) to contain keys for every locale in `staticSettings.supportedLocales` (`en`, `fi`, `sv`, `da`). When `false` or `undefined`, only the default locale (`en`) is populated.
     *
     * The default template sets this to `true` so first-run developers see the app in all four locales. The e2e template sets it to `false` per — Playwright specs run against a single locale and the 4x JSONB payload is pure overhead for them.
     */
    generateTranslationsForAllLocales: z.boolean().optional(),
    elections: perEntityFragment.optional(),
    constituency_groups: perEntityFragment.optional(),
    constituencies: perEntityFragment.optional(),
    organizations: perEntityFragment.optional(),
    alliances: perEntityFragment.optional(),
    factions: perEntityFragment.optional(),
    candidates: perEntityFragment.optional(),
    question_categories: perEntityFragment.optional(),
    questions: perEntityFragment.optional(),
    nominations: perEntityFragment.optional(),
    app_settings: perEntityFragment.optional(),
    feedback: perEntityFragment.optional()
  })
  /**
   * ORDERING CHOICE: `.strict()` goes AFTER the `.extend()` chain link, so the strict setting is applied to the object that actually ships — the extended one — and no reader has to reason about whether `.extend()` preserved it.
   *
   * Both orderings were measured at zod 4.3.6 and behave identically: strict before extend and extend before strict BOTH reject an unknown top-level key, and BOTH still accept the extended `latent` field. There is no hazard here; the order is stated only so the choice is legible rather than accidental.
   */
  .extend({ latent: latentBlock.optional() })
  .strict();

/**
 * Check the one property {@link Template} requires of a `fixed[]` row that this schema deliberately does not: a non-empty string `external_id`.
 *
 * ## Why this exists
 *
 * `TemplateSchema` is the RUNTIME authority and `Template` is the AUTHORING authority; the schema keeps rows at `z.record(z.string(), z.unknown())` on purpose, because row-level authority belongs to the runtime unknown-key guard rather than to zod. The single STRUCTURAL difference between the parsed shape and `Template` is therefore `external_id: string` — which `Fragment<TRow>` requires because the writer's upsert is keyed on it, and which `_bulk_upsert_record` raises on (`external_id is required for bulk import`).
 *
 * Checking it here EARNS the narrowing below instead of asserting it, so the package needs no cast at this seam, and a filesystem template that omits an id fails with a field path at validation time rather than with an opaque RPC error three passes later.
 *
 * ⚠ **What it does not prove.** Per-column VALUE conformance (a `sort_order` that is a string, say) is still unproven at this seam, and unknown keys are not this function's business. Both belong to the runtime guard. Stated so the narrowing is not read as more than it is.
 *
 * Slots are discovered from the parsed value — every top-level object with a `fixed` array — rather than from a hand-kept list, so a new collection is covered the day it is added to the schema.
 */
function assertFixedRowsCarryExternalId(parsed: z.infer<typeof TemplateSchema>): asserts parsed is Template {
  const problems: Array<string> = [];
  for (const [slot, value] of Object.entries(parsed)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) continue;
    const { fixed } = value as { fixed?: unknown };
    if (!Array.isArray(fixed)) continue;
    fixed.forEach((row: unknown, index: number) => {
      const externalId = (row as Record<string, unknown> | null)?.external_id;
      if (typeof externalId !== 'string' || externalId === '') {
        problems.push(`  template.${slot}.fixed[${index}].external_id: Expected a non-empty string`);
      }
    });
  }
  if (problems.length > 0) throw new Error(`Template validation failed:\n${problems.join('\n')}`);
}

/**
 * Validate a template input; return the typed Template on success, throw on failure.
 *
 * errors include the field path via `result.error.issues.path`. Output:
 *
 * ```
 * Template validation failed:
 *   template.candidates.count: Expected number, received string
 *   template.seed: Expected integer, received number
 * ```
 */
export function validateTemplate(input: unknown): Template {
  const result = TemplateSchema.safeParse(input);
  if (!result.success) {
    const msg = result.error.issues.map((iss) => `  template.${iss.path.join('.')}: ${iss.message}`).join('\n');
    throw new Error(`Template validation failed:\n${msg}`);
  }
  assertFixedRowsCarryExternalId(result.data);
  return result.data;
}
