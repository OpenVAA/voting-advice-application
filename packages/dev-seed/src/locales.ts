/**
 * Locale fan-out — post-processing step that expands `{ en: "..." }` JSONB fields to every locale in `LOCALES` when `template.generateTranslationsForAllLocales` is true.
 *
 * Runs AFTER generators produce rows, BEFORE the writer bulk-imports them.
 * Pure function — no I/O, no mutation of shared state. Operates on a row dataset in-place (the pipeline already owns the rows; mutation avoids a full deep clone).
 *
 * ## Determinism discipline
 *
 * ⚠ Locale iteration order MUST be stable across runs, or the seed stops guaranteeing byte-identical output. This module enforces two rules:
 *
 *   1. `LOCALES` is read from the `staticSettings.supportedLocales` array, whose order is fixed by its declaration — never from `Object.keys` of a map or another derived structure.
 *
 *   2. Row iteration uses the TOPO_ORDER table sequence (already frozen in pipeline.ts); field iteration within a row uses the `LOCALIZED_FIELDS` map (hardcoded below). No `Object.keys(row).sort()` — sorting flips based on typed-key vs stringified-key ordering rules.
 *
 * ## Scope
 *
 * Only JSONB localized-string columns are expanded. Plain-text columns (`candidates.first_name`, `candidates.last_name`) are structurally single-valued and NOT touched.
 *
 * ## Per-locale Fakers
 *
 * Each fan-out invocation constructs per-locale Faker instances keyed by locale + seed, seeded deterministically. The fakers are CONSTRUCTED FRESH inside the function — no module-level singleton. The `fakers` map inside `fanOutLocales` is an in-invocation cache (re-created on each call).
 *
 * ## Not re-generating semantically-correct translations
 *
 * Fan-out generates locale-specific NAMES via faker — it does NOT translate the input string. A candidate named "Pentti" in fi may get "Johan" in sv (different faker output from the Swedish locale pack). This is DEV-TOOL-INTENTIONAL: the goal is "the app renders in all locales", not "a single candidate has a consistent name across locales" (candidates are synthetic; the locale data isn't semantically linked across locales).
 */

import { allLocales, en, Faker } from '@faker-js/faker';
import { staticSettings } from '@openvaa/app-shared';
import type { LocaleDefinition } from '@faker-js/faker';

/**
 * The locale codes of `staticSettings.supportedLocales`, in its declared order — see the determinism rules above.
 */
export const LOCALES: ReadonlyArray<string> = staticSettings.supportedLocales.map((locale) => locale.code);

export type LocaleCode = string;

/**
 * Expand localized JSONB fields across all LOCALES.
 *
 * **Mutates** `rows` in-place (rows are already owned by the pipeline; a deep clone would double memory for no gain). Returns the same reference for ergonomic chaining.
 *
 * No-op when `template.generateTranslationsForAllLocales` is not `true` (undefined / false both skip).
 *
 * @param rows  Pipeline output: `Record<tableName, Array<row>>`.
 * @param template Validated Template. Must include the boolean flag.
 * @param seed Faker seed — used verbatim for reproducibility. Combined
 *             per-locale so different locales produce different outputs at the same seed while the overall run stays deterministic.
 */
export function fanOutLocales(
  rows: Record<string, Array<Record<string, unknown>>>,
  template: { generateTranslationsForAllLocales?: boolean },
  seed: number
): Record<string, Array<Record<string, unknown>>> {
  if (template.generateTranslationsForAllLocales !== true) return rows;

  // Per-invocation Faker cache — keyed by locale. Seed differs per locale (`seed + index`) so the locales produce visibly different names but the run is still deterministic at the same `seed` argument.
  const fakers: Record<LocaleCode, Faker> = Object.fromEntries(
    LOCALES.map((locale, index) => [locale, makeLocaleFaker(locale, seed + index)])
  );

  // Iterate tables in LOCALIZED_FIELDS key order (alphabetical — frozen).
  // Iterate each row's localized fields in the order defined in LOCALIZED_FIELDS (NOT Object.keys(row)). Iterate LOCALES in declared order. All three iteration orders are locked.
  for (const table of Object.keys(LOCALIZED_FIELDS)) {
    const tableRows = rows[table];
    if (!Array.isArray(tableRows)) continue;
    const fields = LOCALIZED_FIELDS[table];
    for (const row of tableRows) {
      for (const field of fields) {
        const current = row[field];
        if (current === undefined || current === null) continue;
        // Plain strings are NOT localized JSONB — skip.
        if (typeof current === 'string') continue;
        // Must be an object to be a localized JSONB field.
        if (typeof current !== 'object' || Array.isArray(current)) continue;
        const localized = current as Record<string, unknown>;
        // Prefer mirroring an existing `en` value to missing locales over emitting faker noise. Hand-authored `fixed[]` rows set an `en` value that's semantically meaningful (e.g. "Uudenmaa North"); inventing a company name for the `fi` slot makes the UI unreadable in non-English locales. Faker is only a fallback when no `en` value exists — preserves visual-parity signal for rows that truly have nothing to mirror.
        const enValue = typeof localized.en === 'string' && localized.en.length > 0 ? localized.en : null;
        for (const locale of LOCALES) {
          if (localized[locale] === undefined) {
            localized[locale] = enValue ?? generateLocaleValue(fakers[locale], field);
          }
        }
      }
    }
  }

  return rows;
}

/**
 * Localized-string JSONB columns per table, derived from the schema. Order is alphabetical by table name for determinism.
 *
 * Tables not listed here have no localized-string columns the fan-out cares about (e.g. `nominations.name` exists but is rarely used by templates; `app_settings.settings` is a different shape).
 */
const LOCALIZED_FIELDS: Record<string, ReadonlyArray<string>> = {
  alliances: ['name', 'short_name', 'info'],
  candidates: ['short_name', 'info'],
  constituencies: ['name', 'info'],
  constituency_groups: ['name', 'info'],
  elections: ['name', 'info'],
  factions: ['name', 'short_name', 'info'],
  organizations: ['name', 'short_name', 'info'],
  question_categories: ['name', 'info'],
  questions: ['name', 'info']
};

/**
 * Generate a faker-driven localized string for a given locale + context.
 *
 * The `field` hint narrows faker's output. `'short_name'` uses `faker.company.buzzNoun()` for ticker-like short labels. `'info'` uses `faker.lorem.sentence()` for descriptive prose. Everything else (including `'name'`) falls back to `faker.company.name()` for title-case single-line strings.
 *
 * NOT semantically correct translations — these are synthetic fillers for dev-mode visual parity across locales. Production deployments supply real localized content.
 */
function generateLocaleValue(faker: Faker, field: string): string {
  if (field === 'short_name') return faker.company.buzzNoun();
  if (field === 'info') return faker.lorem.sentence();
  // 'name' and any other field default to a company-style string
  return faker.company.name();
}

/**
 * Build a per-locale Faker with a given seed: a fresh instance, never module-level state. The fallback chain `[locale, en]` means missing keys in the locale pack fall back to English.
 */
function makeLocaleFaker(locale: LocaleCode, seed: number): Faker {
  const f = new Faker({ locale: [localePack(locale), en] });
  f.seed(seed);
  return f;
}

/**
 * The faker locale pack of a locale code, or the English pack when faker has none for it.
 */
export function localePack(locale: LocaleCode): LocaleDefinition {
  return allLocales[locale as keyof typeof allLocales] ?? en;
}
