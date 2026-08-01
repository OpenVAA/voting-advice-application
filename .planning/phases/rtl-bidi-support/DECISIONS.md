# RTL / Bidi Support — Decisions in Principle

**Status:** Locked (2026-06-14)
**Scope decision:** General RTL/bidi infrastructure — Arabic (`ar`) is the first consumer; Hebrew/Farsi/Urdu become config-only later.
**Why this doc exists:** The same feature will be implemented on **two diverging code lines**. This file separates the
**portable principles** (Part A — true regardless of stack) from the **per-branch tech mapping** (Part B — the HOW, which
differs). When implementing on the way-ahead branch, port Part A verbatim and re-derive Part B against that branch's tech.

> The two code lines:
> - **Current line** — this branch (`feat-rtl-locales`): Strapi backend, Svelte 4, SvelteKit 2, Tailwind 3.4, DaisyUI 4, `frontend/` layout. The `PLAN.md` next to this file targets this line.
> - **Way-ahead line** — `feat-gsd-roadmap` (+ `feat-gsd-supabase-migration`): Svelte 5 runes + context-as-class, Supabase backend, `apps/frontend/` layout, Turborepo, Tailwind version **to be re-verified**.

---

## Part A — Principles (portable across stacks)

These are the reusable decisions. They contain no file paths and assume no specific framework.

### A1. Directionality is a first-class locale property
Each locale **declares** its writing direction in the locale config (e.g. `dir: 'rtl' | 'ltr'`, default `'ltr'`).
A single derivation helper (`isRtl(locale)` / `getLocaleDir(locale)`) reads that config. **No hardcoded RTL-locale
lists** scattered through the code.
**Why:** single source of truth; adding the next RTL locale is a config edit, not a code hunt.

### A2. RTL is general infrastructure; Arabic is the first consumer
Build the direction plumbing generically. Arabic exercises it first, but nothing is Arabic-specific in the infra layer.
**Why:** the explicit scope choice — maximizes reuse across both branches and future locales.

### A3. Logical CSS properties are the authoring standard
Author with **inline/block logical** properties, never physical left/right, unless the thing is *genuinely* physical
(e.g. a drop shadow that must always fall the same way). Canonical forms:
`margin-inline-start/-end`, `padding-inline-start/-end`, `inset-inline-start/-end`, `border-inline-start/-end`,
`text-align: start/end`, `border-start-start-radius` etc. — and their utility-class equivalents.
**Why:** one rule set serves both directions with zero per-direction overrides; transfers across Tailwind 3 & 4 and
any CSS framework.

### A4. Document direction is set from the active locale, at the root, SSR-first
The document root carries `dir` (alongside `lang`) reflecting the active locale. It is set **server-side** to avoid a
direction flash, and **updated reactively** on in-app locale change.
**Why:** correct first paint; DaisyUI/components and logical CSS all key off the root `dir`.

### A5. User- and data-supplied content uses automatic bidi resolution
Backend/user content (entity names, party names, free-text answers, anything author-supplied) renders with `dir="auto"`
and/or Unicode bidi isolation — **independent of the UI locale's direction**.
**Why:** a Finnish candidate name inside an Arabic UI (and vice-versa) must not corrupt surrounding text.

### A6. Directional icons and motion are logically mirrored, driven by direction
Back/next, chevrons, progress, carousels, `translateX`, drawer side, and rotational affordances derive from the active
direction. **One icon set, mirrored** — not a duplicated per-locale set.
**Why:** "next" must point toward reading-end in both directions; duplicating assets rots.

### A7. Fonts are script-aware
The active font stack must cover the active locale's script. A Latin-only UI font gets an Arabic-capable companion/
fallback (e.g. Noto Sans Arabic / Noto Kufi Arabic / IBM Plex Sans Arabic). Font selection is driven by locale/script
and is configurable like any other locale setting.
**Why:** Latin UI fonts render Arabic as tofu (□) or fall back unpredictably.

### A8. Formatting via `Intl`; embedded LTR tokens isolated
Numbers, dates, and measurements use `Intl` per locale. Embedded LTR tokens inside RTL text (URLs, emails, brand names,
code, version strings) are bidi-isolated so they don't reorder the surrounding text.
**Why:** correctness of mixed-content strings is a runtime concern, not a CSS one.

### A9. Physical viewport insets must be mirrored explicitly
`env(safe-area-inset-left/right)` and any physical environment value **do not follow `dir`**. Provide logical
start/end inset tokens (start → left in LTR / right in RTL) so notch/safe-area padding lands on the correct side.
**Why:** logical CSS handles margins/padding but cannot auto-swap a physically-named `env()` value — this is the
single most common silent RTL regression.

### A10. RTL is part of the test / QA gate
Visual + accessibility checks run in at least one RTL locale. The suite asserts the root `dir` flips and that key
layouts mirror. Things that must **not** mirror (logos, photos, media players, data charts, maps) are explicitly
exempted and verified.
**Why:** without a gate, logical-CSS drift silently reintroduces physical classes.

