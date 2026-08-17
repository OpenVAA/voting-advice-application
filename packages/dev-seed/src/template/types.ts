/**
 * Template TS type — derived via `z.infer<>` per.
 *
 * The Template type is the single source of truth for template shape; it
 * mirrors {@link TemplateSchema} exactly without hand-written duplication.
 * Import from the `@openvaa/dev-seed` barrel:
 *
 * ```ts
 * import type { Template } from '@openvaa/dev-seed';
 * ```
 *
 * ## Template anatomy
 *
 * A template is a declarative config describing what to seed. Every field is
 * optional; a `{}` template produces a valid trivial row-set.
 *
 * ### Top-level fields
 *
 * - `seed: number` — fixed faker RNG seed for deterministic output.
 *   Default 42 (via `buildCtx`). Setting this guarantees byte-identical rows
 *   across runs at the same seed (NF-04).
 *
 * - `externalIdPrefix: string` — prefix prepended to every generator-emitted
 *   `external_id`. Default `'seed_'`. Teardown (`seed:teardown`)
 *   filters on this prefix to remove generator-produced rows.
 *
 * - `projectId: string` — UUID of the project under which rows are created.
 *   Default: the seed.sql bootstrap project
 *   (`00000000-0000-0000-0000-000000000001`). Most templates should not
 *   override — the bootstrap project is what the frontend reads in local dev.
 *
 * - `generateTranslationsForAllLocales: boolean` — when true, localized
 *   JSONB fields are expanded across every locale in
 *   `staticSettings.supportedLocales` (`en`, `fi`, `sv`, `da`). Default
 *   false / undefined. Set `true` in the default template; set
 *   `false` in the e2e template.
 *
 * - `latent: LatentConfig` — see phase 57 latent-factor answer model
 *   configuration (per-party centroids, question loadings, noise). See
 *   {@link LatentHooks} for the swappable per-sub-step seam.
 *
 * ### Per-entity fragments
 *
 * Each of the 12 non-system public tables (`elections`, `constituency_groups`,
 * `constituencies`, `organizations`, `alliances`, `factions`, `candidates`,
 * `question_categories`, `questions`, `nominations`, `app_settings`,
 * `feedback`) accepts a `{ count?, fixed? }` fragment:
 *
 * - `count: number` — target number of SYNTHETIC rows the generator emits.
 *   Smart default per entity (see individual generators).
 *
 * - `fixed: Array<Partial<Row> & { external_id }>` — HAND-AUTHORED rows
 *   merged into the synthetic output. Use for exact party names,
 *   test-specific candidates, known constituency IDs, etc.
 *
 * Example mixing synthetic + hand-authored:
 *
 * ```ts
 * const template: Template = {
 *   seed: 42,
 *   generateTranslationsForAllLocales: true,
 *   organizations: {
 *     count: 8,                                      // 8 total organizations...
 *     fixed: [                                       // ...of which these 2 are hand-authored
 *       { external_id: 'party_vihreat', name: { en: 'Green Wing' }, color: { normal: '#0a716b', dark: '#4db3ad' } },
 *       { external_id: 'party_kokoomus', name: { en: 'Blue Coalition' }, color: { normal: '#2546a8', dark: '#6b8dd6' } }
 *     ]
 *   },
 *   candidates: { count: 100 }
 * };
 * ```
 *
 * ## Further reading
 *
 * - `packages/dev-seed/README.md` — worked authoring example (see phase 58 DX-01).
 *   schema-extension pattern; override signature.
 * - — latent
 *   block semantics (`dimensions`, `eigenvalues`, `centroids`, `spread`,
 *   `loadings`, `noise`).
 */

import type { z } from 'zod';
import type { TemplateSchema } from './schema';

export type Template = z.infer<typeof TemplateSchema>;
