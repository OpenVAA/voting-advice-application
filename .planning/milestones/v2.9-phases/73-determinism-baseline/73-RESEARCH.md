# Phase 73: Determinism Baseline - Research

**Researched:** 2026-05-10
**Domain:** Playwright suite hardening — skip-modifier sweep, data-loading race investigation, ESLint warning sweep
**Confidence:** HIGH (canonical CONTEXT.md decisions locked; all probed numbers match the registry; rewrite patterns confirmed against rule-author docs and v2.6 P64 precedent)

## Summary

Phase 73 reduces the existing Playwright 1.58.2 suite to a hard pass/fail signal across three workstreams: (a) DETERM-01 — sweep `test.skip(...)` modifiers (only one site remains: `candidate-bank-auth.spec.ts:199`, treated as a legitimate env-gated skip per CONTEXT D-07); (b) DETERM-02 — investigate the parity-script's 36-test race pool (15 DATA_RACE + 21 CASCADE_BASELINE bound to the v2.6 P64 baseline `67p / 1f / 34c` at HEAD `2c7ad2dea`), fix at the test level by default and at the code level only when scoped (≤50 LOC, ≤2 files); (c) DETERM-03 — clear all 103 `playwright/*` ESLint warnings in `tests/` (re-baselined per CONTEXT D-03 from REQUIREMENTS.md's stale "98" figure). Closure = 3 cold `--workers=1` runs produce identical pass/fail sets.

The phase rides on a strong foundation: the v2.6 P64 verification report (`PARITY GATE: PASS`) established the canonical `expect.poll(...).toBeGreaterThan(0)` pattern, the 14-title IMGPROXY_TIED_TITLES list as the binding DATA_RACE classification, the parity-script constants regen workflow (`regen-constants.mjs`), and the cold-start protocol (`yarn dev:reset-with-data && yarn test:e2e --workers=1`). The lint-warning sweep is paired with DETERM-02 because the same `if (...)` and `networkidle` patterns drive both lint warnings and flakiness — rewriting them is a single workstream split across plans by failure-type clustering. The `tests/utils/testIds.ts` central registry is mature (350+ usages already) and provides a clean target for `no-raw-locators` rewrites; existing `getByTestId` / `getByRole` patterns are well-established.

**Primary recommendation:** Follow CONTEXT.md D-04 plan order strictly — Plan 1 (inventory) → Plan 2 (mechanical sweep: no-networkidle 6 + no-raw-locators 37) → Plans 3–5 (per-spec investigative passes clustered by failure type, paired DETERM-02 + DETERM-03 rewrites: `no-conditional-in-test` 36 + `no-conditional-expect` 18) → Plan 6 (parity-gate regen + 3-run smoke). Restore `diff-playwright-reports.ts` from git blob `2832c4410` (the last-known-good 466-LOC script) at the start of Plan 6, regenerate constants via `regen-constants.mjs`, run the canonical `--workers=1 --reporter=json` capture, write `73-VERIFICATION.md` modeled on `64-VERIFICATION.md`. Default to `expect.poll(...).toBeGreaterThan(0)` (P64 pattern) for race-tolerant assertions; default to `getByTestId(testIds.X)` for raw-locator rewrites since the registry is mature; default to splitting tests for `no-conditional-in-test` rewrites where each branch represents a distinct contract.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Skip-modifier sweep (DETERM-01) | **E2E test layer** (`tests/tests/specs/`) | — | Test bodies own the skip decision; CONTEXT D-07 fixes the only remaining site at the test layer with inline ESLint disable + rationale |
| Race investigation — test-level fix (DETERM-02 default) | **E2E test layer** (`tests/tests/specs/`) + **fixtures** (`tests/tests/fixtures/`) | **dev-seed** (`packages/dev-seed/`) only if a deterministic seed prerequisite is needed | CONTEXT D-06: test-level fix preferred (proper `waitFor`, `expect.poll`, removing `if (...)` masks). Fixtures own setup-determinism for the answered-voter happy path. |
| Race investigation — code-level fix (DETERM-02 escalation) | **Frontend** (`apps/frontend/src/lib/contexts/`, `apps/frontend/src/lib/components/`) | **filters / app-shared** if root cause sits there | CONTEXT D-05: ≤50 LOC, ≤2 files. Code-level fixes most likely surface in Svelte 5 reactivity edges (CLAUDE.md Context Destructuring Rule). |
| Lint warning sweep (DETERM-03) | **E2E test layer** (`tests/tests/specs/`, `tests/tests/utils/`) | **eslint config** (`tests/eslint.config.mjs`) for the final lint-gate bump | All 103 warnings live in `tests/`; the rule-config bump (drop `--quiet`, gate from "warnings allowed" to "warnings forbidden") lands in `tests/eslint.config.mjs` per the `2026-05-10-tests-playwright-hygiene-sweep.md` final step |
| Parity-script tooling (Plan 6) | **Tests scripts directory** — TBD path (planner picks `tests/scripts/` vs `scripts/` vs `.planning/`) | — | CONTEXT D-08: restore from git blob `2832c4410`; constants regen via `regen-constants.mjs`. Single source of truth for the determinism gate. |
| 3-run determinism gate (Plan 6) | **CI / local** (`yarn test:e2e --workers=1`) | **Vite cache** wipe recipe (D-10) | Phase-close validation; identical pass/fail sets across 3 cold runs. |

## Phase Requirements

| ID | Description (from REQUIREMENTS.md) | Research Support |
|----|-------------|------------------|
| **DETERM-01** | All `test.skip(true, …)` modifiers removed/converted; suite reports 0 skipped on green run | Probed: only `candidate-bank-auth.spec.ts:199` remains (`test.skip(!createdUserId, ...)`). CONTEXT D-07 binds: legitimate skip + inline `// reason:` + ESLint disable. Pattern from `2026-04-27-remove-e2e-skip-modifiers.md` (Removable / Documented-flake / Genuinely conditional protocol). |
| **DETERM-02** | 19 known data-loading race E2E failures resolved deterministically; 3 consecutive `--workers=1` runs identical | CONTEXT D-01 re-anchors at **36 tests** (15 DATA_RACE + 21 CASCADE_BASELINE per P64). REQUIREMENTS.md's "19" is approximate; the parity-script constants are the binding contract. Default fix shape: `expect.poll(...).toBeGreaterThan(0)` (P64 idiom) + `waitFor({ state: 'visible' })` against asserted element. Code-level escalation gated by D-05 cap. |
| **DETERM-03** | All 98 (actual: **103**) `playwright/*` warnings cleared; `yarn lint:check` exits 0 with 0 warnings | Probed exact split: 37 `no-raw-locators` + 36 `no-conditional-in-test` + 18 `no-conditional-expect` + 6 `no-networkidle` + 2 `no-wait-for-timeout` + 1 `no-skipped-test` + 1 `expect-expect`. CONTEXT D-03 mandates planner re-baselines in PLAN.md. Final lint-gate bump in `tests/eslint.config.mjs` per `2026-05-10-tests-playwright-hygiene-sweep.md`. |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Race anchor:** All 36 tests in the parity-script's race pool (15 DATA_RACE + 21 CASCADE_BASELINE from P64 baseline `67p / 1f / 34c`). [VERIFIED: `regen-constants.mjs` output + git blob `2832c4410:diff-playwright-reports.ts` line counts]
- **D-02 — Closure criterion:** 3 cold `--workers=1` runs produce identical pass/fail sets; parity-script constants regenerated; remaining DATA_RACE pool members per-test justified in VERIFICATION.md (rationale: env-gated, infrastructure flake, deferred product bug, etc.). NOT "all 36 must green."
- **D-03 — REQUIREMENTS number drift:** REQUIREMENTS.md says "98 warnings" — actual is **103**. REQUIREMENTS.md DETERM-01 says `test.skip(true, …)` — actual remaining is `test.skip(!createdUserId, …)`. Planner re-baselines in PLAN.md. [VERIFIED via `yarn lint:check`]
- **D-04 — Plan order:** Inventory → mechanical → races → parity gate. Plan 1 (3-run baseline + classification), Plan 2 (no-networkidle + no-raw-locators), Plans 3–5 (per-spec investigative passes clustered by failure type), Plan 6 (parity-gate + 3-run smoke).
- **D-05 — Code cap:** Code-level fix in Phase 73 if **≤50 LOC, ≤2 files, no public-API change, no migration**. Anything larger → capture as `.planning/todos/pending/` entry with full repro + leave the failing test in the post-73 DATA_RACE pool with rationale.
- **D-06 — Default scope:** Test-level fix preferred. Escalate to code-level only when test-level masks the contract.
- **D-07 — Bank-auth skip:** Legitimate skip; inline `// reason:` justification + `// eslint-disable-next-line playwright/no-skipped-test` with rationale. Bank-auth is opt-in via `@bank-auth` tag (env-gated, disabled by default in CI). Do NOT convert to `expect.poll` (precondition-not-met, not a race).
- **D-08 — Parity-script tooling:** `scripts/diff-playwright-reports.ts` was DELETED at v2.7 milestone start (commit `64ccbe284`). Plan 6 must restore/rebuild from sources: (a) git blob `2832c4410` (last-known-good, 466 LOC, with PASS_LOCKED 66 + DATA_RACE 15 + CASCADE 21 constants), (b) `regen-constants.mjs` (constants generator), (c) `diff-parity.mjs` (lighter v2.7 reference). Path TBD — planner picks (`tests/scripts/` or `scripts/`).
- **D-09 — Verification shape:** Per-plan validates via single `--workers=1` smoke + spot-check (`for i in {1..3}; do yarn test:e2e --grep "<spec>"; done`) on flake-prone specs only. End-of-phase 3-run gate runs once in Plan 6.
- **D-10 — Vite-cache wipe recipe:** `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` MUST precede the end-of-phase smoke. Per v2.8 close gotcha (pre-bundled deps retained pre-rename source between phases).

