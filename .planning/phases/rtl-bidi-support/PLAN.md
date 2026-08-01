# Phase: RTL / Bidi Support (Arabic locale)

**Type:** Standalone phase — current branch (`feat-rtl-locales`) only.
**Tech target:** Strapi · Svelte 4 · SvelteKit 2 · Tailwind 3.4 · DaisyUI 4 · `frontend/` layout.
**Decisions contract:** see [`DECISIONS.md`](./DECISIONS.md) (Part A = portable principles; this plan implements them on the current line per Part B).
**Reuse:** to implement on the way-ahead branch later, port `DECISIONS.md` Part A verbatim and re-derive the file lists in this plan against that branch.

## Goal

Ship a working **Arabic (RTL) locale** on top of **general, reusable RTL/bidi infrastructure** — the document flips to
`dir="rtl"` from locale config, the UI mirrors via logical CSS, Arabic text renders in an Arabic-capable font, and
mixed-direction content stays correct. Adding the next RTL locale (Hebrew/Farsi/Urdu) must then be a config + translations
task only.

## Success criteria

- Visiting `/ar` (or switching locale to Arabic) renders `<html lang="ar" dir="rtl">`, set server-side (no LTR→RTL flash).
- Switching back to a LTR locale restores `dir="ltr"` reactively; LTR layouts are visually unchanged.
- No physical directional utility classes remain in app code except an explicit, documented allowlist (genuine-physical).
- Arabic glyphs render with no tofu (□); the Latin font path is unaffected.
- A mixed-direction string (Latin name in Arabic UI) renders without reordering corruption.
- Arabic is registered end-to-end (frontend i18n + Strapi locale + backend translation overrides); app loads in Arabic.
- RTL is covered by the QA gate (one RTL locale: visual + axe + `dir` assertion).

---

## Plan units

### P1 — Direction infrastructure (foundation) — *do first*
**Implements:** A1, A2, A4.
- Add `dir?: 'ltr' | 'rtl'` (default `'ltr'`) to the locale entry type — `packages/app-shared/src/settings/staticSettings.type.ts:82`.
- Add the `ar` entry to `supportedLocales` — `packages/app-shared/src/settings/staticSettings.ts:46` → `{ code: 'ar', name: 'العربية', dir: 'rtl' }`. Rebuild app-shared (`yarn build:app-shared`).
- Add derivation helper `getLocaleDir(locale)` / `isRtl(locale)` reading the config — new file under `frontend/src/lib/i18n/`.
- Expose `dir` in the i18n context — `frontend/src/lib/contexts/i18n/i18nContext.ts` (+ `.type.ts`).
- SSR root attribute: add `dir="%dir%"` to `frontend/src/app.html:2`; replace `%dir%` in `transformPageChunk` — `frontend/src/hooks.server.ts:115` (derive from `servedLocale`).
- Client reactivity: ensure in-app locale change updates `document.documentElement.dir` (root layout / i18n context).

**Verify:** `/ar` SSR HTML contains `dir="rtl"`; locale toggle flips `dir` without reload.
**Done:** direction is read from config in exactly one place; no hardcoded locale list.

### P2 — Logical CSS migration (the bulk) — *largest unit*
**Implements:** A3, A9.
- Migrate physical → logical Tailwind utilities across **38 files**: `ml/mr→ms/me`, `pl/pr→ps/pe`, `left/right→start/end`, `text-left/right→text-start/end`, `rounded-l/r→rounded-s/e`, `border-l/r→border-s/e`. Inventory (by hit count):
  - **High:** `components/video/Video.svelte` (7), `components/input/Input.svelte` (7), `components/select/Select.svelte` (5), `admin/components/jobs/FeatureJobs.svelte` (5)†.
  - **Med:** `routes/[[lang=locale]]/MainContent.svelte`, `…/results/statistics/+page.svelte`, `components/questions/QuestionOpenAnswer.svelte`, `components/alert/Alert.svelte` (4 each); `Expander.svelte`, `entityCard/EntityCard.svelte`, `EnumeratedEntityFilter.svelte`, `accordionSelect/AccordionSelect.svelte`, candidate `settings/+page.svelte` (3 each).
  - **Low (1–2):** `SingleCardContent`, `MaintenancePage`, `Header`, `+error`, `nominations/+page`, `results/+page`, `footer/Footer`, `term/Term`, `modal/timed/TimedModal`, `modal/drawer/Drawer`, `successMessage`, `errorMessage`, `CandidateNav`, `InfoItem`, `Warning`, `QuestionExtendedInfo`, `QuestionChoices`, `Modal`, `EntityFilters`, `PasswordField`.
- Safe-area (A9): add logical `safes`/`safee` (+ `safemds/safemde`, `safelgs/safelge`) tokens to `frontend/tailwind.config.mjs` (≈line 162) whose start/end resolve to left in LTR / right in RTL; swap the ~15 `safel*/safer*` usages (`app.css:222`, `Alert`, `Footer`, `MainContent`, `SingleCardContent`, `results/+page`, `nominations/+page`, success/error/maintenance pages, etc.).
  - Mechanism: since `env()` can't auto-flip, define start/end via `:where([dir="rtl"])` overrides or a small `@layer` that swaps inset-left/right under RTL.
