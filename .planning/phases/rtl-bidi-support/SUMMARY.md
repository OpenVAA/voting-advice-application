# Phase Summary: RTL / Bidi Support (Arabic locale)

**Status:** Complete (executed 2026-06-14, branch `feat-rtl-locales`)
**Outcome:** General, reusable RTL/bidi infrastructure shipped, with Arabic (`ar`) as the first consumer.

## What shipped (by plan unit)

| Unit | Commit | What it delivered |
|------|--------|-------------------|
| P1 — Direction infrastructure | `6e756c964` | `dir` is a first-class locale property (`supportedLocales[].dir`); `ar` registered; `getLocaleDir`/`isRtl` helpers; reactive `dir` store in the i18n context; SSR `dir` via `app.html` `%dir%` + `hooks.server.ts`; client reactivity on locale change. (A1, A2, A4) |
| P2 — Logical CSS migration | `7a3acece2` (+ `allowlist` tag) | Physical → logical Tailwind utilities (`ms/me`, `ps/pe`, `start/end`, `text-start/end`, `rounded-e`, …) across ~30 files; direction-aware safe-area tokens (`safes/safee`, `safemds/safelgs`…) backed by `--safe-inline-start/end` CSS vars swapped under `[dir="rtl"]`. LTR pixel-stable. (A3, A9) |
| P3 — Directional icons & motion | `171af8d29` | `DIRECTIONAL_ICONS` set + auto-mirror (`rtl:-scale-x-100`) in `Icon`, with a `mirrored` opt-out (`Expander` uses it). `Drawer` close buttons → logical insets; drawer slides from the bottom (already RTL-agnostic). (A6) |
| P4 — Script-aware fonts | `8cb7bc9a2` | Optional `staticSettings.font.secondary`; Noto Sans Arabic added to the `base` font stack via Google CSS2 (`unicode-range` + `display=swap`, Latin path untouched). (A7) |
| P5 — Bidi content & formatting | `cb58950d8` | `dir="auto"` on author/user content render sites (entity/party names, free-text answers, info answers). Link answers keep URLs in `href` (no inline reordering). (A5, A8 isolation) |
| P6 — Backend locale + QA gate | `e9d859164` | Frontend `ar` i18n registration + `translations/ar/` (key parity, content seeded from `en`). Strapi `ar/dynamic.json` + `appCustomization.ts` now imports **all** supported locales (fixed pre-existing `da` drop). `rtl.spec.ts` QA gate asserts root `dir` flips. (A1 backend, A10) |

## Verification (run offline — Docker stack not available this session)

- `yarn build:app-shared` — clean.
- `yarn workspace @openvaa/frontend test:unit` — **360 passed / 1 skipped** (incl. new `getLocaleDir`/`isRtl` test and +47 `ar` translation-parity tests).
- `yarn workspace @openvaa/frontend check` (svelte-check) — **14 errors / 8 files**, identical to the pre-phase baseline (all pre-existing: missing `@openvaa/question-info`, `buttonVariant`/MouseEvent prop drift, custom-class-not-in-`@layer`). No regressions introduced.
- Tailwind compile confirms generation of `rtl:-scale-x-100`, logical utilities, and the `[dir="rtl"]` safe-area var swap. DaisyUI v4 emits its own `[dir="rtl"]` rules (component internals flip for free off the root `dir`).
- P2 grep: no unexplained physical directional utilities remain outside the admin app — the single exemption (`Button.svelte`) is tagged `allowlist:`.

### NOT yet run (requires `yarn dev` + `yarn test:e2e`)

- `tests/tests/rtl.spec.ts` (the A10 gate) and `translations.spec.ts` `ar` parity — both need the Docker stack. **Run before merge.** Also the plan's `curl localhost:5173/ar | grep dir="rtl"` SSR smoke check, and visual LTR-vs-RTL screenshot review.

## Deferred (tracked, by explicit decision)

- **Admin app RTL** (`lib/admin/**`, incl. `FeatureJobs.svelte`) — per maintainer instruction this session; admin does not need visual RTL to ship Arabic. Physical directional classes remain there.
- **Arabic translation content** — `translations/ar/` (frontend + backend `dynamic.json`) is seeded from English; human/machine translation is a separate content task.
- **Arabic mock data** (Faker `ar`) — the Strapi mock-data locale list is hardcoded and excludes `ar` by design; the `ar` content-locale is created via the existing supported-locales path when mock data runs. (Per DECISIONS deferred.)
- **Locale-aware Intl digit/number formatting** (e.g. Arabic-Indic numerals) — `dir="auto"` already isolates numbers/dates correctly; locale digit formatting is a refinement to land with translation content. (A8 refinement.)
- **LLM Arabic prompt support** — per DECISIONS deferred.

## Notes for porting to the way-ahead branch

Port `DECISIONS.md` Part A verbatim and re-derive Part B file lists — the tactical inventory in the original `PLAN.md` was stale (e.g. it over-counted symmetric classes like `rounded-lg`/`mx-auto` as directional and missed `left-/right-` insets). Re-run the live-tree grep to build the real inventory, as was done here.