---

## Part B — Per-branch tech mapping (the HOW)

| Principle | Current line (this branch) | Way-ahead line (re-verify) |
|---|---|---|
| **A1** locale config | `packages/app-shared/src/settings/staticSettings.type.ts` (locale entry type) + `staticSettings.ts` `supportedLocales`. Add `dir`/`rtl` field; add `ar`. | `packages/app-shared` `staticSettings` **still exists** on the supabase branch — confirm the locale entry shape hasn't changed; same edit. |
| **A1** derivation helper | New util in `frontend/src/lib/i18n/` (e.g. `getLocaleDir.ts`). | Same concept under `apps/frontend/src/lib/i18n/`. |
| **A4** root `dir`, SSR | `frontend/src/app.html` add `%dir%`; `frontend/src/hooks.server.ts` `transformPageChunk` (≈line 115) replaces it alongside `%lang%`. | Same SvelteKit mechanism; path is `apps/frontend/src/{app.html,hooks.server.ts}` — verify the transform still lives there. |
| **A4** client reactivity | Svelte 4 store in `frontend/src/lib/contexts/i18n/`. | **Svelte 5 runes / context-as-class** — expose `dir` as `$derived`/`$state` on the i18n context class, not a store. |
| **A3** logical CSS | Tailwind **3.4** logical utilities (`ms/me`, `ps/pe`, `start/end`, `text-start/-end`, `rounded-s/-e`, `border-s/-e`) — all available. 38-file migration (see PLAN.md). | **Re-verify Tailwind version.** If TW4, logical utilities are native and class names are identical → strategy ports cleanly, but **regenerate the file list** — components diverged in the runes/context migrations, so the 38-file inventory will not match 1:1. |
| **A9** safe-area | Custom tokens in `frontend/tailwind.config.mjs` (`safel/safer/safelgl/safelgr/safemdl/safemdr`, line ≈162) are physical. Add logical `safes/safee` companions; swap ~15 usages. | Same token strategy; re-derive usage sites. |
| **A6** icons/motion | `frontend/src/lib/components/icon/icons.ts` (`next`/`previous`), `Expander.svelte` rotations, `modal/drawer/Drawer.svelte`, `term/Term.svelte` `translateX`. | Same components likely renamed/moved; re-scan for arrow icons, `rotate(`, `translateX`, drawer side. |
| **A7** fonts | `staticSettings.font` (single) consumed at `frontend/src/routes/[[lang=locale]]/+layout.svelte` (≈line 115); fallback chain + `fontFamily` in `tailwind.config.mjs`. Extend to per-locale/secondary font. | Same `staticSettings.font` concept; consumed in the `apps/frontend` root layout — verify injection point. |
| **A5 / A8** content/formatting | Apply `dir="auto"` in the components that render entity/answer/free-text content (`dynamic-components/entityCard`, `entityDetails/*`, `questions/QuestionOpenAnswer`, etc.). | Same components, runes-rewritten — re-locate the content render sites. |
| **backend** locale + translations | **Strapi**: i18n locale create + `backend/vaa-strapi/src/util/translations/ar/dynamic.json` + import in `appCustomization.ts`; frontend `src/lib/i18n/translations/ar/` + `locales` map in `translations/index.ts`. | **Supabase**: locale/translation seeding mechanism differs entirely — the *principle* (register locale + supply translations + carry `dir` metadata) ports; the *mechanism* does not. |

---

## Known gotchas (apply to both lines)

1. **Safe-area insets (A9)** — the #1 silent regression. Logical margin/padding utilities will *not* fix notch padding;
   the `env(...-left/-right)` value itself must be swapped by direction.
2. **DaisyUI v4** mirrors via the root `dir` attribute (it authors with logical props internally) — so most component
   internals flip for free once A4 lands. Verify after the version bump on the way-ahead line.
3. **Do-not-mirror set (A10)** — logos, user photos/portraits, the video/media player chrome, charts, and the political
   compass / map must stay LTR-oriented. Mark them explicitly.
4. **Font FOUT / subsetting** — load the Arabic face with `display: swap` and an explicit `unicode-range` subset so the
   Latin path is unaffected and Arabic doesn't block first paint.
5. **`dir` vs `lang` are independent** — keep setting `lang` (screen-reader pronunciation, hyphenation); `dir` is the
   layout axis. Both come from the locale but are not the same attribute.
6. **Tailwind version is the biggest porting variable** — confirm it before estimating the way-ahead CSS migration.

---

## Deferred / out of scope (both lines)

- LLM prompt-language support for Arabic (`packages/llm` `SUPPORTED_PROMPT_LANGUAGES`) — register only if/when AI
  features ship in Arabic.
- Arabic mock-data generation (Faker `ar` locale) — dev-only convenience, not required to ship.
- Full human translation of all keys — infrastructure + registration is in scope; translation *content* can be seeded
  partially / machine-assisted and completed separately.
