# Phase 124: Svelte 5 Idiom Polish — Lock-in & Visual Verification - Research

**Researched:** 2026-06-18
**Domain:** ESLint flat-config guard self-testing (Node API) + manual post-migration visual verification of three reactive-accessor surfaces
**Confidence:** HIGH

## Summary

Phase 124 is a verification + lock-in phase with two deliverables and **zero migration work**. CONTEXT.md (D-01..D-08) already locks every decision; this research surfaces the concrete *how* for the two open mechanics, both of which were verified live against the working tree during this session.

**RUNES-03 (guard self-test):** The `svelte/store` `no-restricted-imports` guard already covers `src/**/*.{ts,svelte}` (Phase 115 SWEEP-03) and currently reports **zero** `svelte/store` imports in `apps/frontend/src` (verified: `grep` returns nothing). The lightest provable self-test is a **vitest unit test that drives ESLint's Node API** (`new ESLint({ flags: ['v10_config_lookup_from_file'] }).lintText(...)`) against an in-memory fixture string. This was proven live: a fixture `import { writable } from 'svelte/store'` filed under `src/__probe__.ts` produces a `no-restricted-imports` error (errorCount ≥ 1), while a clean `$state` fixture produces zero. This adds **no net-new infra** — it slots into the existing `apps/frontend` vitest suite (58 test files already present) and runs in the existing `yarn test:unit` / `yarn lint:check` gate. It is non-flaky because it is a pure in-process lint of a string literal (no DB, no browser, no network).

**RUNES-04 (visual pass):** A manual documented pass over three surfaces — `Header.svelte` (app-header), `Banner.svelte` (hero/banner buttons + the header `--image` background), and `CandidateNav.svelte` (post-login candidate nav, the Phase 61 destructure-trap origin). All three were inspected and currently use the **correct** reactive-accessor read patterns per the CLAUDE.md Context Destructuring Rule, so the expected outcome is "no regression." The pass needs a running dev server (`yarn dev`), a seeded DB, and a logged-in candidate. Dark mode is driven by `prefers-color-scheme` matchMedia (no in-app toggle) — it must be switched via OS/devtools emulation. Evidence goes into `124-VISUAL-VERIFICATION.md`.

**Primary recommendation:** Two atomic commits. (1) RUNES-03: add `eslint.config.mjs` is untouched; add one vitest spec (`apps/frontend/src/lib/.../eslint-store-guard.test.ts`) that asserts the guard fires on a `svelte/store` fixture and stays silent on a clean fixture, plus flip RUNES-03 status to met-by-Phase-115 with a citation. (2) RUNES-04: run the manual pass, write `124-VISUAL-VERIFICATION.md` with per-surface pass/fail + screenshots; fix any small regression surgically in its own commit.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Confirm + permanent self-test (NOT re-widen).** Glob already covers `src/**/*.{ts,svelte}` (Phase 115 SWEEP-03); `yarn lint:check` already reports zero `svelte/store` imports. RUNES-03 deliverable = (1) run `yarn lint:check` and assert zero violations; (2) document RUNES-03 as already-met by Phase 115 SWEEP-03 + flip requirement/traceability status citing the eslint.config.mjs comment; (3) add a permanent guard regression self-test proving the guard fires. Exact mechanism is Claude's discretion (lightest approach in the existing test/lint gate).
- **D-02 — Do NOT broaden the guard's semantics or glob.** No banning of `get()`/`subscribe()`/`Readable`/`Writable`/`$store` auto-subscription; do not close the generated-`.js` glob gap. Keep RUNES-03 to confirm + self-test.
- **D-03 — Method: manual documented pass (NOT pixel snapshots).** Drive the running app, visually confirm three surfaces, capture screenshots, write a report. One-time pass — no permanent pixel-snapshot test. (`toHaveScreenshot()` flake collides with the cardinal no-flaky-E2E rule.)
- **D-04 — Reference: correctness smoke (present-and-correct), NOT a historical pixel diff.** "Regression" = "broken/stale," not "pixel-changed." No pre-migration git-ref screenshot diff required.
- **D-05 — On a found regression: fix in-phase** (its own atomic commit + re-verify). Guardrail: if a regression is large/architectural (not a stale Tailwind class or a lost reactive binding), flag for an operator scope decision rather than ballooning the phase.
- **D-06 — Verification scope matrix (sensible default; planner may refine):** App header — light AND dark, voter app AND candidate app. Banner/hero images — key routes that show them, default locale + spot-check one other locale (e.g. `en`). Post-login candidate nav — log in as candidate, walk protected-route nav (menu, state, logout); desktop primary + mobile-viewport spot-check.
- **D-07 — Evidence artifact.** Committed verification report (e.g. `124-VISUAL-VERIFICATION.md`) recording per-surface pass/fail, env used, screenshots/links. Filename/format is Claude's discretion.
- **D-08 — Gate = `yarn lint:check` clean (RUNES-03) + the guard self-test passing + the RUNES-04 report showing all three surfaces pass + the standard build/unit/E2E trust signal per the cardinal rule.** "Did-not-run" E2E counts as a failure.

