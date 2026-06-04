---
status: complete
status_note: "Stamped complete at v2.10 milestone audit (2026-06-04). localeNames→paraglide + LanguageSelection rendering committed; the verification-time Vite HMR-staleness noise is resolved downstream — perm-localisation-positive (and the full suite) are green in the Phase 94 run."
phase: quick-260601-iqd
plan: 02
subsystem: frontend-i18n + e2e-tests
tags: [playwright, i18n, localeNames, lang-selector, perm-l10n, svelte5]
provides:
  - i18nContext.localeNames (locale-code → native display-name map)
  - LanguageSelection renders via $locales store + localeNames text
affects:
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts (lang-selector now renders)
key-files:
  modified:
    - apps/frontend/src/lib/contexts/i18n/i18nContext.ts
    - apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts
    - apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte
    - apps/frontend/src/lib/i18n/init.ts
    - apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte
    - apps/frontend/src/routes/candidate/+layout.svelte
    - packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts
    - tests/tests/specs/candidate/candidate-mega-journey.spec.ts
    - tests/tests/specs/perm/perm-missing-nominations.spec.ts
metrics:
  completed: 2026-06-01
---

# Phase quick-260601-iqd Plan 02: Fix lang-selector not rendering (+ adjacent e2e fixes)

## Reported failure

`perm-localisation-positive.spec.ts:97` failed at line 123:
`expect(getByTestId('lang-selector')).toBeVisible()` — element not found.

## Root cause

`LanguageSelection.svelte` gated rendering on `{#if locales.length > 1}`, where
`locales` is destructured from `getAppContext()`. In the app context, `locales`
is wrapped as a **Svelte store** (`localesStore = toStore(() => componentCtx.locales)`
— `appContext.svelte.ts:55,219`). A store object has no `.length`, so
`locales.length` evaluated to `undefined`, `undefined > 1` is `false`, and the
`lang-selector` NavGroup never rendered in any locale.

## Fix

- **LanguageSelection.svelte** — read the store via auto-subscribe: `{#if $locales.length > 1}` / `{#each $locales as loc}` / `disabled={loc === $currentLocale}`. NavItem text now comes from a `localeNames[loc]` map (native display names) instead of `t('lang.${loc}')`.
- **i18nContext.ts / .type.ts** — add `localeNames` to the i18n context (sourced from `$lib/i18n`).
- **init.ts** — derive `locales` (array) and `localeNames` (map) from `staticSettings.supportedLocales`, filtered through an `isParaglideLocale` type guard; replaces the prior `langNames` local + `locales = paraglideLocales` export.

### Adjacent fixes committed together (one coherent e2e-green effort)

- **LogoutButton.svelte** — `disabled={!timedModalRef}` guards the logout button until the `TimedModal` ref is bound (prevents `triggerLogout` firing before the modal exists); plus formatting.
- **candidate/+layout.svelte** — comment out the candidate-app notification-popup `$effect` that triggered `effect_update_depth_exceeded` (mirrors the existing `(voters)/+layout.svelte` treatment); drop the now-unused `Notification` import.
- **dev-seed/.../perm-localisation-positive.ts** — import-order lint fix.
- **candidate-mega-journey.spec.ts** — drop `.catch(() => undefined)` on two `waitForURL` calls (rigidity contract: fail hard, don't swallow).
- **perm-missing-nominations.spec.ts** — add the intro-page `voter-intro-start` click after the home start button, and remove the obsolete constituency-selection + explicit `/results` goto steps (flow now routes through the intro page).

## Verification

- **Ground-truth manual check** against the live (seeded) dev server: opened `/en` → nav drawer → `lang-selector` **visible** with 3 NavItems whose text is exactly `English` / `Suomi` / `Svenska` (matches the langSelector fixture's `LOCALE_DISPLAY_NAMES`). The reported `lang-selector`-not-visible failure is resolved.
- During the staged Playwright runs the original assertion (line 123 `expectVisible` first gate) **started passing** — the failure moved downstream, confirming the NavGroup now renders.
- `svelte-check` on the changed frontend files: no new errors (the repo's 6 pre-existing errors are all in unrelated files).

## Known limitation

The full `perm-localisation-positive` E2E was **not run to a clean green** in this
session: back-to-back Playwright runs against the user's foreground `yarn dev`
showed inconsistent results (item-text missing on one run, drawer-open failing on
the next) — the Vite **HMR-staleness** signature (stale `init.ts` / `i18nContext.ts`
served mid-run; see memory `project_e2e_hmr_staleness_restart`). The ground-truth
manual check (run after the server recompiled) renders everything correctly. A
clean dev-server restart + single full run is recommended to confirm end-to-end;
deferred per user direction ("commit now, skip re-run").