### Claude's Discretion

- Exact failure-type clustering for Plans 3–5 — researcher inventory in Plan 1 produces the binding clustering; planner sequences.
- Whether to extract a shared `expectEventually(locator, predicate)` helper in `tests/tests/utils/` — defer to v2.10+ unless 5+ uses surface during Phase 73 (Deferred Idea).
- Specific rewrite shape per `no-conditional-in-test` site — split-into-separate-tests vs setup-hook vs module-level extraction (rule-author canonical patterns; see Pitfalls below).
- Whether code-level fixes that exceed the ≤50 LOC cap mid-plan get captured as todos or escalated to a v2.10 follow-up phase — planner's call within D-05 framework.
- Whether `diff-playwright-reports.ts` lands at `tests/scripts/`, `scripts/`, or stays ephemeral in `.planning/` — planner picks; both `tests/scripts/` and `scripts/` are currently empty/non-existent.

### Deferred Ideas (OUT OF SCOPE)

- **Lint-rule enforcement carry-forward** — custom ESLint rule or CI grep gate that flags `test.skip(true, ...)` going forward. Phase 73 closes the substantive sweep; CI-gate enforcement is a v2.10+ cleanup item.
- **Default-parallelism stability follow-up** — REQUIREMENTS.md DETERM-02 specifies `--workers=1`. Phase 73 doesn't validate stability under default parallelism. If Phases 74–77 need parallelism for time, a separate stability follow-up phase may be needed.
- **Custom matchers / shared race-tolerant assertion helpers** — extract `expectEventually(locator, predicate)` if 5+ uses surface. Defer unless count is overwhelming during Phase 73 execution.
- **Imgproxy 502 root-cause** — known infrastructure flake. Fix recipe: `supabase stop && supabase start`. Out of v2.9 scope (already classified as carry-forward infrastructure debt).

## Project Constraints (from CLAUDE.md)

Directives that bind Phase 73 plans:

1. **Context Destructuring Rule (Svelte 5)** — If a race investigation surfaces a Svelte 5 reactivity hazard, the fix must follow `ctx.X` direct-property-access pattern for reactive accessors, not destructured locals. Stable references (`t`, `getRoute`, `appSettings`, etc.) may remain destructured. Reactive accessors (`selectedElections`, `matches`, `opinionQuestions`, etc.) MUST be read via `ctx.X` inside `$derived`. [`apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:106-123` is the canonical anchor]
2. **Test accessibility** — App must be WCAG 2.1 AA compliant. No race fix should remove an a11y-required attribute as a side effect.
3. **Use TypeScript strictly** — Avoid `any` (already at 'warn' in `tests/eslint.config.mjs`). Race-fix code-level changes must not introduce new `any`.
4. **Localization** — All user-facing strings support multiple locales. Locator changes must not bind to English-only text — use `getByRole({ name: /pattern/i })` with regex or rely on testIds.
5. **Always check Code Review Checklist** — Phase 73 plans MUST run `yarn lint:check`, `yarn test:unit`, `yarn build` per the standard convention. Plan 6 adds the full 3-run E2E gate.
6. **Repo commit hooks workaround** — `git -c core.hooksPath=/dev/null` until global config is fixed (per stored memory `project_gsd_repo_hook_workaround.md`).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.58.2 (catalog) | E2E test framework | Already locked stack; v2.9 is content (coverage + determinism), not infrastructure [VERIFIED: `package.json`] |
| `eslint-plugin-playwright` | 2.9.0 | Playwright lint rules | Already configured in `tests/eslint.config.mjs` flat config [VERIFIED: `package.json`] |
| `tsx` | (via package deps) | Run TypeScript directly for parity-script | P64 precedent: `tsx diff-playwright-reports.ts <baseline> <post>` [VERIFIED: P64 verification report] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing `tests/tests/utils/testIds.ts` | (in-tree) | Central testId registry — 350+ usages | DEFAULT for `no-raw-locators` rewrites where a testid exists |
| Existing `tests/tests/utils/buildRoute.ts` | (in-tree) | Locale-aware route builder | Reuse where any rewrite needs to navigate |
| Existing `tests/tests/fixtures/voter.fixture.ts` | (in-tree) | `answeredVoterPage` fixture | Race-fix candidate if test-level fix needs deterministic precondition |
| Node `node:fs` + `node:path` | builtin | Parity-script restoration | Match P64's `regen-constants.mjs` shape (`readFileSync`, `JSON.parse`) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `expect.poll(...).toBeGreaterThan(0)` | `expect.toPass(() => { ... })` | `toPass` is for blocks; `poll` is for single values. P64 used `poll`; default to it for consistency. `toPass` defaults to no timeout — riskier. [CITED: playwright.dev/docs/test-assertions] |
| Restore parity-script from git blob | Rebuild from `regen-constants.mjs` | Restore is faster + battle-tested (466 LOC, P64-validated). Rebuild risks subtle behavior drift. Default: restore. |
| Land parity-script at `tests/scripts/` | Land at `scripts/` (root) | `tests/` is workspace-scoped (consistent with test-tooling colocation); `scripts/` is repo-root. CONTEXT D-08 leaves planner discretion. |
| Convert bank-auth skip to `expect.poll` | Keep as `test.skip` with ESLint disable | CONTEXT D-07 binds: precondition-gate, NOT a race. `expect.poll` would mask "Edge Function keys not configured" → false-positive timeout. |

**Installation:** No new dependencies needed. Existing toolchain covers all three workstreams.

**Version verification (probed against the registry):**
```
@playwright/test: 1.58.2 (locked via catalog: in package.json)
eslint-plugin-playwright: 2.9.0 (locked in package.json)
```
[VERIFIED: `grep -A2 "playwright" package.json`]

## Architecture Patterns

### System Architecture Diagram