### Claude's Discretion
- The exact mechanism of the RUNES-03 guard self-test (D-01.3).
- The verification-report filename, format, and screenshot storage (D-07).
- Per-surface depth within the D-06 matrix (exact routes/locales/viewports beyond minimums).
- Commit granularity (prefer atomic: RUNES-03 lock-in separate from any RUNES-04 fix).

### Deferred Ideas (OUT OF SCOPE)
- None raised that belong to other phases. Discussion stayed within verification/lock-in scope.
- Reviewed-but-not-folded todos (feature work / other-phase scope): generalize-candidate-app-to-party-app, investigate-migrating-candidate-answer-store, the three 2026-05-31 new-feature builds (Phase 129), resolve-all-svelte-check-errors (Phases 125–128/132), fix-view-transition-flicker-in-results-section (separate follow-up; NOT one of the 3 named RUNES-04 surfaces), and three unrelated UI/arch follow-ups.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RUNES-03 | `svelte/store` ESLint guard extended to entire `apps/frontend/src/**` tree (lock-in against regressions). | Glob already `src/**/*.{ts,svelte}` (eslint.config.mjs:86, Phase 115 SWEEP-03 comment lines 77–84). Zero `svelte/store` imports verified live. Self-test mechanism proven: `ESLint.lintText` Node API fires `no-restricted-imports` on a fixture (see Code Examples). Slots into existing `apps/frontend` vitest suite. |
| RUNES-04 | Post-runes visual verification confirms no regressions in app-header styling, banner images, post-login candidate navigation. | Three surface files inspected (`Header.svelte`, `Banner.svelte`, `CandidateNav.svelte`) — all use correct reactive-accessor read patterns. Env + login path + dark-mode toggle + route map documented below. Report = `124-VISUAL-VERIFICATION.md`. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `svelte/store` import ban + self-test | Build/lint tooling (ESLint flat config) | Frontend unit-test runner (vitest) | The guard is a lint rule; proving it fires is a pure in-process Node-API assertion — no runtime tier involved. |
| App-header rendering | Frontend Server (SSR) + Browser (hydration) | — | `Header.svelte` is SSR-rendered then hydrated; reads `appSettings` (reactive accessor) + `darkMode.current` (stable handle) + `topBarSettings.current`. |
| Banner / hero image | Browser (client) | CDN/static (asset URLs) | `Hero.svelte` / header `--image` background resolve locale-derived asset paths; rendering is client-side reactive. |
| Post-login candidate nav | Browser (client) + API (auth/session) | — | `CandidateNav.svelte` reads `candidateContext` reactive accessors gated on `candCtx.isAuthenticated`; session comes from the Supabase auth cookie set by the API tier. |

## Standard Stack

This phase installs **no new packages**. It uses already-installed tooling, verified live against the working tree.

