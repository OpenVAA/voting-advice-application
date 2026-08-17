---
title: E2E-01 single-locale variant + runtime supportedLocales override (Phase 90 Stage A attempt — recoverable artifacts)
created: 2026-05-11
updated: 2026-05-30
source_phase: 74-high-leverage-e2e-coverage
source_plan: 01
priority: medium
suggested_phase: future-i18n-stage-b
keywords: [e2e, e2e-01, staticSettings, supportedLocales, paraglide, single-locale, translation-surface, i18n, dynamic-settings, applyDynamicOverride, baselocale, divergence, stage-b, perm-localisation-negative]
---

# E2E-01 single-locale variant — runtime-override mechanism

## Origin

Phase 74 Plan 01 (candidate translation surface E2E gate) landed the **multilocale** assertion path for E2E-01: a Playwright spec asserts that on a question with `localizationDisabled !== true`, the candidate's translation surface (the per-locale text-input expanded form) renders, accepts a Finnish-locale value, and the value persists across reload. This is the higher-risk path because the translation surface is post-v2.8 code with no prior E2E gate.

The complementary single-locale path (assert translation surface does NOT render under a 1-locale `staticSettings.supportedLocales` config) was **deferred** per CONTEXT D-04 because `staticSettings.supportedLocales` is hardcoded in `packages/app-shared/src/settings/staticSettings.ts:46-64` with NO runtime override mechanism.

Phase 74's verification record (`.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md`) classifies ROADMAP SC #1 as **PASS-WITH-DEFERRAL** for this reason.

## Updated framing from Plan 01 SUMMARY

Plan 01's empirical investigation surfaced an important detail that updates the original D-04 framing:

> `staticSettings.supportedLocales` is unused by the input surface — `Input.svelte`'s `locales` come from **Paraglide** (`apps/frontend/src/lib/i18n/init.ts:42`), NOT from `staticSettings.supportedLocales`.

So the deferred single-locale variant needs to target **Paraglide's runtime locale set**, not `staticSettings`. This makes the task either:

- **Option (a):** Add a runtime override for Paraglide's `availableLanguageTags` (or whatever its current API is in the installed version) — a build-time variant gated by an environment variable like `VITE_PARAGLIDE_LOCALES=en`, consumed by `apps/frontend/src/lib/i18n/init.ts`. Per-Playwright-project variant `data-setup-single-locale + variant-single-locale` runs the assertion. Spec asserts the translation surface (Button at `Input.svelte:641-647`) is absent under this config.
- **Option (b):** Component-level test outside Playwright's reach (a Vitest unit test that mocks Paraglide's locale set to length=1 and renders Input.svelte). Lighter-weight; doesn't exercise the full SSR/route pipeline.
- **Option (c):** Wait for CLEAN-04 (Phase 78) to tighten the i18n wrapper. CLEAN-04 may surface a cleaner runtime-override mechanism as part of the tightening; this todo re-frames after Phase 78 lands.

## Scope estimate

