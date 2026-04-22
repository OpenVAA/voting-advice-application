/**
 * Template schema — zod v4 declarative shape for the `@openvaa/dev-seed` input template.
 *
 * Phase 56 covers the MINIMAL core per D-18: top-level `seed` / `externalIdPrefix` /
 * `projectId`, plus per-entity fragments for each of the 12 non-system public
 * tables ({@link https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/migrations}).
 *
 * Phase 57 extends this schema with the latent-factor emitter fields (via `.extend()`,
 * NOT `.merge()` — deprecated in zod v4). Phase 58 adds localization / portrait /
 * default-dataset fields the same way.
 *
 * Design contract:
 *  - Every field is `.optional()` per D-18 — a `{}` template MUST pass validation
 *    (TMPL-02).
 *  - Defaults (count, prefix, UUIDs) live in per-generator `defaults(ctx)` methods
 *    per D-08 — NOT in the schema. Keeping the schema declarative means extending
 *    generators later doesn't require schema churn.
 *  - Hand-authored `fixed[]` rows are partial records (`z.record(z.string(), z.unknown())`).
 *    NF-03 forbids `unknown`-style escape hatches that accept arbitrary `any`; we use
 *    `z.unknown()` which forces consumers to narrow before use.
 */

import { z } from 'zod';

/**
 * Per-entity fragment. Used for all 12 non-system public tables.
 *
 * `count` — target number of synthetic rows the generator emits.
 * `fixed` — explicit hand-authored partial rows (merged with synthetic ones).
 *
 * NOTE: `.optional()` is applied at each use site below — not baked into the
 * fragment definition — so every template field stays visibly optional at the
 * schema level (D-18 enforcement).
 */
const perEntityFragment = z.object({
  count: z.number().int().nonnegative().optional(),
  fixed: z.array(z.record(z.string(), z.unknown())).optional()
});

export const TemplateSchema = z.object({
  seed: z.number().int().optional(),
  externalIdPrefix: z.string().optional(),
  projectId: z.string().uuid().optional(),
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
});

/**
 * Validate a template input; return the typed Template on success, throw on failure.
 *
 * TMPL-09: errors include the field path via `result.error.issues[].path`. Output:
 *
 * ```
 * Template validation failed:
 *   template.candidates.count: Expected number, received string
 *   template.seed: Expected integer, received number
 * ```
 */
export function validateTemplate(input: unknown): z.infer<typeof TemplateSchema> {
  const result = TemplateSchema.safeParse(input);
  if (result.success) return result.data;
  const msg = result.error.issues.map((iss) => `  template.${iss.path.join('.')}: ${iss.message}`).join('\n');
  throw new Error(`Template validation failed:\n${msg}`);
}