### Core
| Tool | Version (installed) | Purpose | Why Standard |
|------|---------------------|---------|--------------|
| `eslint` | **9.39.2** [VERIFIED: node_modules/eslint/package.json] | Flat-config lint engine + `ESLint` Node API class for the self-test | Already the repo's lint engine; the `ESLint.lintText()` programmatic API is the documented way to lint in-memory code. |
| `eslint-plugin-svelte` | **3.13.1** [VERIFIED: node_modules/eslint-plugin-svelte/package.json] | Svelte lint rules (the guard host) | Already configured via `plugin:svelte/prettier` extends. |
| `vitest` | **3.2.4** [VERIFIED: node_modules/vitest/package.json] | Frontend unit-test runner for the guard self-test | 58 test files already in `apps/frontend/src`; `yarn test:unit` = `vitest run`. |
| `svelte-eslint-parser` | `^1.6.0` [CITED: apps/frontend/package.json] | Parses `.svelte` files for ESLint | Already a frontend devDependency. |

### Supporting (RUNES-04 env, already present)
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `yarn dev` | Full stack (Supabase + watcher + Vite on :5173) | Bring the app up for the manual visual pass. |
| `yarn db:reset` + `yarn db:seed --template e2e/base` | Seed a DB with the registerable candidate (`unregistered-aa@test.openvaa.local`) | Provides the post-login candidate-nav walk subject. |
| Mailpit (`http://127.0.0.1:54324`) | Catches the candidate registration/invite email | Complete the register→login flow to reach the protected candidate nav. |
| Browser devtools `prefers-color-scheme` emulation | Toggle dark mode (no in-app toggle exists) | Capture the light vs. dark header screenshots. |

**Installation:** None. (No `npm install` / `yarn add`.)

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** All tooling (`eslint` 9.39.2, `vitest` 3.2.4, `eslint-plugin-svelte` 3.13.1) is already in the lockfile and was verified present in `node_modules` this session.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
RUNES-03 self-test (in-process, no runtime):

  vitest spec (apps/frontend/src/.../eslint-store-guard.test.ts)
        │
        ├─ import { ESLint } from 'eslint'
        │
        ├─ new ESLint({ flags: ['v10_config_lookup_from_file'] })   ← MUST pass this flag (matches package.json lint script)
        │       │  loads apps/frontend/eslint.config.mjs (flat config)
        │       ▼
        ├─ eslint.lintText("import { writable } from 'svelte/store' …",
        │                  { filePath: <abs>/src/__probe__.ts })    ← filePath MUST match src/**/*.{ts,svelte} glob
        │       ▼
        │   results[0].messages → expect a no-restricted-imports error  (errorCount ≥ 1)   POSITIVE control
        │
        └─ eslint.lintText("export const x = $state(0);",
                           { filePath: <abs>/src/__probe_clean__.ts })
                ▼
            results[0].messages.filter(no-restricted-imports) → expect length 0           NEGATIVE control


RUNES-04 manual pass (running stack):

  yarn db:reset → yarn db:seed --template e2e/base → yarn dev (:5173)
        │
        ├─ Voter app routes  ──► Layout.svelte → Header.svelte (+ Banner.svelte) ──► screenshot (light + dark)
        │                                            └─ Hero.svelte on (voters)/intro, (voters)/+page
        │
        └─ Candidate app: /candidate/register (email link via Mailpit :54324) → set password → login
                 │
                 ▼
            protected candidate routes ──► CandidateNav.svelte (candCtx.isAuthenticated === true)
                 └─ walk: Home / Profile / Questions / Preview / Settings / Help / Privacy / Logout
                 └─ desktop primary + mobile-viewport spot-check ──► screenshots
```

### Recommended File Touch (minimal)
```
apps/frontend/
├── eslint.config.mjs                       # UNCHANGED (guard already correct — D-01/D-02)
└── src/lib/<test-home>/eslint-store-guard.test.ts   # NEW: the RUNES-03 self-test (one small spec)
.planning/phases/124-…/
└── 124-VISUAL-VERIFICATION.md              # NEW: RUNES-04 evidence artifact (D-07)
.planning/REQUIREMENTS.md                   # EDIT: flip RUNES-03/04 traceability status (lines 169–170)
```

Suggested self-test home: alongside existing context/lint-adjacent specs, e.g. `apps/frontend/src/lib/contexts/` already holds many `.test.ts`. A neutral `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (or co-located in an existing utils test dir) keeps it discoverable. Planner's discretion (D-01.3).