```
                    Phase 73 — Determinism Workflow
                    ────────────────────────────────

    ┌─────────────────────────────────────────────────────┐
    │ Plan 1 — Inventory & Classification (researcher)    │
    │                                                     │
    │   yarn dev:reset-with-data                          │
    │       ↓                                             │
    │   for i in {1..3}; do yarn test:e2e --workers=1; done│
    │       ↓                                             │
    │   3× playwright-report.json captures                │
    │       ↓                                             │
    │   classify failures by failure type:                │
    │     a) initial-fetch race                           │
    │     b) subscription-not-flushed                     │
    │     c) auth-cookie not set in time                  │
    │     d) hydration timing                             │
    │       ↓                                             │
    │   bind 36-test list + per-spec failure-type cluster │
    │   re-baseline 103-warning split                     │
    │   → 73-01-INVENTORY.md (or equivalent capture)      │
    └─────────────────────────────────────────────────────┘
                            ↓
    ┌─────────────────────────────────────────────────────┐
    │ Plan 2 — Mechanical Sweep (no behavior risk)        │
    │                                                     │
    │   no-networkidle (6 sites) → waitFor element        │
    │       ↓                                             │
    │   no-raw-locators (37 sites) → getByTestId/getByRole│
    │       ↓                                             │
    │   yarn lint:check → 0 warnings for those rules      │
    │   yarn test:e2e (single smoke)                      │
    └─────────────────────────────────────────────────────┘
                            ↓
    ┌─────────────────────────────────────────────────────┐
    │ Plans 3-5 — Per-spec investigative passes           │
    │   (paired DETERM-02 + DETERM-03 rewrites)           │
    │                                                     │
    │   cluster by failure type from Plan 1:              │
    │   - cluster-A specs (initial-fetch race) → Plan 3   │
    │   - cluster-B specs (subscription) → Plan 4         │
    │   - cluster-C specs (auth/hydration) → Plan 5       │
    │                                                     │
    │   per cluster:                                      │
    │     1. read each spec, classify warning per site    │
    │     2. rewrite no-conditional-in-test (split tests  │
    │        OR move to setup hook OR module-level)       │
    │     3. rewrite no-conditional-expect (getError      │
    │        pattern OR ternary in expect arg)            │
    │     4. apply race fix (waitFor / expect.poll /      │
    │        proper assertion)                            │
    │     5. yarn lint:check (per-rule grep) → 0          │
    │     6. yarn test:e2e --grep "<spec>" 3× → identical │
    │     7. handle bank-auth D-07 inline justification   │
    │     8. resolve no-wait-for-timeout (2) +            │
    │        expect-expect (1) en route                   │
    └─────────────────────────────────────────────────────┘
                            ↓
    ┌─────────────────────────────────────────────────────┐
    │ Plan 6 — Parity-gate Regen + 3-run Smoke            │
    │                                                     │
    │   restore diff-playwright-reports.ts (D-08)         │
    │       ↓                                             │
    │   rm -rf apps/frontend/node_modules/.vite           │
    │          apps/frontend/.svelte-kit       (D-10)     │
    │       ↓                                             │
    │   yarn dev:reset-with-data                          │
    │       ↓                                             │
    │   for i in {1..3}; do                                │
    │     yarn test:e2e --workers=1 --reporter=json       │
    │     cp playwright-report.json run-${i}.json         │
    │   done                                              │
    │       ↓                                             │
    │   diff run-1 vs run-2, run-2 vs run-3 (PARITY: PASS)│
    │       ↓                                             │
    │   regen-constants from run-3.json                   │
    │   patch diff-playwright-reports.ts constants        │
    │   self-identity smoke: PARITY GATE: PASS            │
    │       ↓                                             │
    │   write 73-VERIFICATION.md (model: 64-VERIFICATION) │
    │       ↓                                             │
    │   bump tests/eslint.config.mjs:                     │
    │     'no-raw-locators': 'warn' → 'error'             │
    │     'no-conditional-in-test': 'warn' → 'error'      │
    │     ... (all 7 playwright/* rules to 'error')       │
    │       ↓                                             │
    │   final yarn lint:check → 0/0                       │
    └─────────────────────────────────────────────────────┘
```

### Recommended Project Structure

No new directories needed. Touched files:

```
tests/
├── eslint.config.mjs              # Plan 6: bump 7 playwright/* rules from 'warn' → 'error'
├── playwright.config.ts           # NO CHANGES (workers, reporters intact per config)
├── tests/
│   ├── specs/
│   │   ├── candidate/             # Plans 3-5 race + warning rewrites
│   │   │   ├── candidate-bank-auth.spec.ts    # D-07: inline justification at :199
│   │   │   ├── candidate-profile.spec.ts      # 7 warnings — race + raw + conditional + waitForTimeout
│   │   │   ├── candidate-settings.spec.ts     # 8 warnings — networkidle + raw + conditional
│   │   │   └── candidate-questions.spec.ts    # 4 warnings
│   │   ├── voter/                 # Plans 3-5 race + warning rewrites
│   │   │   ├── voter-results.spec.ts          # 11 warnings — raw locators + waitForTimeout
│   │   │   ├── voter-detail.spec.ts           # 6 warnings — raw locators
│   │   │   ├── voter-settings.spec.ts         # 8 warnings — heaviest conditional
│   │   │   ├── voter-popups.spec.ts           # 3 warnings
│   │   │   └── voter-static-pages.spec.ts     # 1 networkidle
│   │   ├── visual/visual-regression.spec.ts   # 4 networkidle (mechanical Plan 2)
│   │   └── variants/                          # 13 warnings (mostly conditional)
│   ├── utils/
│   │   ├── testIds.ts             # READ-ONLY — registry to consume in raw-locator rewrites
│   │   └── (potential new: expectEventually helper if 5+ uses surface — DEFERRED)
│   └── fixtures/                  # READ-ONLY unless race-fix needs precondition
└── (NEW or MOVED) scripts/        # Plan 6: parity-script restoration target (planner picks)
    └── diff-playwright-reports.ts # Restored from git blob 2832c4410
```

### Pattern 1: Race-Tolerant Assertion (P64 idiom)

**What:** Use `expect.poll(asyncFn, { timeout, intervals, message }).toBeGreaterThan(0)` (or other matcher) when test contract is "X must eventually appear" rather than "X must appear synchronously."

**When to use:** Replacing `test.skip(true, ...)` paths where the underlying issue is timing, not feature absence. Replacing `if (condition) await ...; else expect.skip(...)` masks. The default replacement when a race is observed and test-level fix is sufficient (CONTEXT D-06).

**Example (verbatim from `tests/tests/specs/voter/voter-results.spec.ts:318-323`):**
```typescript
// Source: voter-results.spec.ts:318-323 (Phase 64 D-15 hardening)
await expect
  .poll(() => page.getByTestId(testIds.voter.results.card).count(), {
    timeout: 5000,
    message: `Card count after drawer close must match pre-drawer count (${beforeFilterCount})`
  })
  .toEqual(beforeFilterCount);
```

**Configurable parameters (verified against playwright.dev/docs/test-assertions):**
- `message`: custom assertion message
- `timeout`: defaults to 5 seconds
- `intervals`: defaults to `[100, 250, 500, 1000]` (back-off pattern)

### Pattern 2: Element-State Wait (no-networkidle replacement)

**What:** Replace `page.waitForLoadState('networkidle')` with `await locator.waitFor({ state: 'visible' })` against the actual asserted element.

**When to use:** All 6 `no-networkidle` sites (4 in `visual-regression.spec.ts`, 1 in `voter-static-pages.spec.ts`, 1 in `candidate-settings.spec.ts`). Playwright's docs explicitly mark `'networkidle'` as **DISCOURAGED**.

**Example (verbatim from `tests/tests/specs/voter/voter-popups.spec.ts:104,135`):**
```typescript
// Source: voter-popups.spec.ts:104,135 (existing canonical pattern)
await dialog.waitFor({ state: 'visible', timeout: 15000 });
// ...
await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 5000 });
```

