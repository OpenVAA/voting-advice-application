/**
 * Template TS type — the AUTHORING authority for a `@openvaa/dev-seed` template.
 *
 * ## Two authorities, held in agreement
 *
 * {@link TemplateSchema} is the **runtime** authority: `validateTemplate` parses whatever a filesystem template hands over, and its per-entity `fixed[]` stays `z.record(z.string(), z.unknown())` on purpose — there is exactly ONE row-level authority, and that authority is the runtime unknown-key guard, not zod.
 *
 * `Template` is the **authoring** authority. It is hand-written, and its twelve per-entity slots carry the per-collection `FixedRow` aliases from `./permittedKeys`, so a key that no column, sentinel, non-column field or RPC relationship reference admits is a TypeScript error at the point it is written — naming the row type, e.g.
 * `'_constituencies' does not exist in type 'ElectionsFixedRow'`.
 *
 * Until this change `Template` was `z.infer<typeof TemplateSchema>`, so every template annotated `: Template` got `Record<string, unknown>` rows and an illegal key was indistinguishable from a real column. The old doc comment claimed `Template` "mirrors {@link TemplateSchema} exactly without hand-written duplication"; that is now only half true, so it is replaced rather than left standing — a record that silently stops being true is how records come to disagree.
 *
 * The two are kept from drifting by {@link TEMPLATE_KEYS_MATCH_SCHEMA}, a compile-time assertion over the TOP-LEVEL key set. Adding or removing a slot in `schema.ts` without doing the same here stops the build and names the offending key. (The rejected alternative was a mapped-type override on `z.infer`; it was rejected because the override is invisible from `schema.ts`, so the next schema edit would silently lose it.)
 *
 * ⚠ **What the type layer does NOT cover.** Excess property checking is a fresh-object-literal rule: assigning a row through an intermediate variable bypasses it entirely. `src/templates/_helpers/buildMinimal.ts` constructs the `perm-*` templates' rows programmatically, so the guarantee does not reach every row by this route alone. The runtime guard is the cover there, and the negative-control fixtures under `tests/fixtures/` assert it.
 *
 * Import from the `@openvaa/dev-seed` barrel:
 *
 * ```ts
 * import type { Template } from '@openvaa/dev-seed';
 * ```
 *
 * ## Template anatomy
 *
 * A template is a declarative config describing what to seed. Every field is optional; a `{}` template produces a valid trivial row-set.
 *
 * ### Top-level fields
 *
 * - `seed: number` — fixed faker RNG seed for deterministic output.
 *   Default 42 (via `buildCtx`). Setting this guarantees byte-identical rows across runs at the same seed.
 *
 * - `refDate: string` — ISO datetime anchoring every generated date.
 *   Default `SEED_REF_DATE` (via `buildCtx`). Dates are drawn relative to this anchor rather than to the system clock, so the same seed emits the same dates on any calendar day.
 *
 * - `externalIdPrefix: string` — prefix prepended to every emitted `external_id`,
 *   **including hand-authored `fixed[]` rows** — every generator emits ``external_id: `${externalIdPrefix}${fx.external_id}` `` (e.g.
 *   `ElectionsGenerator.ts:43-45`). Default `'seed_'`. Teardown (`seed:teardown`) filters on this prefix. Author `fixed[]` ids WITHOUT the prefix; `templates/e2e/base.ts:15` takes the other route and sets the prefix to `''` with the ids pre-written.
 *
 * - `projectId: string` — UUID of the project under which rows are created.
 *   Default: the seed.sql bootstrap project (`00000000-0000-0000-0000-000000000001`). Most templates should not override — the bootstrap project is what the frontend reads in local dev.
 *
 * - `generateTranslationsForAllLocales: boolean` — when true, localized
 *   JSONB fields are expanded across every locale in `staticSettings.supportedLocales` (`en`, `fi`, `sv`, `da`). Default false / undefined. Set `true` in the default template; set `false` in the e2e template.
 *
 * - `latent: LatentConfig` — latent-factor answer model
 *   configuration (per-organization centroids, question loadings, noise). See {@link LatentHooks} for the swappable per-sub-step seam. Its shape is read off {@link TemplateSchema} so it cannot drift.
 *
 * ### Per-entity fragments
 *
 * Each of the 12 non-system public tables (`elections`, `constituency_groups`, `constituencies`, `organizations`, `alliances`, `factions`, `candidates`, `question_categories`, `questions`, `nominations`, `app_settings`, `feedback`) accepts a `{ count?, fixed? }` fragment:
 *
 * - `count: number` — target number of SYNTHETIC rows the generator emits.
 *   Smart default per entity (see individual generators).
 *
 * - `fixed: Array<FixedRow<C>>` — HAND-AUTHORED rows merged into the synthetic
 *   output, typed per collection. Use for exact organization names, test-specific candidates, known constituency IDs, etc.
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
 *       { external_id: 'org_vihreat', name: { en: 'Green Wing' }, color: { normal: '#0a716b', dark: '#4db3ad' } },
 *       { external_id: 'org_kokoomus', name: { en: 'Blue Coalition' }, color: { normal: '#2546a8', dark: '#6b8dd6' } }
 *     ]
 *   },
 *   candidates: { count: 100 }
 * };
 * ```
 *
 * ## Further reading
 *
 * - `packages/dev-seed/README.md` — worked authoring example; the
 *   schema-extension pattern; the override signature.
 * - `./permittedKeys.ts` — the four permitted-key sources and the row types.
 * - `./schema.ts` — the latent block's semantics (`dimensions`, `eigenvalues`,
 *   `centroids`, `spread`, `loadings`, `noise`).
 */