### Pattern 1: ESLint Node API in-process self-test (RUNES-03)
**What:** A vitest spec that loads the real flat config and lints two fixture strings — one violating, one clean — asserting the guard fires on the former and is silent on the latter.
**When to use:** This is the chosen RUNES-03 self-test. It is non-flaky (no DB/browser/network), runs in the existing `yarn test:unit` gate, and proves the lock-in is *provable, not merely present*.
**Example:** see Code Examples below (proven live this session).

### Pattern 2: Manual present-and-correct visual smoke (RUNES-04)
**What:** Drive the running app, confirm each of the three surfaces renders correctly (not pixel-identical), capture screenshots, record per-surface pass/fail.
**When to use:** This is the chosen RUNES-04 method (D-03/D-04). "Regression" means broken/stale (lost reactive binding, stale Tailwind class, missing image), not pixel-changed.

### Anti-Patterns to Avoid
- **Pixel-snapshot baselines (`toHaveScreenshot()`):** Explicitly rejected (D-03) — net-new infra + pixel-diff flake collides with the cardinal no-flaky-E2E rule.
- **Re-widening the guard glob or broadening its semantics:** Explicitly rejected (D-02). The glob is already `src/**/*.{ts,svelte}`; do not touch it.
- **Editing the `no-restricted-imports` block without re-including the deep-relative-`lib` `patterns` ban:** Flat config REPLACES (does not merge) the inherited array for in-scope files. The frontend block re-includes the `^(\.\./){2,}lib(/|$)` regex ban verbatim (eslint.config.mjs:98–103) precisely because dropping it would silently disable that rule for `src/**`. If the self-test lives inside `eslint.config.mjs` (it should NOT — keep it in a vitest spec), this trap applies. Since the chosen mechanism is a separate vitest spec, **leave `eslint.config.mjs` untouched** and the trap never fires.
- **Destructuring reactive context accessors in any in-phase regression fix:** If a RUNES-04 fix touches one of the surface components, read reactive accessors via `ctx.X` / `candCtx.X` (never destructure) per the CLAUDE.md Context Destructuring Rule — destructuring is the exact Phase 61 trap that motivates the candidate-nav surface.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Proving the lint guard fires | A custom subprocess that shells out to `eslint` and greps stdout | `ESLint` Node API (`new ESLint(...).lintText()`) inside a vitest spec | The Node API returns structured `messages[]` with `ruleId` — assertable directly, no string parsing, no subprocess flake, runs in the existing test runner. Proven live this session. |
| Loading the flat config in the test | Re-declaring the rule config in the test | `ESLint({ flags: ['v10_config_lookup_from_file'] })` with a `filePath` under `src/` | Loads the **real** `eslint.config.mjs` so the test exercises the actual shipped guard, not a copy that can drift. The flag matches the repo's `lint` script exactly. |
| Dark-mode toggle for screenshots | Adding a UI toggle or stubbing `darkMode` | Browser devtools `prefers-color-scheme` emulation (or OS setting) | `DarkMode` is matchMedia-driven (`window.matchMedia('(prefers-color-scheme: dark)')`, darkMode.svelte.ts) with no in-app setter — emulation is the only correct trigger. |
| Logged-in candidate for the nav walk | Hand-crafting a Supabase auth row | `e2e/base` seed + register-via-email through Mailpit, OR reuse the existing `candidate-journey` registration flow constants | The seed + Mailpit path is the project's established way to obtain a registered candidate; `tests/tests/utils/candidateJourneyConstants.ts` documents the exact email/password/flow. |

**Key insight:** Everything this phase needs already exists in the repo's tooling. The only net-new artifacts are one small vitest spec and one markdown report.

## Common Pitfalls

