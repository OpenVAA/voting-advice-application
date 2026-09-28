# Phase 124: Svelte 5 Idiom Polish — Lock-in & Visual Verification - Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 6 (1 new test, 1 new report, 2 traceability edits, 3 read-for-reference surfaces)
**Analogs found:** 2 / 2 net-new artifacts (both have strong in-repo analogs)

This is a verification + lock-in phase. There is no migration and no new capability. The only net-new code artifact is one small vitest spec; the only net-new doc artifact is one verification report. The three RUNES-04 surface components are **read-for-reference only** (touched solely IF a regression is found, surgically).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (NEW; location is D-01.3 discretion) | test (unit) | transform (in-process lint of string fixtures) | `apps/frontend/src/lib/utils/settings.test.ts` | role-match (pure-logic vitest spec, no jsdom/DB/browser) |
| `124-VISUAL-VERIFICATION.md` (NEW, in phase dir) | report (verification artifact) | request-response (per-surface pass/fail record) | `.planning/milestones/v2.10-phases/91-…/91-VERIFICATION.md` + `123-VERIFICATION.md` | exact (verification-report-as-deliverable convention) |
| `.planning/REQUIREMENTS.md` (EDIT lines 169–170) | config (traceability) | transform (status flip) | n/a — in-place edit of two table rows | n/a |
| `apps/frontend/src/routes/Header.svelte` | component | request-response (SSR + hydrate) | self — fix only if regressed; pattern from RESEARCH §Code Examples | read-for-reference |
| `apps/frontend/src/routes/Banner.svelte` | component | request-response (client reactive) | self — fix only if regressed | read-for-reference |
| `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` | component | request-response (client + auth-gated) | self — fix only if regressed | read-for-reference |

## Pattern Assignments

### `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (test, transform)

**Analog:** `apps/frontend/src/lib/utils/settings.test.ts` (closest non-Svelte, pure-logic vitest spec — no `.svelte.test.ts` jsdom harness, no DB, no browser; same plain-unit idiom the guard self-test needs)

**Imports pattern** (from `settings.test.ts:1`):
```ts
import { describe, expect, it } from 'vitest';
import { mergeAppSettings, mergeInitialAppSettings } from './settings';
```
The repo idiom: named `{ describe, expect, it }` import from `'vitest'` (NOT `vi`/`test` unless needed); relative imports; a top-of-file doc comment stating WHAT historical bug / contract the test pins. The guard spec should add `import path from 'node:path'` and `import { ESLint } from 'eslint'` to this base.

**Describe/it structure** (from `settings.test.ts:18-32`):
```ts
describe('mergeAppSettings', () => {
  it('returns a new object equal to { ...target, ...nonNull(additional) }', () => {
    // arrange → act → assert
    expect(result).toEqual({ ... });
  });
  it('does not mutate the target object (no shared-ref mutation)', () => {
    ...
  });
});
```
Idiom: one `describe` per unit-under-test; positive and negative controls as separate `it` blocks. Maps directly to the guard self-test's positive-control (`it('fires no-restricted-imports …')`) + negative-control (`it('stays silent on a clean rune file …')`) pair.

**Top-of-file rationale comment** (from `settings.test.ts:4-17`): a JSDoc block explaining the historical bug + the contract being pinned + a traceability tag (`CTX-01 / D-05, Pattern 8`). The guard spec should carry an analogous block citing **RUNES-03 / D-01.3** and the Phase 115 SWEEP-03 lock-in rationale.