- **Option (a):** Small phase / single plan (~3-5 tasks). Plumb the env var through Paraglide init, add a Playwright variant, author the absence-of-feature spec. NOT BLOCKING — phase scheduling is flexible.
- **Option (b):** Single Vitest test addition (~1 hour). Lower coverage value (doesn't exercise SSR/routing) but lower cost.
- **Option (c):** No work in this todo; re-evaluate at Phase 78 close.

## Recommendation

Wait for Phase 78 CLEAN-04 (i18n wrapper tightening — paired with E2E-08 via Order B per CONTEXT D-06). After CLEAN-04 lands, the i18n wrapper will be cleaner and the runtime-override mechanism may emerge naturally. Re-frame this todo at Phase 78 close with concrete Option (a) wiring or fold into Phase 78's follow-up if appropriate.

## Cross-links

- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-04 — deferral rationale.
- `.planning/phases/74-high-leverage-e2e-coverage/74-01-SUMMARY.md` §"Deferred Items Surfaced" — empirical update on Paraglide vs staticSettings.
- `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` §"Success Criteria" SC #1 — PASS-WITH-DEFERRAL anchor.
- `packages/app-shared/src/settings/staticSettings.ts:46-64` — `supportedLocales` (hardcoded, no runtime override).
- `apps/frontend/src/lib/i18n/init.ts:11-34` — i18n init reads `staticSettings.supportedLocales`; sets `defaultLocale` per `isDefault`.
- `apps/frontend/src/lib/i18n/init.ts:42` — Paraglide initialization (the actual source of `Input.svelte`'s `locales` prop).

## Tags

#i18n #e2e #e2e-01 #paraglide #staticSettings #deferred-from-74-01 #stage-b #reverted-from-phase-90

---

## 2026-05-30 update — Phase 90 Stage A attempt + reversal

Phase 90 Plan 01 attempted to land Stage A (the runtime override surface) and Plans 90-03 + 90-04 attempted the corresponding single-locale + dual-locale perms. The full chain shipped to verification (`status: gaps_found, 17/19 must-haves`) and was reverted on 2026-05-30 once the **baseLocale-vs-defaultLocale divergence** was identified as a structural i18n instability (see `[[2026-05-30-paraglide-baselocale-vs-runtime-default-divergence]]`).

**What was reverted:**
- `DynamicSettings.i18n.supportedLocales?` field
- `applyDynamicOverride()` + `recomputeDerivations()` + live ESM `let` bindings in `apps/frontend/src/lib/i18n/init.ts`
- `init.override.test.ts`, `dynamicSettings.i18n.test.ts`
- `perm-localisation-negative` (template + setup/teardown + spec + playwright entries)
- Gap-closure plans 90-05 (+layout.ts wiring) + 90-06 (langSelector baseLocale-aware regex helper extraction)

**What survives in tree** (used by the rewritten Plan 90-04 against the 3-locale static base):
- `tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts`
- `tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts`
- `tests/tests/fixtures/candidate/perm-l10n.ts` (composition root)
- `testIds.shared.langSelector` + `testIds.shared.multilingualToggle`
- Two `data-testid` attributes on `LanguageSelection.svelte` + `Input.svelte`

**The user-facing 3-locale base** (Phase 90 follow-up): `staticSettings.supportedLocales` is now `[en, fi, sv]` (drop `da`). All new voter/candidate/perm tests inherit this directly — no runtime override needed.

### Recoverable artifacts — Stage A surface (`DynamicSettings.i18n` type)

```ts
// Originally landed in packages/app-shared/src/settings/dynamicSettings.type.ts
//
// Wrap this in an optional `i18n` namespace inside DynamicSettings to allow
// future i18n subkeys without renaming. Each entry's `code` MUST be one of
// the Paraglide compile-time locale codes (the URL-pattern table in
// runtime.js drives URL resolution — see baselocale-divergence todo).
readonly i18n?: {
  readonly supportedLocales?: ReadonlyArray<{
    readonly code: string;       // ISO 639 code; must match Paraglide superset entry
    readonly name: string;       // self-name e.g. 'English' / 'Suomi'
    readonly isDefault?: boolean; // mark exactly one; fallback = first entry
  }>;
};
```

### Recoverable artifacts — Stage A init writer (`apps/frontend/src/lib/i18n/init.ts`)

```ts
import { locales as paraglideLocales } from '$lib/paraglide/runtime';
import type { DynamicSettings } from '@openvaa/app-shared';

type LocaleConfig = {
  readonly code: string;
  readonly name: string;
  readonly isDefault?: boolean;
};

let _dynamicOverride: ReadonlyArray<LocaleConfig> | undefined;

/**
 * Apply (or clear) the runtime `supportedLocales` override. Pass `undefined`
 * (or a settings object without `i18n.supportedLocales`) to clear and fall
 * back to `staticSettings.supportedLocales`.
 *
 * IMPORTANT — boot ordering: call this from `+layout.ts`'s `load()` BEFORE
 * any module reads `locales` / `defaultLocale`. On any change, derivations
 * are recomputed and the live ESM `let` bindings are republished —
 * downstream consumers automatically see the new values.
 */
export function applyDynamicOverride(dynamic: DynamicSettings | undefined): void {
  const next = dynamic?.i18n?.supportedLocales;
  const normalised =
    next && Array.isArray(next) && next.length > 0
      ? (next as ReadonlyArray<LocaleConfig>)
      : undefined;
  if (normalised === _dynamicOverride) return;
  _dynamicOverride = normalised;
  recomputeDerivations();
}

function getEffectiveSupportedLocales(): ReadonlyArray<LocaleConfig> {
  if (_dynamicOverride && _dynamicOverride.length > 0) return _dynamicOverride;
  return staticSettings.supportedLocales;
}

// Live ESM bindings — `let` (not const) so consumers always see the
// post-applyDynamicOverride() value through the binding.
export let langNames: Record<string, string> = {};
export let defaultLocale: string = '';
export let locales: ReadonlyArray<string> = paraglideLocales;

function recomputeDerivations(): void {
  const effective = getEffectiveSupportedLocales();
  if (!effective?.length) error(500, 'Could not load supported locales from settings');

  const nextLangNames: Record<string, string> = {};
  let nextDefault = '';
  for (const { code, name, isDefault } of effective) {
    if (code == undefined || typeof code !== 'string')
      error(500, `Invalid locale code in supported locales settings: ${code}`);
    nextLangNames[code] = name;
    if (isDefault) nextDefault = code;
  }
  if (!nextDefault) nextDefault = effective[0].code;

  // Filter Paraglide compile-time superset to override codes when active.
  const codes = new Set(effective.map((l) => l.code));
  const nextLocales: ReadonlyArray<string> = _dynamicOverride
    ? (paraglideLocales as ReadonlyArray<string>).filter((c) => codes.has(c))
    : (paraglideLocales as ReadonlyArray<string>);

  langNames = nextLangNames;
  defaultLocale = nextDefault;
  locales = nextLocales;
}

// Module-load: populate exports from staticSettings (no override active yet).
recomputeDerivations();
```

### Recoverable artifacts — boot wiring (`apps/frontend/src/routes/+layout.ts`)

```ts
// After dataProvider.getAppSettings() resolves but BEFORE any consumer reads
// $lib/i18n exports. Guard against the dataProvider's `.catch((e) => e)`
// path returning an Error instance instead of settings.
import { applyDynamicOverride } from '$lib/i18n/init';

// ...inside load():
const appSettings = await appSettingsPromise; // .catch((e) => e) means may be Error
if (!(appSettings instanceof Error)) {
  applyDynamicOverride(appSettings);
}
```

### Recoverable artifacts — Stage A behavioural tests

```ts
// apps/frontend/src/lib/i18n/tests/init.override.test.ts
import { beforeEach, describe, expect, test } from 'vitest';
import { applyDynamicOverride, defaultLocale, locales } from '../init';

describe('i18n init — runtime supportedLocales override', () => {
  beforeEach(() => applyDynamicOverride(undefined));

  test('Without override, locales equals the Paraglide compile-time superset', () => {
    expect(Array.isArray(locales)).toBe(true);
    expect(locales.length).toBeGreaterThan(1);
  });

  test('Override of one locale filters locales to that single code', () => {
    applyDynamicOverride({
      i18n: { supportedLocales: [{ code: 'en', name: 'English', isDefault: true }] }
    } as never);
    expect(locales).toEqual(['en']);
    expect(defaultLocale).toBe('en');
  });

  test('Override of two locales filters to both', () => {
    applyDynamicOverride({
      i18n: { supportedLocales: [
        { code: 'en', name: 'English', isDefault: true },
        { code: 'fi', name: 'Suomi' }
      ]}
    } as never);
    expect(locales).toEqual(expect.arrayContaining(['en', 'fi']));
    expect(locales.length).toBe(2);
  });

  test('Empty array falls back to static default', () => {
    applyDynamicOverride({ i18n: { supportedLocales: [] } } as never);
    expect(locales.length).toBeGreaterThan(1);
  });

  test('Object without i18n key falls back to static default', () => {
    applyDynamicOverride({} as never);
    expect(locales.length).toBeGreaterThan(1);
  });
});
```

### Recoverable artifact — `perm-localisation-negative` dataset shape (single-locale perm requirement)

The single-locale perm requirement (E2E-01's "translation surface absent under 1-locale") that motivated this todo was implemented in Phase 90 Plan 03 and reverted with the rest of the Stage A work. The dataset shape that worked under the override:

- `externalIdPrefix: 'e2e-perm-l10n-neg-'`
- `APP_SETTINGS` = `{...MINIMAL_BASE_APP_SETTINGS, i18n: { supportedLocales: [{ code: 'en', name: 'English', isDefault: true }] }}`
- 1 election / 1 CG / 1 CO / 1 organization / 1 candidate / 1 nomination
- 2 question categories (1 info + 1 opinion) with 2 questions each
- q2 + q4 carry `customData.disableMultilingual: true` (belt-and-braces against any locale-count regression)
- q3 has `allow_open: true` (so comments accept text)
- Candidate seeded with English-only answers for q1/q2/q3-info/q4-value

The spec asserts: (a) langSelector hidden on every page, (b) `multilingualTextField.expectTranslationOptions(scope, false)` on profile q1/q2 + opinion-editor q3-comment/q4-comment.

### Pre-conditions for Stage B revival

Per `[[2026-05-30-paraglide-baselocale-vs-runtime-default-divergence]]`: any future Stage A revival MUST address the baseLocale ≠ defaultLocale divergence first. Recommended pre-condition: validator that errors at boot when `applyDynamicOverride()` is called with `isDefault: true` on a non-baseLocale entry. Without that guard, a tenant marking `fi` as default under `[en]` baseLocale gets an English UI on `/` while the app believes Finnish is default — silent misbehaviour the override path can't recover from.

### Cross-links (2026-05-30 update)

- `[[2026-05-30-paraglide-baselocale-vs-runtime-default-divergence]]` — the structural i18n issue that motivated the Phase 90 revert
- `[[2026-05-30-vite-plugin-paraglide-tree-shake-translations]]` — companion Stage B item; bundle tree-shake against the same supportedLocales surface
- Phase 90 SUMMARYs (90-01..04) — preserved in `.planning/phases/90-*/` even after the source revert; describe the executor patterns + the perm-l10n composition root + fixture work that DID survive
- Phase 90 verification record (`90-VERIFICATION.md`) — documents the 2 BLOCKER gaps (CR-01 wiring + CR-02 baseLocale regex) that arose from the divergence