### Pitfall 1: Self-test fixture filePath outside the guard glob
**What goes wrong:** `ESLint.lintText` is given a `filePath` that does not match `src/**/*.{ts,svelte}`, so `no-restricted-imports` never applies and the test gives a false PASS (or false FAIL).
**Why it happens:** The guard config is scoped to `files: ['src/**/*.{ts,svelte}']`. Linting a string with `filePath: 'foo.ts'` (no `src/` prefix) skips the rule.
**How to avoid:** Use an absolute path under the frontend `src/` dir, e.g. `path.resolve(__dirname, '__store_guard_probe__.ts')` where `__dirname` is inside `src/`. Verified live: a `src/`-rooted probe path produces the `no-restricted-imports` error.
**Warning signs:** errorCount is 0 on the violating fixture, or the only messages are unrelated rules.

### Pitfall 2: Missing the `v10_config_lookup_from_file` flag
**What goes wrong:** ESLint may resolve a different (or no) config than the repo's `lint` script uses, causing the self-test to disagree with `yarn lint:check`.
**Why it happens:** The repo's `lint` scripts pass `--flag v10_config_lookup_from_file` everywhere (frontend `lint`, root `lint:check`). Omitting it in the Node API call risks config-resolution drift.
**How to avoid:** Construct with `new ESLint({ flags: ['v10_config_lookup_from_file'] })`. (Confirmed working live.)
**Warning signs:** Self-test PASS but `yarn lint:check` behaves differently, or config-not-found errors.

### Pitfall 3: Flat-config REPLACE-not-merge on the `no-restricted-imports` array
**What goes wrong:** If anyone edits the frontend `no-restricted-imports` block and drops the re-included deep-relative-`lib` `patterns` ban, that rule silently stops applying to `src/**` (the frontend block replaces, not merges, the inherited array from `shared-config/eslint.config.mjs:144–153`).
**Why it happens:** ESLint flat config last-match-wins per rule key; an in-scope `files` block's `no-restricted-imports` fully overrides the inherited one.
**How to avoid:** Do not edit `eslint.config.mjs` at all this phase (D-02). The chosen self-test is a separate vitest spec. If a future need forces an edit, keep both the `svelte/store` `paths` ban AND the `^(\.\./){2,}lib(/|$)` `patterns` ban (lines 92–104).
**Warning signs:** A deep `../../lib` import lints clean after a guard edit.

### Pitfall 4: No registered candidate against the base dataset
**What goes wrong:** Logging in as a candidate fails because the dataset has no registered candidate row.
**Why it happens:** Per `tests/tests/utils/testCredentials.ts`, the `e2e/base` dataset seeds the *unregistered* candidate (`test-e2e-base-ca-aa-unregistered`, email `unregistered-aa@test.openvaa.local`) with **no** pre-registered auth user, and the candidates table has no email column. You must complete the register-via-email flow (invite email → set password → login) to reach the protected nav.
**How to avoid:** Use the `e2e/base` template and walk the registration flow via Mailpit (`:54324`), using the documented constants (`UNREGISTERED_CANDIDATE_EMAIL`, `PASSWORD_1`). Alternatively the `default` template's candidates also have no email column — `e2e/base` + its documented flow is the cleaner path.
**Warning signs:** Login form rejects credentials; no candidate row with an auth user.

### Pitfall 5: Mistaking matchMedia dark mode for an in-app toggle
**What goes wrong:** Tester looks for a dark-mode button in the UI and concludes dark mode is broken.
**Why it happens:** `DarkMode` reads `prefers-color-scheme` from `window.matchMedia` and listens for OS changes — there is intentionally no in-app toggle (darkMode.svelte.ts).
**How to avoid:** Toggle via browser devtools Rendering → "Emulate CSS prefers-color-scheme: dark", or the OS appearance setting. Both `Header.svelte` (`darkMode.current ? headerStyle.dark : headerStyle.light`) and theme classes respond.
**Warning signs:** Header colors don't change when clicking around the UI (expected — there's no button).

## Code Examples

