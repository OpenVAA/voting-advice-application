---
title: Vite plugin to tree-shake Paraglide translations by tenant-supported locales
created: 2026-05-30
source_phase: 90-tir5-permutations-missing-nominations-warning-localisation-n
source_plan: 01
priority: low
suggested_phase: future-bundle-perf
keywords: [vite, paraglide, tree-shaking, bundle-size, i18n, supportedLocales, runtime-override, stage-b, performance]
---

# Vite plugin to tree-shake Paraglide translations by tenant-supported locales

## Origin

Phase 90 Plan 01 (Stage A `applyDynamicOverride()`) closed the **runtime UI gate** for `DynamicSettings.i18n.supportedLocales`: tenants can now hide locales from `<LanguageSelection />` and suppress multilingual authoring surfaces without rebuilding. By design, Stage A leaves Paraglide's compile-time bundles untouched — see `apps/frontend/src/lib/i18n/init.ts:99-106`:

> Phase 90 Plan 01 (Stage A / TIR5:28-50): perm templates can ship `app_settings.settings.i18n.supportedLocales: [{code:'en', ...}]` to drop the user-facing locale list to one entry, which gates `LanguageSelection.svelte`'s render via `locales.length > 1` WITHOUT mutating Paraglide compile-time bundles (translations remain available for forward compatibility).

## What's wasted today

Every compiled Paraglide message file at `apps/frontend/src/lib/paraglide/messages/{key}.js` contains a per-locale arrow (`en_X`, `fi_X`, `sv_X`, `da_X`, `et_X`, `fr_X`, `lb_X`) and a runtime dispatcher. **585 message files × 7 locales** ship in the client bundle regardless of which subset the tenant exposes. A single-locale tenant downloads the same JS payload as a fully-multilingual one.

`apps/frontend/src/lib/paraglide/runtime.js:21` exports `locales` as a compile-time `const` — Paraglide has no native runtime path to drop variants.

## Trade-offs against the existing alternatives

| Approach | Bundle savings | Override at runtime | Build complexity | SSR/CSR risk |
|----------|---------------:|---------------------|------------------|--------------|
| Status quo (Stage A only) | 0% | ✓ | none | none |
| Paraglide `experimentalStaticLocale` | ~6/7 per locale | ✗ (N builds for N subsets) | high | none |
| **This todo — Vite plugin** | tenant-dependent (potentially 6/7) | ✓ at build time only | medium | medium |

A Vite plugin path would tree-shake per-locale variants out of message files at build time, keyed off a build-time tenant config (env var or external manifest). The runtime UI override would continue to control the locale selector inside the surviving set.

## Open design questions

1. **Build-time vs request-time:** does the tenant identity stay stable per deployment (build-time config is fine) or does one deployment serve multiple tenant variants (need per-request chunk loading)?
2. **Compatibility with `setLocale()`:** if `setLocale('fi')` is called against a bundle that tree-shook `fi`, what should happen — error, fall back to base, lazy-load?
3. **`getLocale()` SSR boundary:** would need to ensure SSR + hydration agree on the locale set, since tree-shake is build-time but locale resolution is request-time.
4. **Paraglide upstream:** does inlang have an officially-supported variant-filter hook, or would this be a fork/patch path?
5. **Forward-compat cost:** Stage A explicitly preserves "operator can enable a previously-hidden locale by toggling JSONB; no redeploy". Tree-shaking breaks that. Acceptable trade?

## When to revisit

Only when the bundle-size cost of the 6 unused locale variants becomes material — e.g., LCP regression on mobile cold-start, or a tenant that genuinely ships only 1–2 locales and wants the bundle-budget headroom. Not urgent; Stage A is sufficient for correctness.

## Related

- `[[2026-05-11-e2e-01-single-locale-runtime-override]]` — the runtime UI gate that this would complement
- `apps/frontend/src/lib/i18n/init.ts:99-106` — Stage A docstring documenting the "compile-time bundles preserved" trade-off
- `apps/frontend/project.inlang/settings.json` — the locale superset (`en, fi, sv, da, et, fr, lb`)
- `apps/frontend/vite.config.ts` — where the plugin would slot into `paraglideVitePlugin(...)`
