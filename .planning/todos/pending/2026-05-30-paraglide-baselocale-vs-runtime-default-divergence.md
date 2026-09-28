---
title: Reconcile Paraglide compile-time baseLocale with runtime DynamicSettings defaultLocale
created: 2026-05-30
source_phase: 90-tir5-permutations-missing-nominations-warning-localisation-n
source_plan: 01
priority: medium
suggested_phase: future-i18n-stage-b
keywords: [paraglide, baseLocale, defaultLocale, supportedLocales, url-pattern, dynamicSettings, stage-b, i18n, multi-tenant]
---

# Reconcile Paraglide compile-time `baseLocale` with runtime `defaultLocale`

## Origin

Phase 90 Plan 01 (Stage A `applyDynamicOverride()`) closed the **UI gate** for `DynamicSettings.i18n.supportedLocales`, but left two locale concepts unsynchronised:

1. **Paraglide `baseLocale`** — the locale Paraglide serves from the root URL (`/`) with no path segment. Compile-time constant in `apps/frontend/project.inlang/settings.json:2` (`"baseLocale": "en"`). Hard-baked into the URL-pattern table at `apps/frontend/src/lib/paraglide/runtime.js`:
   ```
   en  →  /:path(.*)?              ← prefix-less
   fi  →  /fi/:path(.*)?
   sv  →  /sv/:path(.*)?
   ...
   ```
2. **OpenVAA `defaultLocale`** — runtime concept resolved by `applyDynamicOverride()` from `DynamicSettings.i18n.supportedLocales[].isDefault` (or first entry as fallback). Lives at `apps/frontend/src/lib/i18n/init.ts:90` as a live ESM `let` binding.

These are independent today.

## The divergence scenario

A tenant could ship a `DynamicSettings.i18n.supportedLocales` override marking a non-baseLocale as default:

```json
"i18n": { "supportedLocales": [
  { "code": "fi", "name": "Suomi", "isDefault": true },
  { "code": "sv", "name": "Svenska" }
]}
```

After `applyDynamicOverride()`:
- App `defaultLocale === 'fi'`
- App `locales === ['fi', 'sv']` (Paraglide's `en` filtered out of the selector)
- **User hitting `/results` still gets `en`-rendered Paraglide strings** — Paraglide's URL strategy resolves `/` to `baseLocale = 'en'`, independent of the runtime override
- LanguageSelection shows Finnish + Swedish only — no way to switch off the English default
- Net result: English UI on root URL while the app believes Finnish is default

## Why Phase 90 left this alone

Stage A's D-90-10 scope was the UI gate (selector visibility + multilingual authoring surfaces). The two `perm-localisation-*` permutations Phase 90 ships only exercise the safe subset where the runtime default agrees with `baseLocale`:
- `perm-localisation-negative`: single locale `[en]` — `en` IS baseLocale, no divergence
- `perm-localisation-positive`: dual locale `[en, fi]` with `en` default — agrees with baseLocale, no divergence

The divergence scenario is not currently exercised by any perm; the silent-misbehaviour mode would only surface in production for a tenant who marks a non-`en` locale as default.

## Resolution paths (Stage B candidates)

| Approach | Bundle savings | Runtime tenant flexibility | Build complexity | Notes |
|----------|---------------:|----------------------------|------------------|-------|
| **A. Per-tenant builds** with `baseLocale` set in `project.inlang/settings.json` | Combinable with the tree-shake todo | None (build-time only) | high | One build per `baseLocale` × supported subset combination |
| **B. Custom Paraglide URL strategy** (`strategy: ['custom-...']`) that consults `applyDynamicOverride()` state at request time | 0 | full | medium | Need a custom strategy module + SSR/CSR agreement on resolution; might fight Paraglide's caching |
| **C. Validator constraint**: forbid `isDefault: true` on any locale ≠ `baseLocale` in the runtime override | 0 | restricted to baseLocale defaults | low | Cheapest. Honest: tells operator "you can't change the default without rebuilding". Loud failure beats silent misbehaviour. |
| **D. Hybrid: Stage A surface + warning** — accept the override but `logDebugError` (or hard `error(500)`) at boot when default ≠ baseLocale | 0 | restricted at runtime | low | Half-measure; surfaces the issue without resolving it |

**Recommended starting point:** Option C (validator). It's the cheapest fix and surfaces the constraint immediately. Operators who genuinely need a non-`en` default can then escalate to Option A (per-tenant build) or B (custom strategy) as a follow-up.

## Open design questions

1. **Where should the validator live?** Plausible spots:
   - Inside `applyDynamicOverride()` itself (boot-time `error(500)` if violated)
   - In `mergeSettings` at the app-shared layer (validate before the override ever reaches `init.ts`)
   - In a CI gate on the perm templates (catches the issue at seed-template-author time)
2. **Should the validator import Paraglide's `baseLocale` directly** (creating a circular-ish dep from `app-shared` → `frontend/paraglide`), or **mirror the constant** at the validator layer (drift risk)?
3. **What's the migration path** for any existing tenant data with a divergent default? Probably none today (only test perms exist) — but worth confirming before enabling.
4. **Interaction with the tree-shake todo** (`[[2026-05-30-vite-plugin-paraglide-tree-shake-translations]]`): if both Options A (per-tenant build) and tree-shake land together, the combined change is one rebuild per tenant that ships only the locales they actually use AND has the correct baseLocale. They're complementary, not exclusive.

## When to revisit

- Before any operator with a non-`en` default ships to production (urgent at that moment)
- During the next i18n-leaning phase (combine with the tree-shake todo for a single Stage B sweep)
- If a perm template author tries to set `isDefault: true` on a non-baseLocale entry and gets confused by silent misbehaviour

Not urgent today — Phase 90 perms only exercise the safe subset.

## Related

- `[[2026-05-30-vite-plugin-paraglide-tree-shake-translations]]` — companion Stage B item; bundle-size optimisation against the same supportedLocales surface
- `[[2026-05-11-e2e-01-single-locale-runtime-override]]` — the original deferred E2E scenario that motivated the Stage A override
- `apps/frontend/project.inlang/settings.json:2` — `baseLocale` definition site (would need to move to per-tenant config under Option A)
- `apps/frontend/src/lib/paraglide/runtime.js` — generated URL-pattern table where the prefix-less `en` mapping is baked in
- `apps/frontend/src/lib/i18n/init.ts:53-62` — `applyDynamicOverride()`, the candidate site for the Option C validator
- `packages/app-shared/src/settings/staticSettings.ts` — `supportedLocales` static fallback; `isDefault: true` precedent