### RUNES-03 guard self-test (proven live this session)
```ts
// Source: verified live against apps/frontend with ESLint 9.39.2 (this session)
// Lives in: apps/frontend/src/<test-home>/eslint-store-guard.test.ts (vitest)
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] });

// filePath MUST be under src/ so the `files: ['src/**/*.{ts,svelte}']` guard applies.
const probePath = path.resolve(__dirname, '__store_guard_probe__.ts');

describe('svelte/store ESLint guard (RUNES-03 lock-in)', () => {
  it('fires no-restricted-imports on a svelte/store import (positive control)', async () => {
    const [result] = await eslint.lintText(
      "import { writable } from 'svelte/store';\nexport const x = writable(0);\n",
      { filePath: probePath }
    );
    const restricted = result.messages.filter((m) => m.ruleId === 'no-restricted-imports');
    expect(restricted.length).toBeGreaterThan(0);
  });

  it('stays silent on a clean rune file (negative control)', async () => {
    const [result] = await eslint.lintText('export const x = $state(0);\n', { filePath: probePath });
    const restricted = result.messages.filter((m) => m.ruleId === 'no-restricted-imports');
    expect(restricted.length).toBe(0);
  });
});
```
Live observation: the positive fixture returned `no-restricted-imports` (message `'svelte/store' import is restricted from being used…`) with `errorCount: 2` (the second being an unrelated `import/newline-after-import` formatting rule — filter by `ruleId` to isolate the guard, as above). The negative fixture returned `no-restricted-imports count: 0`.

### RUNES-04 — current correct reactive-accessor patterns (what "no regression" looks like)
```ts
// Header.svelte (lines 38–46): app-header surface — CORRECT
const ctx = getAppContext();
const { darkMode, t } = ctx;                 // stable handles — destructure OK
const appSettings = $derived(ctx.appSettings); // reactive accessor — read via ctx.X
const bgColor = $derived.by(() => {
  const mode = darkMode.current ? appSettings.headerStyle.dark : appSettings.headerStyle.light;
  return topBarSettings.current.imageSrc ? mode.overImgBgColor : mode.bgColor;
});
```
```ts
// CandidateNav.svelte (lines 34–37, 42, 58–63, 85): post-login nav — CORRECT
const candCtx = getCandidateContext();
const { getRoute, openFeedbackModal, t } = candCtx;   // stable — destructure OK
const appSettings = $derived(candCtx.appSettings);    // reactive accessor — read via candCtx.X
// gating + badges read reactive accessors via candCtx.X (never destructured):
//   candCtx.isAuthenticated, candCtx.unansweredRequiredInfoQuestions,
//   candCtx.unansweredOpinionQuestions, candCtx.answersLocked
```
**Regression signature to watch for:** any of these reactive accessors captured via destructuring (`const { isAuthenticated } = candCtx`) would freeze at the initial empty/false snapshot — nav items would fail to appear/update after the candidate context populates post-login. Current code does NOT do this; the pass confirms it stays that way.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `svelte/store` writable/derived bridges | `$state`/`$derived` rune handles exposing `current` | v2.13 Phases 113–117 (store→runes), Phase 123 (idiom polish) | The three RUNES-04 surfaces now consume reactive accessors; this phase confirms they render correctly. |
| Guard scoped to `lib/contexts/**` + `routes/**` only (v2.11 Phase 98) | Guard glob `src/**/*.{ts,svelte}` (frontend-wide) | Phase 115 SWEEP-03 | RUNES-03's literal "widen to whole tree" is already satisfied — Phase 124 confirms + self-tests. |

**Deprecated/outdated:**
- `.eslintrc`-style config: the repo is fully on **flat config** (`eslint.config.mjs` + `--flag v10_config_lookup_from_file`). Any self-test must use the flat-config-aware Node API path shown above.

## Runtime State Inventory

**Not applicable.** This is not a rename/refactor/migration phase — it adds one test file and one report, and edits two traceability lines. No stored data, live-service config, OS-registered state, secrets, or build artifacts carry a string that changes. (Verified: RUNES-03 changes no production code; RUNES-04 only fixes a surface regression *if one is found*, surgically.)

## Validation Architecture

