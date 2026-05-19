---
title: E2E-01 single-locale variant — staticSettings.supportedLocales runtime override
created: 2026-05-11
source_phase: 74-high-leverage-e2e-coverage
source_plan: 01
priority: low
suggested_phase: future-i18n-or-CLEAN-04-followup
keywords: [e2e, e2e-01, staticSettings, supportedLocales, paraglide, single-locale, translation-surface, i18n]
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

#i18n #e2e #e2e-01 #paraglide #staticSettings #deferred-from-74-01
