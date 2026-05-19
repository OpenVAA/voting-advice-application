/**
 * Locale fan-out — post-processing step that expands `{ en: "..." }` JSONB
 * fields to `{ en, fi, sv, da }` when `template.generateTranslationsForAllLocales`
 * is true (TMPL-07 / D-58-04).
 *
 * Runs AFTER generators produce rows, BEFORE the writer bulk-imports them.
 * Pure function — no I/O, no mutation of shared state. Operates on a row
 * dataset in-place (the pipeline already owns the rows; mutation avoids a
 * full deep clone).
 *
 * ## Determinism discipline (Pitfall #1)
 *
 * RESEARCH Pitfall #1: locale iteration order MUST be stable across runs for
 * NF-04 to hold. This module enforces two rules:
 *
 *   1. `LOCALES` is a HARDCODED array `['en', 'fi', 'sv', 'da']` — never
 *      derived from `Object.keys(supportedLocales)` or a Map. Object key
 *      order in JS is insertion-order for string keys in practice, but
 *      building the array from derived state introduces order sensitivity.
 *
 *   2. Row iteration uses the TOPO_ORDER table sequence (already frozen in
 *      pipeline.ts); field iteration within a row uses the `LOCALIZED_FIELDS`
 *      map (hardcoded below). No `Object.keys(row).sort()` — sorting flips
 *      based on typed-key vs stringified-key ordering rules.
 *
 * ## Scope
 *
 * Only JSONB localized-string columns are expanded. Plain-text columns
 * (`candidates.first_name`, `candidates.last_name`) are structurally
 * single-valued and NOT touched (see RESEARCH §5 final paragraph).
 *
 * ## Per-locale Fakers
 *
 * Each fan-out invocation constructs per-locale Faker instances keyed by
 * locale + seed, seeded deterministically. Per Pattern A (RESEARCH §5) the
 * fakers are CONSTRUCTED FRESH inside the function — no module-level
 * singleton. The `fakers` map inside `fanOutLocales` is an in-invocation
 * cache (re-created on each call).
 *
 * ## Not re-generating semantically-correct translations
 *
 * Fan-out generates locale-specific NAMES via faker — it does NOT translate
 * the input string. A candidate named "Pentti" in fi may get "Jakob" in da
 * (different faker output from the Danish locale pack). This is
 * DEV-TOOL-INTENTIONAL: the goal is "the app renders in all locales", not
 * "a single candidate has a consistent name across locales" (candidates are
 * synthetic; the locale data isn't semantically linked across locales).
 */

import { da, en, Faker, fi, sv } from '@faker-js/faker';

/**
 * Hardcoded locale iteration order (Pitfall #1).
 *
 * Mirrors `staticSettings.supportedLocales` in `@openvaa/app-shared` but
 * hardcoded here to lock determinism. If a future project adds a 5th locale,
 * update this array AND the `LOCALE_DATA` map AND the inventory list.
 */
export const LOCALES = ['en', 'fi', 'sv', 'da'] as const;

export type LocaleCode = (typeof LOCALES)[number];

/**
 * Per-locale Faker locale packs. Keys must match LOCALES exactly.
 */
const LOCALE_DATA: Record<LocaleCode, typeof en> = {
  en,
  fi,
  sv,
  da
};

/**
 * Localized-string JSONB columns per table. Derived from schema grep
 * (RESEARCH §5 "Localized field inventory"). Order is alphabetical by
 * table name for determinism.
 *
 * Tables not listed here have no localized-string columns the fan-out cares
 * about (e.g. `nominations.name` exists but is rarely used by templates;
 * `app_settings.settings` is a different shape; `feedback` is plain text).
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
 * Build a per-locale Faker with a given seed. Pattern A per RESEARCH §5 —
 * fresh instance, never module-level state. The fallback chain `[locale, en]`
 * means missing keys in the locale pack fall back to English.
 */
function makeLocaleFaker(locale: LocaleCode, seed: number): Faker {
  const f = new Faker({ locale: [LOCALE_DATA[locale], en] });
  f.seed(seed);
  return f;
}

/**
 * Generate a faker-driven localized string for a given locale + context.
 *
 * The `field` hint narrows faker's output. `'short_name'` uses
 * `faker.company.buzzNoun()` for ticker-like short labels. `'info'` uses
 * `faker.lorem.sentence()` for descriptive prose. Everything else
 * (including `'name'`) falls back to `faker.company.name()` for
 * title-case single-line strings.
 *
 * NOT semantically correct translations — these are synthetic fillers for
 * dev-mode visual parity across locales. Production deployments supply real
 * localized content.
 */
function generateLocaleValue(faker: Faker, field: string): string {
  if (field === 'short_name') return faker.company.buzzNoun();
  if (field === 'info') return faker.lorem.sentence();
  // 'name' and any other field default to a company-style string
  return faker.company.name();
}

/**
 * Expand localized JSONB fields across all LOCALES.
 *
 * **Mutates** `rows` in-place (rows are already owned by the pipeline; a
 * deep clone would double memory for no gain). Returns the same reference
 * for ergonomic chaining.
 *
 * No-op when `template.generateTranslationsForAllLocales` is not `true`
 * (undefined / false both skip — preserves Phase 56/57 behavior).
 *
 * @param rows  Pipeline output: `Record<tableName, Array<row>>`.
 * @param template Validated Template. Must include the boolean flag.
 * @param seed Faker seed — used verbatim for reproducibility. Combined
 *             per-locale so different locales produce different outputs at
 *             the same seed while the overall run stays deterministic.
 */
export function fanOutLocales(
  rows: Record<string, Array<Record<string, unknown>>>,
  template: { generateTranslationsForAllLocales?: boolean },
  seed: number
): Record<string, Array<Record<string, unknown>>> {
  if (template.generateTranslationsForAllLocales !== true) return rows;

  // Per-invocation Faker cache — keyed by locale. Seed differs per locale so
  // fi/sv/da/en produce visibly different names but the run is still
  // deterministic at the same `seed` argument.
  const fakers: Record<LocaleCode, Faker> = {
    en: makeLocaleFaker('en', seed),
    fi: makeLocaleFaker('fi', seed + 1),
    sv: makeLocaleFaker('sv', seed + 2),
    da: makeLocaleFaker('da', seed + 3)
  };

  // Iterate tables in LOCALIZED_FIELDS key order (alphabetical — frozen).
  // Iterate each row's localized fields in the order defined in
  // LOCALIZED_FIELDS (NOT Object.keys(row)). Iterate LOCALES in hardcoded
  // order. All three iteration orders are locked (Pitfall #1).
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
        // Prefer mirroring an existing `en` value to missing locales over
        // emitting faker noise. Hand-authored `fixed[]` rows set an `en` value
        // that's semantically meaningful (e.g. "Uudenmaa North"); inventing a
        // Danish company name like "Foged Smykker ApS" for the `da` slot makes
        // the UI unreadable in non-English locales. Faker is only a fallback
        // when no `en` value exists — preserves visual-parity signal for rows
        // that truly have nothing to mirror.
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