> Included — `workflow.nyquist_validation` key is absent from `.planning/config.json` (workflow block present without it), so validation defaults to enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 (frontend unit) + Playwright (E2E trust signal); ESLint 9.39.2 (lint gate) |
| Config file | `apps/frontend/vitest.config.ts` (jsdom env, `$lib`/`$app` aliases); `apps/frontend/eslint.config.mjs` (flat) |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` (vitest run) |
| Full suite command | `yarn lint:check && yarn test:unit && yarn test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RUNES-03 | Guard reports zero `svelte/store` violations across `src/**` | lint | `yarn workspace @openvaa/frontend lint` (expect exit 0) | ✅ (guard present) |
| RUNES-03 | Guard *fires* on a deliberate `svelte/store` import (provable lock-in) | unit | `yarn workspace @openvaa/frontend test:unit` (new `eslint-store-guard.test.ts`) | ❌ Wave 0 — add the spec |
| RUNES-04 | App header renders (light + dark, voter + candidate) | manual | documented pass → `124-VISUAL-VERIFICATION.md` (per-surface pass/fail) | manual-only (D-03) |
| RUNES-04 | Banner/hero image renders (key routes, default + 1 locale) | manual | documented pass → `124-VISUAL-VERIFICATION.md` | manual-only (D-03) |
| RUNES-04 | Post-login candidate nav renders + reactive (desktop + mobile spot-check) | manual | documented pass → `124-VISUAL-VERIFICATION.md` | manual-only (D-03) |