[CITED: playwright.dev/docs/api/class-page#page-wait-for-load-state — "'networkidle' - DISCOURAGED ... Don't use this method for testing, rely on web assertions to assess readiness instead."]

### Pattern 3: Semantic Locator Hierarchy (no-raw-locators replacement)

**What:** Replace `page.locator('css selector')` with semantic locators per Playwright's official priority order.

**Canonical priority order** [CITED: playwright.dev/docs/best-practices]:
1. `getByRole({ name: ... })` — accessibility-first, user-facing
2. `getByText(...)` — what users see
3. `getByLabel(...)` — form-associated
4. `getByPlaceholder(...)` — input hints
5. `getByAltText(...)` — image descriptions
6. `getByTitle(...)` — title attributes
7. `getByTestId(...)` — last resort, but acceptable when no semantic option exists

**When `getByTestId` is acceptable in this codebase:** When a `data-testid` already exists in `tests/tests/utils/testIds.ts`. The registry has 350+ usages — this is the dominant convention. New testids land in the registry first.

**Example raw-locator rewrites (sites probed in `voter-results.spec.ts:181,221,256,270,291`):**
```typescript
// BEFORE — raw CSS selector
const firstCheckbox = page.locator('dialog input[type="checkbox"]').first();
const dialog = page.locator('dialog[open]');
.filter({ has: page.locator('.btn-warning, [color="warning"]') });

// AFTER — semantic, with testid registry add if no role-based alternative
const firstCheckbox = page.getByRole('dialog').getByRole('checkbox').first();
await expect(page.getByRole('dialog')).toBeVisible();  // implicit "open" via role
.filter({ has: page.getByRole('button', { name: /warning/i }) });
```

**Anti-pattern:** Adding ad-hoc testids without registering in `testIds.ts`. The registry is the contract — components and tests both read from it.

### Pattern 4: `no-conditional-in-test` rewrite (rule-author canonical)

**What:** Move conditional logic outside the test function body. Three canonical patterns from rule-author docs:

1. **Conditional test registration** — wrap in `test.describe` with the `if` outside `test(...)`:
```typescript
// BEFORE
test('foo', async ({ page }) => {
  if (someCondition) bar();
});
// AFTER
test.describe('my tests', () => {
  if (someCondition) {
    test('foo', async ({ page }) => { bar(); });
  }
});
```

2. **Move logic to `beforeEach`** — useful for branchy setup:
```typescript
// BEFORE
test('bar', async ({ page }) => {
  switch (mode) { case 'single': generateOne(); ... }
  await expect(page.locator('.my-image')).toBeVisible();
});
// AFTER
beforeEach(() => {
  switch (mode) { case 'single': generateOne(); ... }
});
test('bar', async ({ page }) => {
  await expect(page.locator('.my-image')).toBeVisible();
});
```

3. **Extract to module level** — for platform/env switches:
```typescript
// BEFORE
test('baz', async ({ page }) => {
  const hotkey = process.platform === 'linux' ? ['Control','Alt','f'] : ['Alt','f'];
  ...
});
// AFTER
const hotkey = process.platform === 'linux' ? ['Control','Alt','f'] : ['Alt','f'];
test('baz', async ({ page }) => { ... });
```

**Key principle (rule-author):** "each branch of code executing within a conditional statement will usually be better served by a test devoted to it."

**When this becomes DETERM-02 territory:** When the `if (...)` is `if (await locator.isVisible()) expect(...)` — that's masking a race. Rewrite as `await expect(locator).toBeVisible()` (or `expect.poll`) and unconditionally assert.

[CITED: github.com/playwright-community/eslint-plugin-playwright/docs/rules/no-conditional-in-test.md]

### Pattern 5: `no-conditional-expect` rewrite (rule-author canonical)

**What:** Move try-catch error capture into a wrapper that always returns the error, then assert unconditionally.

**Example:**
```typescript
// BEFORE
test('includes status code', async () => {
  try {
    await makeRequest(url);
  } catch (error) {
    expect(error).toHaveProperty('statusCode', 404);  // never runs if no throw → false pass
  }
});

// AFTER
class NoErrorThrownError extends Error {}
const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try { await call(); throw new NoErrorThrownError(); }
  catch (e) { return e as TError; }
};
test('includes status code', async () => {
  const error = await getError(async () => makeRequest(url));
  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error).toHaveProperty('statusCode', 404);
});
```

**Most common case in this codebase (DETERM-02 paired):** `if (await element.isVisible()) expect(...).toBe(...)` — rewrite as `await expect(element).toBeVisible(); expect(...).toBe(...);` (unconditional, with proper waitFor). The 18 `no-conditional-expect` warnings overlap heavily with the 36 `no-conditional-in-test` warnings — most sites have both flagged.

[CITED: github.com/playwright-community/eslint-plugin-playwright/docs/rules/no-conditional-expect.md]

### Pattern 6: 3-run Cold-Start Determinism Gate

**What:** Run the full Playwright suite 3 times in a row with `--workers=1`, capture each run's `playwright-report.json`, assert identical pass/fail sets across all 3 runs.

**Recipe (CONTEXT D-09 + D-10, modeled on P64):**
```bash
# Cold-cache prelude (D-10) — MANDATORY, per v2.8 close gotcha
rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit

# Fresh data
yarn dev:reset-with-data

# Run 1
yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json > .planning/phases/73-determinism-baseline/post-fix/run-1-report.json

# Run 2 (no reset — same data state)
yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json > .planning/phases/73-determinism-baseline/post-fix/run-2-report.json

# Run 3
yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json > .planning/phases/73-determinism-baseline/post-fix/run-3-report.json

# Diff with restored parity script
tsx <parity-script-path> run-1.json run-2.json   # PARITY GATE: PASS
tsx <parity-script-path> run-2.json run-3.json   # PARITY GATE: PASS

# Regenerate constants from run-3 (the post-Phase-73 anchor baseline)
node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs

# Self-identity smoke
tsx <parity-script-path> run-3.json run-3.json   # PARITY GATE: PASS
```

**Artifact storage shape (P64 precedent):** Capture run JSONs at `.planning/phases/73-determinism-baseline/post-fix/run-{1,2,3}-report.json`. Mirrors P64's `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json`.

### Anti-Patterns to Avoid

- **`test.skip(true, ...)` as a race-mask** — silent skip hides flake; convert to `expect.poll().toBeGreaterThan(0)` per P64 D-11. Only one site remains (bank-auth, D-07-justified).
- **`waitForLoadState('networkidle')` as a wait barrier** — Playwright explicitly DISCOURAGED. 6 sites — replace with element-state wait.
- **`page.waitForTimeout(N)` to wait for state** — code-smell; 2 sites (`voter-results.spec.ts:202` is a 500ms post-filter wait). Replace with `expect.poll` against the asserted card count.
- **Adding new testids without registering** — `tests/tests/utils/testIds.ts` is the contract. Components and tests both consume it.
- **Conditional assertions** — `if (await x.isVisible()) expect(...)` is a false-pass risk. Rewrite as unconditional `await expect(x).toBeVisible(); expect(...)`. This is the central DETERM-02 + DETERM-03 pairing pattern.
- **Destructuring reactive Svelte 5 context accessors** — if a code-level race fix touches a context consumer, follow CLAUDE.md Context Destructuring Rule (`ctx.X` direct access for reactive accessors).
- **Swallowed errors in `if (...).catch(() => false)`** — observed at `voter-settings.spec.ts:293`. The pattern `if (await categoryIntro.isVisible().catch(() => false))` masks both the race AND any real error. Replace with proper `waitFor` or branch-split.
- **Bare `expect(x).toBeTruthy()` after a probe** — `expect-expect` rule fires when a test has no assertions; the 1 site (`candidate-auth.spec.ts:33`) needs a real assertion or removal.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Race-tolerant assertion | Custom `while (Date.now() - start < N) { ... }` polling loop | `expect.poll(fn, { timeout, intervals, message })` | Playwright's native polling has back-off, timeout, and clean message reporting. Custom loops have no auto-retry semantics. |
| Element-readiness wait | Custom `waitForTimeout(N)` | `locator.waitFor({ state: 'visible' })` or `expect(locator).toBeVisible({ timeout })` | Web-first assertions auto-retry; timeouts don't. Playwright explicitly recommends this. [CITED: playwright.dev/docs/best-practices] |
| Parity-script comparison | Custom JSON walker per phase | Restore `diff-playwright-reports.ts` from blob `2832c4410` | 466-LOC battle-tested script with 3 categorized constants (PASS_LOCKED/DATA_RACE/CASCADE) and self-identity smoke. P64-validated. |
| Constants regeneration | Manual JSON munging | `regen-constants.mjs` (in-tree at `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/`) | Already encodes IMGPROXY_TIED_TITLES list + `categorizeStatus` + `flattenReport` + match-count assertion. |
| Test-by-test JSON walking | Custom suite traversal | `flattenReport(report)` from the parity script | Already handles `r.suites.suites.specs.tests.results` nesting + project-name prefix + spec-file path. |
| Cold-start cache wipe | Custom Node script | `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` | Two-line bash recipe; CONTEXT D-10 recipe; DX-only (no install needed). |
| Conditional test rewrites | Manual branch-by-branch | Rule-author canonical patterns (split tests, beforeEach, module-level extraction) | 3 documented patterns cover all 36 sites; no need to invent. |
| no-conditional-expect rewrites | Custom error-shape branching | `getError` wrapper + unconditional asserts | Rule-author canonical; covers the catch-block case. For `if (await x.isVisible())` cases, use `waitFor` + unconditional. |

**Key insight:** Phase 73 is a sweep, not a build. Every workstream has an established pattern (P64 for races, rule-author docs for warnings, 466-LOC blob for parity script). The scope is mechanical execution + per-spec investigation, NOT inventing new infrastructure. Defer custom helpers (e.g., `expectEventually`) to v2.10+ unless 5+ uses surface during execution.

## Common Pitfalls

### Pitfall 1: Vite-cache contamination between phases
**What goes wrong:** Pre-bundled deps in `apps/frontend/node_modules/.vite/` retain stale source from before recent renames/i18n key changes. Symptom: voter-detail party-drawer test times out because `entityDetails.tabs.candidates` (old key) doesn't match `entityDetails.tabs.children` (new key after Phase 69).
**Why it happens:** Vite's pre-bundling is aggressive; rename-touched code paths are silently served from cache.
**How to avoid:** Run `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` before any "true cold start" smoke. CONTEXT D-10 mandates this for Plan 6's smoke.
**Warning signs:** Tests pass locally on warm cache but fail on CI cold cache. Tests fail with "element not found" when the element clearly exists in source.
[VERIFIED: `.planning/milestones/v2.8-MILESTONE-AUDIT.md` §"Bundled Manual Smoke (2026-05-10)"]

### Pitfall 2: IMGPROXY_TIED_TITLES rename drift
**What goes wrong:** `regen-constants.mjs` has a hard-coded list of 14 titles. If any imgproxy-tied test is renamed upstream (e.g., during a rewrite plan), the regen fails loudly with "ERROR: IMGPROXY_TIED_TITLES match-count assertion failed."
**Why it happens:** The titles are bound by D-09 to be the DATA_RACE classification target. The script ASSERTS each title matches at least one test in the new JSON.
**How to avoid:** If a rewrite plan renames an imgproxy-tied test, update the IMGPROXY_TIED_TITLES list in `regen-constants.mjs` AT THE SAME TIME. The 14 titles are listed in `regen-constants.mjs:55-70` and in CONTEXT D-09 of P64.
**Warning signs:** Plan 6 regen errors with title list mismatches.

### Pitfall 3: Effective `--workers=1` semantics
**What goes wrong:** Test passes under `--workers=1` (serial) but fails under default parallelism (workers=6 locally per `playwright.config.ts:55`). REQUIREMENTS.md DETERM-02 specifies `--workers=1`; Phase 73 doesn't validate stability under default parallelism.
**Why it happens:** Some races only surface when multiple workers compete for the same Supabase session, imgproxy upload slot, or shared global app_settings mutation.
**How to avoid:** Restrict Phase 73 closure criterion to `--workers=1` (CONTEXT D-02 + D-09). Capture default-parallelism stability as Deferred Idea (out of scope per CONTEXT.md).
**Warning signs:** Plan 6 3-run gate passes, but Phases 74-77's parallel runs flake.

### Pitfall 4: Bank-auth lint disable strictness
**What goes wrong:** ESLint disable directive `// eslint-disable-next-line playwright/no-skipped-test` works in the current `tests/eslint.config.mjs` setup, but a future strictness bump (e.g., `--max-warnings 0` flag) might reject the disable without a `--no-eslint-disable` reason flag.
**Why it happens:** Some lint configs strip per-line disables in CI mode.
**How to avoid:** Pair the inline `// eslint-disable-next-line` with a `// reason:` comment on the line above. Plan 6's lint-gate bump must verify the disable directive still works after rules go from `'warn'` → `'error'`.
**Warning signs:** Plan 6 final `yarn lint:check` fails on the bank-auth site.

### Pitfall 5: Imgproxy 502 surfacing during 3-run gate
**What goes wrong:** Local imgproxy Docker container crashes intermittently with 502 on image upload; flake during the Plan 6 gate makes pass/fail sets non-identical across the 3 runs.
**Why it happens:** Infrastructure debt — already classified in PROJECT.md / STATE.md as known infrastructure flake. Fix recipe: `supabase stop && supabase start`.
**How to avoid:** If imgproxy 502 surfaces, restart Supabase (`supabase stop && supabase start`) and re-run the 3-run gate. Document the flake in `73-VERIFICATION.md` per CONTEXT D-02 (per-test justification for remaining DATA_RACE pool members). The 14 imgproxy-tied titles are EXPECTED to land in the post-73 DATA_RACE pool — that's NOT a regression.
**Warning signs:** `should upload a profile image (CAND-03)` fails on run 1 but passes on run 2/3.

### Pitfall 6: Code-level fix exceeds ≤50 LOC cap mid-plan
**What goes wrong:** A race investigation surfaces a real product bug whose fix legitimately spans 80 LOC and 3 files (e.g., a context + its consumer + a helper). CONTEXT D-05 caps Phase 73 code-level fixes at ≤50 LOC, ≤2 files.
**Why it happens:** Svelte 5 reactivity hazards (e.g., destructured reactive accessors, missing reactivity edges) often span the context definition + the consumer + sometimes a helper.
**How to avoid:** Stop, capture the repro + the proposed fix as a `.planning/todos/pending/` entry, leave the failing test in the post-73 DATA_RACE pool with rationale per CONTEXT D-02. Escalation path: a v2.10 follow-up phase or a focused bug-fix plan within v2.9. Do NOT silently expand the cap mid-plan.
**Warning signs:** Plan 3/4/5 starts to grow files/LOC counts past the cap. The right action is to TRIM, not expand.

### Pitfall 7: Splitting tests creates false coverage drift
**What goes wrong:** A `no-conditional-in-test` rewrite splits one `if (mode === 'A') ... else ...` test into 2 tests; the parity-script's PASS_LOCKED count expects 1 test at that title, now sees 2. False regression in Plan 6.
**Why it happens:** PASS_LOCKED_TESTS is bound by exact `'<projectName> :: <specFile> > <specTitle>'` strings.
**How to avoid:** Plan 6's regen runs AFTER all rewrites land. The post-Phase-73 baseline IS the new anchor — split tests are expected in the post-baseline. Don't try to preserve title-identity across splits.
**Warning signs:** Plan 6 regen produces unexpected PASS_LOCKED size shifts vs. P64's 66 — this is normal (Phase 73 changed test counts via splits).

### Pitfall 8: `if (page.url().includes('/results'))` masking redirect race
**What goes wrong:** Observed at `voter-settings.spec.ts:196,299` — branching on URL state to handle "we may or may not have already auto-navigated to results." This is the classic CASCADE_BASELINE race.
**Why it happens:** The redirect from `/questions` to `/results` upon hitting `minimumAnswers` is async; depending on timing, the test arrives at `/results` before or after the assertion runs.
**How to avoid:** Use `page.waitForURL(/\/results/, { timeout })` to deterministically wait for the redirect. Replace the conditional with the wait + unconditional assertion.
**Warning signs:** Test passes in isolation, fails under suite contention, has `if (page.url())` in body.

## Code Examples

### Example 1: Bank-auth skip with inline justification (D-07)

```typescript
// Source: candidate-bank-auth.spec.ts:196-199 (current state — to be amended in Plan 1 or 5)
test('should return session with magic link when candidate is created', async () => {
  // This test only runs meaningfully when Edge Function keys are configured
  // Skip if no user was created in the previous test
  // reason: bank-auth is opt-in via @bank-auth tag (env-gated; PLAYWRIGHT_BANK_AUTH=1
  //   selects the project per playwright.config.ts; disabled by default in CI). This skip
  //   is a precondition-gate for the Edge Function integration test, NOT a race —
  //   converting to expect.poll would mask "Edge Function keys not configured" → false-positive timeout.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!createdUserId, 'Skipped: Edge Function keys not configured for full integration');
  // ...
});
```

[Pattern source: v2.8 P70 Cat A "Option A inline ignore-with-rationale preamble" — see CLAUDE.md anchor pending CLEAN-03 sub-finding 3.]

### Example 2: networkidle → element wait (Plan 2 mechanical sweep)

```typescript
// BEFORE — voter-static-pages.spec.ts:99-100 (current)
await page.goto(buildRoute({ route: 'Nominations', locale: 'en' }));
await page.waitForLoadState('networkidle');
await expect(page.getByTestId(testIds.voter.nominations.container)).toBeVisible({ timeout: 15000 });

// AFTER — drop networkidle; rely on the element-state wait that follows
await page.goto(buildRoute({ route: 'Nominations', locale: 'en' }));
await expect(page.getByTestId(testIds.voter.nominations.container)).toBeVisible({ timeout: 15000 });
```

### Example 3: page.waitForTimeout → expect.poll (Plan 3-5)

```typescript
// BEFORE — voter-results.spec.ts:201-207 (current — flagged by no-wait-for-timeout)
await page
  .locator('dialog')
  .getByRole('button', { name: /close filters/i })
  .click();
await page.waitForTimeout(500);  // ← warning
const filteredCount = await page.getByTestId(testIds.voter.results.card).count();
expect(filteredCount).toBeLessThanOrEqual(initialCount);

// AFTER — drop timeout; poll until the count narrows
await page.getByRole('dialog').getByRole('button', { name: /close filters/i }).click();
await expect
  .poll(() => page.getByTestId(testIds.voter.results.card).count(), {
    timeout: 5000,
    message: 'Filtered card count must narrow after applying filter (RESULTS-01/02)'
  })
  .toBeLessThanOrEqual(initialCount);
```

### Example 4: Raw locator → semantic locator (Plan 2)

```typescript
// BEFORE — voter-results.spec.ts:181 (current — flagged by no-raw-locators)
const firstCheckbox = page.locator('dialog input[type="checkbox"]').first();

// AFTER — combine getByRole('dialog') + getByRole('checkbox')
const firstCheckbox = page.getByRole('dialog').getByRole('checkbox').first();
```

### Example 5: Conditional `if (page.url())` → deterministic waitForURL (Plans 3-5)

```typescript
// BEFORE — voter-settings.spec.ts:196-198 (current — flagged by no-conditional-in-test + likely race)
if (page.url().includes('/results')) {
  // we already auto-navigated; assert results
  await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();
}

// AFTER — wait for the redirect deterministically; unconditional assertion
await page.waitForURL(/\/results/, { timeout: 10000 });
await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();
```

### Example 6: Parity-gate self-identity smoke (Plan 6)

```bash
# Source: 64-VERIFICATION.md §"Self-identity smoke output"
tsx <parity-script-path> run-3-report.json run-3-report.json
# Expected output:
# Baseline: 67p / 1f / 34c
# Post:     67p / 1f / 34c
# Contract: 66 pass-locked, 15 data-race pool, 21 cascade-baseline.
# PARITY GATE: PASS — no regressions detected per D-59-04.
```

(Counts will shift in Phase 73's regen — Phase 73's anchor is the new baseline. The shape — `Np / 1f / Mc` and `PARITY GATE: PASS` — is what's binding.)

### Example 7: ESLint config rule-bump (Plan 6 final step)

```javascript
// tests/eslint.config.mjs — Plan 6 final step, per 2026-05-10-tests-playwright-hygiene-sweep.md
// BEFORE
'playwright/no-raw-locators': 'warn',
'playwright/no-wait-for-timeout': 'warn',
'playwright/no-skipped-test': 'warn',
'playwright/no-conditional-in-test': 'warn',
'playwright/no-networkidle': 'warn',

// AFTER (post-Phase-73 lint-gate bump)
'playwright/no-raw-locators': 'error',
'playwright/no-wait-for-timeout': 'error',
'playwright/no-skipped-test': 'error',  // bank-auth skip remains via per-line eslint-disable
'playwright/no-conditional-in-test': 'error',
'playwright/no-networkidle': 'error',
'playwright/no-conditional-expect': 'error',  // pair with no-conditional-in-test
'playwright/expect-expect': 'error',
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `test.skip(true, 'data-dependent')` mask | `expect.poll(fn).toBeGreaterThan(0)` race-tolerant assertion | v2.6 P64 (2026-04-28) | Surfaces races as soft assertions instead of silent skips |
| `waitForLoadState('networkidle')` | Element-state `locator.waitFor({ state: 'visible' })` | Playwright 1.34+ (DISCOURAGED notice) | Reliable; networkidle is heuristic and fragile |
| Custom JS polling loops | `expect.poll` / `expect.toPass` | Playwright 1.32+ | Native back-off + timeout + message |
| Raw `page.locator('[data-testid="x"]')` | `page.getByTestId('x')` | Playwright 1.27+ | Cleaner, registered via `tests/utils/testIds.ts` |
| `page.locator('button:has-text("X")')` | `page.getByRole('button', { name: /x/i })` | Playwright 1.27+ | Accessibility-first; locale-resilient with regex |
| `if (await x.isVisible()) expect(x).toBeY()` | `await expect(x).toBeVisible(); expect(x).toBeY();` | Web-first assertions (Playwright 1.20+) | Auto-retry; no false-pass branch |
| Manual JSON walking for parity | `flattenReport(rep)` + `categorizeStatus(raw, err)` | v2.5 P59 + v2.6 P64 | Battle-tested; encoded in `regen-constants.mjs` |

**Deprecated/outdated:**
- **`networkidle` wait state**: Playwright explicitly DISCOURAGED. 6 sites in this codebase. [CITED: playwright.dev/docs/api/class-page#page-wait-for-load-state]
- **`waitForTimeout(N)` for state-waits**: Code-smell; 2 sites. Replace with `expect.poll` or proper `waitFor`.
- **`test.skip(true, ...)` as a flake-mask**: superseded by P64 D-11 pattern.
- **REQUIREMENTS.md "98 warnings"**: stale (actual: 103 at HEAD). CONTEXT D-03 mandates re-baseline.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 36-test race anchor (15 DATA_RACE + 21 CASCADE_BASELINE) is stable enough at HEAD `2c7ad2dea` for Plan 1's 3-run inventory to produce a closed list | Race anchor (CONTEXT D-01) | If the anchor shifts (e.g., due to imgproxy 502 cluster or new flakes since v2.8 close), Plan 1 must re-derive the list and the planner re-scopes Plans 3-5. Capture as Plan 1 deliverable. | [ASSUMED — confirmed by P64 verification but not re-verified at v2.9 start] |
| A2 | `getByTestId` will be the dominant rewrite target for the 37 `no-raw-locators` sites because the registry has 350+ usages | Pattern 3 (Semantic Locator Hierarchy) | If a significant share of sites turn out to be CSS-only patterns with no semantic equivalent (e.g., `:has(.btn-warning)`), Plan 2 may need to add new testids to the registry, which creates a coordinated frontend-component edit. CLAUDE.md TypeScript strictness applies. | [ASSUMED — based on probing only 5 sample sites in voter-results / voter-detail / candidate-settings; full inventory pending Plan 2] |
| A3 | The `regen-constants.mjs` script in `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/` is still runnable at HEAD | Plan 6 parity-gate restoration | If the script depends on a removed in-tree path (e.g., the post-fix JSON it expects), Plan 6 must adapt the script's input path. The script has no external deps beyond `node:fs`/`node:path`/`node:url` so the risk is local-only (input file path). | [VERIFIED: read script source; only dep is the input JSON path which Plan 6 controls] — downgrade from ASSUMED to VERIFIED |
| A4 | The 6 `no-networkidle` sites + 37 `no-raw-locators` sites can all be rewritten without behavioral change (Plan 2 "mechanical, zero risk") | Pattern 2 + 3 | If any networkidle site is masking a real load-order race that the test depends on, the rewrite to `waitFor` may surface a previously-hidden failure. Plan 2 verification (single suite smoke) is the safety net. | [ASSUMED — based on Playwright docs guidance + P64 precedent of similar rewrites] |
| A5 | The 18 `no-conditional-expect` sites are mostly subsets of the 36 `no-conditional-in-test` sites (paired flagging) | Pattern 5 | If they're disjoint, Plans 3-5 must address each set independently, expanding scope. Probe in Plan 1 inventory: count overlap explicitly. | [ASSUMED — observed pattern; Plan 1 verifies via grep overlap] |
| A6 | The bank-auth file's 17 lint warnings (the heaviest concentration) include the 1 `no-skipped-test` + 16 conditional/raw-locator entries that don't trigger D-07 (the inline justification only covers the 1 skip) | Plan structure / DETERM-03 | If the bank-auth file's 16 non-skip warnings turn out to require the same env-gated treatment, the lint-gate bump in Plan 6 might fail at this file. Plan 5 (whichever owns bank-auth) must address all 16 non-skip warnings normally. | [ASSUMED — file shape is JWE/JWT crypto-heavy, possibly with valid raw-locator and conditional patterns; full read pending] |
| A7 | The post-Phase-73 PASS_LOCKED count will likely SHIFT from P64's 66 due to test splits from `no-conditional-in-test` rewrites | Plan 6 regen | Plan 6 regen produces a NEW anchor; downstream phases (74-77) parity-check against the NEW baseline. The 67p/1f/34c shape is P64's, not Phase 73's. | [ASSUMED — pattern: split-into-separate-tests is one of the rule-author canonical rewrites; expect counts to grow] |

**If this table is empty:** All claims in this research were verified or cited.

**Action for planner:** Items tagged ASSUMED above are flagged for `discuss-phase` review. None are blockers; the 3-run Plan 1 inventory and the per-spec investigative passes will resolve them empirically.

## Open Questions

1. **What's the exact overlap between `no-conditional-in-test` (36) and `no-conditional-expect` (18)?**
   - What we know: They typically co-flag (an `if (...) expect(...)` triggers both).
   - What's unclear: Plan 1 must produce the overlap matrix per spec.
   - Recommendation: Plan 1's inventory grep — `awk '/no-conditional-in-test/||/no-conditional-expect/ ...' /tmp/lint.out` — counts shared file:line pairs. If the overlap is high (>80%), Plans 3-5 can address them as one rewrite per site; if low, they need separate passes.

2. **Where does `diff-playwright-reports.ts` land?**
   - What we know: CONTEXT D-08 leaves the path open. The historical path (`.planning/phases/59-e2e-fixture-migration/scripts/`) was deleted in v2.7.
   - What's unclear: Three candidates — `tests/scripts/`, `scripts/` (root), or `.planning/phases/73-determinism-baseline/scripts/`.
   - Recommendation: Land at `tests/scripts/` for workspace-scoped tooling consistency. Rationale: (a) it sits with the test infrastructure it serves; (b) `tests/` is an existing directory unlike `scripts/` (root); (c) `.planning/` paths are designed for ephemeral phase artifacts, not permanent tools. Planner makes final call.

3. **Will any of the 36-race investigations escalate beyond the ≤50 LOC code cap?**
   - What we know: D-05 caps; D-02 closure tolerates legitimate post-73 DATA_RACE pool members.
   - What's unclear: Until Plan 1's reproduction, we don't know how many races have a code-level root cause. Risk: high (per STATE.md line 119).
   - Recommendation: Plan 1's inventory tags each of the 36 tests with a "likely fix tier" hypothesis (test-level / small-code / large-code). Plans 3-5 escalate per CONTEXT D-05 — capture todo + leave in pool. The 14 imgproxy-tied tests are EXPECTED to remain in pool (infrastructure flake, OOS).

4. **Does the post-73 lint-gate bump need to handle the bank-auth file specially?**
   - What we know: D-07 covers 1 site (the skip); the bank-auth file has 17 total warnings.
   - What's unclear: Whether the other 16 warnings can be fully resolved or whether some need bank-auth-specific justification (e.g., raw HTTP fetch patterns that can't use Playwright locators).
   - Recommendation: A plan that owns bank-auth (likely Plan 5) reads the file end-to-end and addresses all 17 warnings. The 1 skip gets D-07's inline justification; the 16 others get standard rewrites. If any of the 16 truly need justification, document inline per the same `// reason:` + ESLint disable convention.

5. **Where does the v2.6 P64 / v2.8 reference parity baseline JSON live for diff input?**
   - What we know: P64 captured at `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` — but Phase 73's diff target is the NEW post-Phase-73 baseline, not the P64 baseline.
   - What's unclear: Whether Plan 6 should diff Phase 73 runs against P64's baseline (regression-detection mode) OR diff run-1/run-2/run-3 against each other (determinism-detection mode).
   - Recommendation: BOTH. Plan 6 first runs determinism-mode (run-1 vs run-2 vs run-3 — no diffs, identical pass/fail set), THEN regression-mode against P64 baseline (only the imgproxy-tied + intentional Phase-73 fixes change; everything else is locked). The regen of constants comes AFTER both passes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `node` | All workflow | ✓ | (project version, see `.nvmrc` if any) | — |
| `yarn` (4.x) | All workflow | ✓ | 4.x | — |
| `tsx` | Plan 6 parity-script run | ✓ (transitively via deps) | catalog | `npx tsx` |
| `@playwright/test` | All E2E runs | ✓ | 1.58.2 | — |
| Supabase CLI | `yarn dev:reset-with-data` | ✓ | (in lockfile) | — |
| Local imgproxy (Docker) | Image upload tests | ⚠ Intermittent flake | (Docker container) | Restart: `supabase stop && supabase start`; tag tests as DATA_RACE pool |
| `apps/frontend/node_modules/.vite` cache | Cold-start runs | ✓ | — | D-10 wipe recipe |

**Missing dependencies with no fallback:** None blocking.

**Missing dependencies with fallback:**
- Imgproxy 502: documented infrastructure debt; restart Supabase between gate runs. The 14 imgproxy-tied tests are pre-classified into DATA_RACE pool — failures here are expected, not regressions.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `@playwright/test` 1.58.2 (E2E) + `vitest` (unit) |
| Config file | `tests/playwright.config.ts` (E2E) + per-package `vitest.config.ts` (unit) |
| Quick run command | `yarn test:e2e --grep "<spec-name>"` (per-spec smoke) + `yarn lint:check` (per-rule grep) |
| Full suite command | `yarn test:e2e --workers=1` + `yarn test:unit` + `yarn lint:check` + `yarn build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DETERM-01 | Zero `test.skip(true, …)` outside comments after sweep; suite shows 0 skipped on green run | smoke | `git grep -nE "test\\.skip\\(true," tests/` returns no matches outside comments | ✅ existing, only 1 site (`tests/tests/specs/candidate/candidate-bank-auth.spec.ts:199`) |
| DETERM-01 | Bank-auth skip carries inline justification + ESLint disable | grep | `grep -B2 'test\\.skip(!createdUserId' tests/tests/specs/candidate/candidate-bank-auth.spec.ts \| grep -E "// reason:\|eslint-disable"` | ✅ rewrite target |
| DETERM-02 | 3 cold `--workers=1` runs produce identical pass/fail sets | integration | `for i in {1..3}; do yarn test:e2e --workers=1 --reporter=json > run-${i}.json; done; tsx <parity-script> run-1 run-2; tsx <parity-script> run-2 run-3` | ✅ Plan 6 task |
| DETERM-02 | Parity-script constants regenerated from new baseline | smoke | `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` (adapted from P64) | ✅ Plan 6 — restored from P64 |
| DETERM-02 | Each remaining DATA_RACE pool member justified per-test in VERIFICATION.md | manual | Read `73-VERIFICATION.md` table | ⏳ Plan 6 deliverable |
| DETERM-03 | `yarn lint:check` exits 0 with 0 warnings across all workspaces | smoke | `yarn lint:check 2>&1 \| grep -E "warning\|error" \| wc -l` returns 0 (or only non-playwright trace lines) | ✅ existing tooling |
| DETERM-03 | Each of 7 `playwright/*` rules at 0 warnings | smoke per-rule | `yarn lint:check 2>&1 \| grep "playwright/<rule>" \| wc -l` returns 0 | ✅ rules already configured |
| DETERM-03 | `tests/eslint.config.mjs` has all 7 `playwright/*` rules at `'error'` | grep | `grep -E "playwright/.*'error'" tests/eslint.config.mjs \| wc -l` returns ≥7 | ✅ Plan 6 final step |

### Sampling Rate

- **Per task commit:** `yarn lint:check 2>&1 | grep "playwright/<rule>"` (per-rule grep) + `yarn test:e2e --grep "<spec>"` (single-spec smoke)
- **Per wave merge:** `yarn lint:check` (full) + `yarn test:e2e --workers=1` (full suite, single run)
- **Phase gate:** Full 3-run determinism gate + parity-script self-identity smoke + `yarn lint:check` 0/0 + `yarn build` + `yarn test:unit`

### Wave 0 Gaps

- [ ] `tests/scripts/diff-playwright-reports.ts` (or chosen path) — Plan 6 restores from git blob `2832c4410` (D-08); does not exist at HEAD
- [ ] `.planning/phases/73-determinism-baseline/post-fix/` directory — Plan 6 creates; mirrors P64's `post-fix/` artifact location
- [ ] `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` — adapted copy of P64's regen script (path to input JSON updated to point at `73-determinism-baseline/post-fix/run-3-report.json`)
- [ ] No new test files; no framework install needed

## Sources

### Primary (HIGH confidence)
- `tests/playwright.config.ts` — workers, reporters, project dependency graph [VERIFIED: read]
- `tests/eslint.config.mjs` — all 7 `playwright/*` rules currently at `'warn'` [VERIFIED: read]
- `tests/tests/utils/testIds.ts` — central registry, 350+ usages, mature [VERIFIED: grep]
- `tests/tests/specs/voter/voter-results.spec.ts` — canonical `expect.poll` exemplar at lines 318-323 [VERIFIED: read]
- `.planning/phases/73-determinism-baseline/73-CONTEXT.md` — D-01 through D-10 locked decisions [VERIFIED: read]
- `.planning/REQUIREMENTS.md` §DETERM — DETERM-01/02/03 success criteria [VERIFIED: read]
- `.planning/ROADMAP.md` §Phase 73 — 5 success criteria + dependency map [VERIFIED: read]
- `.planning/STATE.md` — risk profile (high) + plan-shape estimate (4-6) [VERIFIED: read]
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` D-07/D-08/D-09/D-10 — race-tolerant pattern + parity-script regen protocol [VERIFIED: read]
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-VERIFICATION.md` — verdict shape, self-identity smoke output, 5/5 PASS table [VERIFIED: read]
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` — constants regenerator [VERIFIED: read]
- `.planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` — lighter v2.7 parity reference [VERIFIED: read]
- `.planning/milestones/v2.8-MILESTONE-AUDIT.md` §"Bundled Manual Smoke (2026-05-10)" — vite-cache wipe recipe [VERIFIED: read]
- Git blob at SHA `2832c4410` — last-known-good `diff-playwright-reports.ts` (466 LOC, with PASS_LOCKED 66 + DATA_RACE 15 + CASCADE 21) [VERIFIED: `git show 2832c4410:.../diff-playwright-reports.ts`]
- Git commit `64ccbe284` — deletion commit (4791 lines removed at v2.7 milestone start) [VERIFIED: `git show 64ccbe284 --stat`]
- `playwright.dev/docs/best-practices` — locator priority order [CITED]
- `playwright.dev/docs/test-assertions` — `expect.poll` parameters (timeout/intervals/message) [CITED]
- `playwright.dev/docs/api/class-page#page-wait-for-load-state` — `networkidle` DISCOURAGED [CITED]
- `github.com/playwright-community/eslint-plugin-playwright/docs/rules/no-conditional-in-test.md` — 3 canonical rewrite patterns [CITED]
- `github.com/playwright-community/eslint-plugin-playwright/docs/rules/no-conditional-expect.md` — `getError` wrapper pattern [CITED]
- `yarn lint:check` output at HEAD — exact 103-warning split (37+36+18+6+2+1+1) [VERIFIED: ran command]
- `package.json` — `@playwright/test` 1.58.2 + `eslint-plugin-playwright` 2.9.0 [VERIFIED: grep]

### Secondary (MEDIUM confidence)
- `.planning/notes/2026-05-10-v2.9-e2e-coverage-inventory.md` — operator framing of determinism-first strategy [VERIFIED: read; operator-authored]
- `.planning/todos/pending/2026-04-27-remove-e2e-skip-modifiers.md` — DETERM-01 protocol (Removable / Documented-flake / Genuinely conditional) [VERIFIED: read]
- `.planning/todos/pending/2026-05-10-tests-playwright-hygiene-sweep.md` — DETERM-03 inventory + per-rule sweep order + final lint-gate bump [VERIFIED: read]
- CLAUDE.md §"Context Destructuring Rule (Svelte 5)" — applicable if a code-level race fix touches a context consumer [VERIFIED: read]

### Tertiary (LOW confidence)
- _(none — all claims either verified against tooling output, code, or cited primary sources)_

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — all versions probed against `package.json` + lockfile; no inferred versions
- Architecture / Plan order: **HIGH** — CONTEXT D-04 binds; P64 precedent explicit; rule-author docs cited for rewrite patterns
- Pitfalls: **HIGH** — pitfalls 1-5 verified against P64 + v2.8 audit + STATE.md; pitfalls 6-8 verified against codebase grep
- Race anchor (36 tests): **HIGH** — directly read from git blob `2832c4410:diff-playwright-reports.ts` lines 53-138; matches CONTEXT D-01 binding
- Lint warning split (103): **HIGH** — directly probed via `yarn lint:check` at HEAD; matches CONTEXT D-03 expectation
- Bank-auth skip (D-07): **HIGH** — single site verified at `candidate-bank-auth.spec.ts:199`; pattern from v2.8 P70 + v2.8 P71 D-04 anchors

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (30 days for stable; the 36-test anchor is bound to HEAD `2c7ad2dea` per CONTEXT D-01 — re-verify if HEAD advances substantially before Plan 1 runs)

---

*Phase: 73-determinism-baseline*
*Research compiled: 2026-05-10*