**Core pattern — the ESLint Node API self-test** (proven-live source, RESEARCH §Code Examples lines 197–224 — copy this verbatim as the spec body):
```ts
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] }); // MUST pass this flag

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

**Critical correctness invariants (from RESEARCH Pitfalls 1–2):**
- `probePath` MUST resolve under the frontend `src/` tree (use `path.resolve(__dirname, …)` with the spec living in `src/**`) or `no-restricted-imports` never applies → false PASS.
- The `new ESLint({ flags: ['v10_config_lookup_from_file'] })` flag is mandatory — it matches the repo's `lint` script and loads the real `apps/frontend/eslint.config.mjs`. Omitting it risks config-resolution drift.
- Filter `result.messages` by `ruleId === 'no-restricted-imports'` — the positive fixture also trips an unrelated `import/newline-after-import` rule (errorCount 2), so a raw `errorCount` assertion is fragile.

**No error handling / no async DB** — pure in-process lint; this is exactly why `settings.test.ts` (no jsdom) is the right analog rather than a `.svelte.test.ts` context spec.

---

### `124-VISUAL-VERIFICATION.md` (report, request-response)

**Analog:** `.planning/phases/123-svelte-5-idiom-polish-lifecycle-reactive-state/123-VERIFICATION.md` (sibling phase, same workstream, same gate convention) + `.planning/milestones/v2.10-phases/91-…/91-VERIFICATION.md` (the prior visual/perf verification — closest for the per-surface screenshot/pass-fail idiom).

**Frontmatter + header pattern** (from `123-VERIFICATION.md:1-15`):
```markdown
---
phase: 124-svelte-5-idiom-polish-lock-in-visual-verification
verified: 2026-06-18T…Z
status: passed
score: 3/3 surfaces verified
overrides_applied: 0
---

# Phase 124: … Visual Verification Report

**Phase Goal:** …
**Verified:** 2026-06-18
**Status:** PASSED
```

**Per-item pass/fail table** (from `123-VERIFICATION.md` "Observable Truths" + `91-VERIFICATION.md` "Observable Truths" lines 87–118):
```markdown
| # | Truth / Surface | Status | Evidence |
|---|-----------------|--------|----------|
| 1 | App header — light + dark, voter + candidate | ✓ VERIFIED | screenshot link + reactive-accessor read confirmed |
| 2 | Banner / hero image — key routes, default + en | ✓ VERIFIED | … |
| 3 | Post-login candidate nav — desktop + mobile spot-check | ✓ VERIFIED | … |
```
Idiom from both analogs: `✓ VERIFIED` / `✗ FAILED` / `⚠ PARTIAL` status glyphs; an Evidence column citing concrete artifacts (screenshot path, source line, commit). Per D-06 the matrix rows are the three named surfaces with the light/dark · voter/candidate · locale · viewport sub-dimensions recorded.

**Env-used block** — record the exact stack that produced the evidence (per D-07): `yarn dev` on :5173, `e2e/base` seed, Mailpit `:54324` register-via-email login, devtools `prefers-color-scheme` emulation for dark mode. The `91-VERIFICATION.md` "In-Process Gates — Results" table (lines 65–81) is the structural model for a command→expected→actual→PASS grid if any commands are recorded.

**Screenshot storage** (RESEARCH Open Question 1): commit PNGs under the phase dir (e.g. a `124-screenshots/` subdir) or embed as relative links — keeps evidence auditable in-repo. Planner's discretion per D-07.

**Acceptance-gate section** (from `123-VERIFICATION.md` "Required Artifacts" + the D-08 gate): record `yarn lint:check` clean, guard self-test passing, all-three-surfaces pass, and the build/unit/E2E trust signal (a "did-not-run" E2E counts as a failure). Sibling `123-ACCEPTANCE.md` recorded all four gates (build / unit / svelte-check / E2E) — mirror that four-gate evidence shape.

---

### `.planning/REQUIREMENTS.md` (config — traceability flip, lines 169–170)

In-place edit only. Flip RUNES-03 status to **met-by-Phase-115-SWEEP-03** (citing the `eslint.config.mjs:77–84` comment) and RUNES-04 to verified-by-`124-VISUAL-VERIFICATION.md`. No analog needed — match the existing table-row format already present at lines 169–170.

---

### Read-for-reference surfaces (fix ONLY if a regression is found — D-05)

These three components currently use the CORRECT reactive-accessor patterns (RESEARCH confirms). They are NOT edited unless the manual pass surfaces a real regression, in which case the fix is surgical and in its own atomic commit. The correct pattern below is the executor's reference for any fix.

**`Header.svelte` — correct read pattern** (RESEARCH §Code Examples, source lines ~38–46):
```ts
const ctx = getAppContext();
const { darkMode, t } = ctx;                    // stable handles — destructure OK
const appSettings = $derived(ctx.appSettings);  // reactive accessor — read via ctx.X
const bgColor = $derived.by(() => {
  const mode = darkMode.current ? appSettings.headerStyle.dark : appSettings.headerStyle.light;
  return topBarSettings.current.imageSrc ? mode.overImgBgColor : mode.bgColor;
});
```

**`CandidateNav.svelte` — correct read pattern** (RESEARCH §Code Examples, source lines ~34–37, 42, 58–63, 85):
```ts
const candCtx = getCandidateContext();
const { getRoute, openFeedbackModal, t } = candCtx;  // stable — destructure OK
const appSettings = $derived(candCtx.appSettings);   // reactive accessor — read via candCtx.X
// gating + badges read reactive accessors via candCtx.X (never destructured):
//   candCtx.isAuthenticated, candCtx.unansweredRequiredInfoQuestions,
//   candCtx.unansweredOpinionQuestions, candCtx.answersLocked
```

**`Banner.svelte`** — client-reactive hero/banner buttons + the header `--image` background; resolves locale-derived asset paths. Confirm image loads/renders; no destructure-trap surface identified.

**Regression signature to watch (and the anti-pattern any fix must NOT introduce):** a reactive accessor captured via destructuring — `const { isAuthenticated } = candCtx` — freezes at the initial empty/false snapshot (the Phase 61 destructure-trap). Any in-phase fix MUST read reactive accessors via `ctx.X` / `candCtx.X` per the CLAUDE.md Context Destructuring Rule.

## Shared Patterns

### Vitest pure-logic spec idiom
**Source:** `apps/frontend/src/lib/utils/settings.test.ts`
**Apply to:** the new guard self-test
```ts
import { describe, expect, it } from 'vitest';
// top-of-file JSDoc: WHAT bug/contract is pinned + traceability tag (e.g. RUNES-03 / D-01.3)
describe('<unit>', () => {
  it('<positive control>', () => { expect(...).to...; });
  it('<negative control>', () => { expect(...).to...; });
});
```
Prefer this plain `.test.ts` (no jsdom) idiom over the `.svelte.test.ts` `$effect.root`/`flushSync` context-harness idiom — the guard self-test has no Svelte reactivity to exercise.

### Verification-report-as-deliverable
**Source:** `123-VERIFICATION.md` (frontmatter + Observable-Truths table) + `91-VERIFICATION.md` (per-surface visual pass/fail + in-process-gates grid)
**Apply to:** `124-VISUAL-VERIFICATION.md`
- YAML frontmatter (`phase`, `verified`, `status`, `score`, `overrides_applied`)
- Per-surface `| # | Truth | Status (✓/✗/⚠) | Evidence |` table
- An env-used block and a D-08 acceptance-gate section recording lint / self-test / 3-surface / build-unit-E2E results.

### Reactive-accessor read pattern (for any in-phase regression fix)
**Source:** CLAUDE.md "Context Destructuring Rule (Svelte 5)"; canonical analog `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-79`
**Apply to:** Header / Banner / CandidateNav — only if a fix is needed
Stable handles (`t`, `getRoute`, `darkMode`) may be destructured; reactive accessors (`appSettings`, `isAuthenticated`, the `unanswered*` arrays, `answersLocked`) MUST be read via `ctx.X` / `$derived(ctx.X)`; `dataRoot` props read DIRECTLY in the consuming tracking scope (`#version`-bridge hole).

## No Analog Found

None. Both net-new artifacts have strong in-repo analogs (a pure-logic vitest spec and the verification-report convention). The traceability edit is an in-place modification with no analog needed.

## Do-Not-Modify (read-for-reference only)

| File | Reason |
|------|--------|
| `apps/frontend/eslint.config.mjs` | Guard already correct + app-wide (Phase 115 SWEEP-03); D-01/D-02 forbid editing. The self-test is a SEPARATE vitest spec precisely so this file stays untouched, side-stepping the flat-config REPLACE-not-merge trap (RESEARCH Pitfall 3). |
| `packages/shared-config/eslint.config.mjs` | Source of the inherited deep-relative-`lib` `patterns` ban; read-only context for the REPLACE-not-merge invariant. |
| `Header.svelte` / `Banner.svelte` / `CandidateNav.svelte` | Touched ONLY on a found regression (D-05), surgically, in their own commit. |

## Metadata

**Analog search scope:** `apps/frontend/src/**/*.{test,spec}.ts`, `.planning/**` for VERIFICATION/VISUAL artifacts.
**Files scanned:** ~58 frontend specs (enumerated), ~20 prior verification reports.
**Pattern extraction date:** 2026-06-18