**Manual-only justification (RUNES-04):** D-03 explicitly chose a documented manual pass over pixel snapshots (flake collides with the cardinal no-flaky-E2E rule) and over net-new functional E2E. The report is the auditable artifact; the standard build/unit/E2E suite remains the trust signal per D-08.

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend lint && yarn workspace @openvaa/frontend test:unit` (catches both the guard zero-violation state and the new self-test).
- **Per wave merge:** full `yarn lint:check && yarn test:unit`.
- **Phase gate (D-08):** `yarn lint:check` clean + guard self-test passing + `124-VISUAL-VERIFICATION.md` all-three-surfaces pass + full E2E green (a "did-not-run" E2E = failure).

### Wave 0 Gaps
- [ ] `apps/frontend/src/<test-home>/eslint-store-guard.test.ts` — covers RUNES-03 (guard-fires self-test). The only net-new test file. No framework install needed (vitest already present, 58 specs exist).
- [ ] No new fixtures or `conftest`-equivalent needed — the self-test uses in-memory fixture strings via `ESLint.lintText`.

## Security Domain

> `security_enforcement` key absent from `.planning/config.json` → treated as enabled. This phase, however, makes no auth/session/access-control/crypto/input-handling changes.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase touches no auth code; the candidate login during RUNES-04 only *exercises* the existing Supabase PKCE flow as a tester. |
| V3 Session Management | no | No session code changed. |
| V4 Access Control | no | No access-control changes. |
| V5 Input Validation | no | The self-test lints in-memory string fixtures (trusted, author-controlled); no untrusted input. |
| V6 Cryptography | no | None. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Lint-guard regression (a banned import silently reintroduced) | Tampering (supply-chain hygiene of the rune-only invariant) | The RUNES-03 self-test — proves the guard fires so a future `svelte/store` reintroduction breaks the build, not just lints clean by accident. |

**Net:** No production security surface is modified. The single security-relevant outcome is *hardening the lint invariant itself* via the self-test.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `e2e/base` is the cleanest seed template to obtain a registerable candidate for the post-login walk. | Don't Hand-Roll / Pitfall 4 | Low — if `e2e/base` doesn't suit, the `default` template + manual auth-user creation works; the planner can also reuse the existing `candidate-journey` setup. The login *mechanism* (register-via-email through Mailpit) is documented and verified in repo constants. |
| A2 | Suggested self-test home `apps/frontend/src/lib/_guards/…` (or co-located in an existing test dir). | Architecture Patterns | None functional — exact location is explicitly Claude's discretion (D-01.3); any `src/**`-resolved vitest path works. |

**All other claims** were verified live this session (ESLint version, vitest version, zero `svelte/store` imports, guard-fires behavior, the three surface files' read patterns, dark-mode matchMedia mechanism) or cited directly from in-tree files.

## Open Questions

1. **Exact screenshot storage location for `124-VISUAL-VERIFICATION.md`.**
   - What we know: D-07 leaves filename/format/storage to Claude's discretion; report lives in the phase dir.
   - What's unclear: whether screenshots are committed as files (e.g. a `124-screenshots/` dir) or linked.
   - Recommendation: commit a small set of PNGs under the phase dir (or embed as relative links) — keeps the evidence auditable in-repo without external dependencies. Planner decides depth per D-06.

2. **Which exact voter routes to screenshot for the banner/hero surface.**
   - What we know: Hero appears on `(voters)/+page`, `(voters)/intro`, `(voters)/about`, `(voters)/nominations`, results/questions layouts; the header `--image` prominent background is the other banner expression.
   - What's unclear: the minimal representative set.
   - Recommendation: voter `intro` + voter home (`(voters)/+page`) for the hero, plus any route where `topBarSettings.imageSrc` is set for the prominent header background, in default locale + `en`. Planner refines per D-06.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `eslint` (Node API) | RUNES-03 self-test | ✓ | 9.39.2 | — |
| `vitest` | RUNES-03 self-test runner | ✓ | 3.2.4 | — |
| `eslint-plugin-svelte` | guard host | ✓ | 3.13.1 | — |
| Local Supabase + Vite (`yarn dev`) | RUNES-04 running app | ✓ (per project memory: E2E 95/0 clean via host Vite + local Supabase, no Docker) | — | — |
| Mailpit (`:54324`) | RUNES-04 candidate register-via-email | ✓ (starts with `supabase start`) | — | — |
| `e2e/base` seed template | RUNES-04 registerable candidate | ✓ | — | `default` template + manual auth user |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none material (candidate-login seed path has a documented alternative).

## Sources

### Primary (HIGH confidence)
- `apps/frontend/eslint.config.mjs` (lines 77–107) — the `svelte/store` guard; glob `src/**/*.{ts,svelte}`; the re-included deep-relative-`lib` `patterns` ban; the SWEEP-03 comment.
- `packages/shared-config/eslint.config.mjs` (lines 144–153) — inherited `no-restricted-imports` patterns array (REPLACE-not-merge source).
- Live `ESLint.lintText` probe (this session) — proved positive (guard fires) and negative (clean fixture silent) controls; resolved ESLint 9.39.2 / vitest 3.2.4 / eslint-plugin-svelte 3.13.1 from `node_modules`.
- `apps/frontend/src/routes/Header.svelte`, `Banner.svelte`, `src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` — the three RUNES-04 surfaces; current reactive-accessor read patterns.
- `apps/frontend/src/lib/contexts/component/darkMode.svelte.ts` — matchMedia-driven dark mode (no in-app toggle).
- `apps/frontend/vitest.config.ts` — jsdom env + `$lib`/`$app` aliases for the frontend unit suite.
- `tests/tests/utils/testCredentials.ts`, `tests/tests/utils/candidateJourneyConstants.ts`, `tests/tests/setup/candidate/candidate-journey.setup.ts` — candidate-login seed/flow contract (register-via-email through Mailpit).
- `.planning/phases/124-…/124-CONTEXT.md` — locked decisions D-01..D-08.
- `.planning/REQUIREMENTS.md` (lines 92–93, 169–170) — RUNES-03/04 + traceability.
- `CLAUDE.md` — Context Destructuring Rule (reactive accessors via `ctx.X`); E2E cardinal rule.

### Secondary (MEDIUM confidence)
- Project memory `project_gsd_repo_e2e_runs_clean.md` — the -gsd repo runs E2E clean via host Vite + local Supabase (95/0, no Docker) → RUNES-04 manual pass is feasible without extra infra.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every tool version verified in `node_modules` this session; zero new packages.
- Architecture (self-test mechanism): HIGH — `ESLint.lintText` fire/silent behavior proven live against the real config.
- RUNES-04 surfaces: HIGH — all three files inspected; current read patterns confirmed correct; env/login/dark-mode mechanisms verified in-tree.
- Pitfalls: HIGH — each derived from a verified file fact (glob scope, REPLACE-not-merge comment, matchMedia source, no-email seed contract).

**Research date:** 2026-06-18
**Valid until:** 2026-07-18 (stable — tooling versions pinned; surfaces are post-migration steady-state)