- Suggested batching: (1) shared `components/*`, (2) `dynamic-components/*`, (3) `routes/*`, (4) safe-area tokens + sweep, (5) †admin (see scope note).

**Verify:** the P2 grep (below) returns only allowlisted hits; LTR screenshots unchanged; `/ar` mirrors.
**Done:** logical-CSS is the standard; offenders eliminated or explicitly exempted.

> **† Admin scope note:** the admin app does not require visual RTL to ship Arabic. `FeatureJobs.svelte` (and any other
> `lib/admin/**`) may be **deferred** — leave a tracked todo rather than blocking. Confirm with maintainer.

### P3 — Directional icons & motion
**Implements:** A6.
- Mirror `next`/`previous` arrows — `frontend/src/lib/components/icon/icons.ts:53,60` (flip by direction, or swap glyphs under RTL).
- Fix `Expander.svelte` `rotate(90deg)`/`rotate(270deg)` (lines ≈152/156) to mirror in RTL.
- Audit + fix `modal/drawer/Drawer.svelte` (drawer side), `term/Term.svelte` `translateX`, and any chevron/carousel/swipe affordances.

**Verify:** in `/ar`, "next" points toward the reading-end (left), drawers open from the correct side, expanders point correctly.
**Done:** no LTR-hardcoded directional affordance remains.

### P4 — Script-aware fonts
**Implements:** A7.
- Add an Arabic-capable font (e.g. Noto Sans Arabic / IBM Plex Sans Arabic) — extend `staticSettings.font` to allow a
  per-locale or secondary font; update the loader at `frontend/src/routes/[[lang=locale]]/+layout.svelte:115` and the
  `fontFamily` fallback chain in `frontend/tailwind.config.mjs`.
- Load with `display: swap` + `unicode-range` subset so the Latin path is unaffected (gotcha #4).

**Verify:** Arabic UI renders with no tofu; Latin locales unchanged; no first-paint block.
**Done:** the font stack covers the active locale's script, driven by config.

### P5 — Bidi content & formatting
**Implements:** A5, A8.
- Apply `dir="auto"` to author/user/data content render sites: entity & party names, free-text answers — e.g.
  `dynamic-components/entityCard/EntityCard.svelte`, `dynamic-components/entityDetails/*`, `components/questions/QuestionOpenAnswer.svelte`.
- Isolate embedded LTR tokens (URLs/emails/brand) in RTL strings (bidi isolation).
- Route number/date formatting through `Intl` per active locale where hardcoded.

**Verify:** a Latin candidate name inside the Arabic UI renders correctly; numbers/dates format per `ar`.
**Done:** mixed-direction content is correct independent of UI locale.

### P6 — Backend locale, translation registration & QA gate
**Implements:** A1 (backend side), A10.
- Frontend i18n registration: add `ar: 'العربية'` to `frontend/src/lib/i18n/translations/index.ts:58`; create
  `frontend/src/lib/i18n/translations/ar/` with all keys (seed from `en/`; translation *content* may be partial — see DECISIONS deferred).
- Strapi: ensure the `ar` i18n locale is created on init; add `backend/vaa-strapi/src/util/translations/ar/dynamic.json`
  and import it in `backend/vaa-strapi/src/util/appCustomization.ts:2` (note: `da`/`et` imports are currently missing there — fix opportunistically).
- QA gate: add one RTL locale to the visual + axe a11y checks; assert `<html dir>` flips; add the do-not-mirror exemption list (A10 / gotcha #3).

**Verify:** app loads in Arabic end-to-end (frontend + backend overrides); i18n parity test passes; axe clean in `ar`.
**Done:** Arabic is a registered, tested locale.

---

## Verification (phase-level)

```bash
# P2 — no physical directional utilities left (tune the allowlist as needed)
cd frontend && grep -rEn --include="*.svelte" --include="*.ts" \
  "(\b(m|p)(l|r)-|\btext-(left|right)\b|\brounded-[lr]\b|\bborder-[lr]\b|\bsafe(l|r|lgl|lgr|mdl|mdr)\b)" src \
  | grep -vE "# allowlist:"   # genuine-physical exceptions tagged in-line

# P1 — SSR dir attribute
curl -s localhost:5173/ar | grep -oE '<html[^>]*dir="[^"]*"'

# build + tests
yarn build:app-shared && yarn test:unit
```

## Risks & notes

- **P2 is the dominant cost & risk** (38 files + safe-area). Keep LTR visually pixel-stable — review LTR screenshots per batch.
- **Safe-area (A9)** is the most likely silent regression — verify notch padding on a real RTL device/emulator, not just desktop.
- **DaisyUI 4** flips internally off root `dir` (A4) — much component-internal mirroring is free once P1 lands; validate, don't pre-fix.
- **Do-not-mirror set** (logos, portraits, video chrome, compass/map, charts) must be exempted — see DECISIONS gotcha #3.
- **Translations** themselves are content, not code — registration is in scope here; full human translation is deferred.

## Out of scope (this phase)

- LLM Arabic prompt support; Arabic mock-data (Faker `ar`); full human translation content. (See `DECISIONS.md` → Deferred.)
- Way-ahead branch implementation — separate effort, driven by `DECISIONS.md` Part A.