import type { z } from 'zod';
import type { Fragment } from '../types';
import type {
  AlliancesFixedRow,
  AppSettingsFixedRow,
  CandidatesFixedRow,
  ConstituenciesFixedRow,
  ConstituencyGroupsFixedRow,
  ElectionsFixedRow,
  FactionsFixedRow,
  FeedbackFixedRow,
  NominationsFixedRow,
  OrganizationsFixedRow,
  QuestionCategoriesFixedRow,
  QuestionsFixedRow
} from './permittedKeys';
import type { TemplateSchema } from './schema';

/** The parsed runtime shape, used only to hold the two authorities in agreement. */
type SchemaShape = z.infer<typeof TemplateSchema>;

/**
 * Latent-factor block. Read off {@link TemplateSchema} rather than re-declared: this plan changes the per-entity slots only, and duplicating the latent shape would create a second thing to keep in sync for no benefit.
 */
export type LatentConfig = NonNullable<SchemaShape['latent']>;

/**
 * A declarative description of what to seed.
 *
 * Per-entity slots are typed per collection — see this file's header for why that is hand-written rather than inferred, and for what it does not cover.
 */
export type Template = {
  seed?: number;
  refDate?: string;
  externalIdPrefix?: string;
  projectId?: string;
  generateTranslationsForAllLocales?: boolean;
  elections?: Fragment<ElectionsFixedRow>;
  constituency_groups?: Fragment<ConstituencyGroupsFixedRow>;
  constituencies?: Fragment<ConstituenciesFixedRow>;
  organizations?: Fragment<OrganizationsFixedRow>;
  alliances?: Fragment<AlliancesFixedRow>;
  factions?: Fragment<FactionsFixedRow>;
  candidates?: Fragment<CandidatesFixedRow>;
  question_categories?: Fragment<QuestionCategoriesFixedRow>;
  questions?: Fragment<QuestionsFixedRow>;
  nominations?: Fragment<NominationsFixedRow>;
  app_settings?: Fragment<AppSettingsFixedRow>;
  feedback?: Fragment<FeedbackFixedRow>;
  latent?: LatentConfig;
};

/** Top-level slots `TemplateSchema` declares but {@link Template} omits. */
type SlotsMissingFromTemplate = Exclude<keyof SchemaShape, keyof Template>;
/** Top-level slots {@link Template} declares but `TemplateSchema` omits. */
type SlotsMissingFromSchema = Exclude<keyof Template, keyof SchemaShape>;

/**
 * Compile-time conformance assertion: the runtime authority and the authoring authority agree on the TOP-LEVEL key set.
 *
 * Row-level agreement is deliberately NOT asserted — zod stays `z.unknown()` at row level so the runtime unknown-key guard is the single row-level authority.
 * What this catches is collection-level drift: add a slot to `schema.ts` without adding it here (or the reverse) and this line stops compiling, naming the slot in the failing type.
 */
const TEMPLATE_KEYS_MATCH_SCHEMA: [SlotsMissingFromTemplate, SlotsMissingFromSchema] extends [never, never]
  ? true
  : [
      'Template and TemplateSchema disagree on the top-level key set',
      SlotsMissingFromTemplate,
      SlotsMissingFromSchema
    ] = true;
void TEMPLATE_KEYS_MATCH_SCHEMA;
