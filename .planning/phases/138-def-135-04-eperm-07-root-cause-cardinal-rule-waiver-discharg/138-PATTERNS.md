# Phase 138: DEF-135-04 — `EPERM-07` Root Cause + Cardinal-Rule Waiver Discharge — Pattern Map

**Mapped:** 2026-08-13
**Files analyzed:** 11 (4 create, 4 modify code/docs-in-tree, 3 create/modify planning records)
**Analogs found:** 8 / 11 (3 have no analog — new convention, flagged explicitly)

RESEARCH.md is authoritative and already carries verbatim excerpts for most target files. This
document does **not** duplicate them; it answers the six pattern questions with the *analog* code the
new files should copy, and flags the three places where the planner is establishing a **new
convention** rather than following one.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| CREATE `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` | test (E2E spec, LEAF) | request-response / event-driven | `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` | **exact** |
| MODIFY `tests/playwright.config.ts` (new project entry + `video`) | config | — | `cold-entry-dataroot` project entry, `playwright.config.ts:333-340` | **exact** |
| CREATE `tests/tests/fixtures/shared/forensicCapture.fixture.ts` | fixture (capture seam) | event-driven (`page.on`) | `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` | **role-match** (see divergence below) |
| MODIFY `tests/tests/fixtures/voter/views.ts` (register auto fixture) | fixture composition root | — | `views.ts:56-81` `base.extend` block | **role-match** — but `auto: true` is **new convention** |
| CREATE `tests/scripts/determinism-batch.sh` (run wrapper) | script (orchestration) | batch | `apps/supabase/benchmarks/scripts/run-benchmarks.sh` | **partial** — no E2E script analog exists |
| MODIFY `tests/tests/specs/voter/voter-journey.spec.ts:858` | test | — | in-file: the hard `expect(...)` at line 862 | **exact** |
| Possible app-side fix: `QuestionHeading.svelte` / `+layout.svelte` / `viewTransition.ts` | component / layout / utility | event-driven | — | contingent (D-05/D-06) |
| CREATE `138-NEGATIVE-CONTROL.md` | doc | — | `137-NEGATIVE-CONTROL.md` | **exact** |
| CREATE `138-DETERMINISM-LEDGER.md` | doc | — | none | **no analog — new convention** |
| MODIFY `.planning/v2.14-CARDINAL-RULE-WAIVER.md`, `STATE.md`, `MILESTONES.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `deferred-items.md` | doc | — | RESEARCH §R7.1 grep-complete table | n/a |
| MODIFY `tests/README.md:129,133` (F-1/F-2 stale claims) | doc | — | — | n/a |

---

## Pattern Assignments

### Q1 — `tests/playwright.config.ts` project entry shape

**Analog:** the `cold-entry-dataroot` LEAF entry, `tests/playwright.config.ts:329-341` (verbatim,
including its comment discipline — every LEAF entry in this file carries a block comment naming the
phase, the requirement id, the data posture, and *why its `testMatch` does not collide with siblings*):

```ts
    // cold-entry-dataroot (Phase 117 COLD-03) — LEAF. Read-only cold/direct-URL
    // entry regression for the dataRoot #version-bridge alias-indirection
    // staleness (Spike 024). Reads the base dataset read-only (no teardown of its
    // own). `testMatch` is scoped to the cold-entry spec; `voter-journey`'s
    // `testMatch` (/voter-journey\.spec\.ts/) excludes this file, so neither
    // project picks up the other's specs.
    {
      name: 'cold-entry-dataroot',
      testDir: './tests/specs/voter',
      testMatch: /cold-entry-dataroot\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },
```

Four sibling entries repeat this exact shape — `voter-dark-mode` (`:349-355`), `voter-alliance`
(`:392-398`), `voter-nominations` (`:404-410`), and the `use`-override variant
`voter-journey-mobile` (`:365-380`, which shows how to extend `use` beyond the descriptor). The
`voter-journey` entry itself is `:319-326`, which is where the D-09 `video` key lands:

```ts
    {
      name: 'voter-journey',
      testDir: './tests/specs/voter',
      testMatch: /voter-journey\.spec\.ts/,
      fullyParallel: false, // single-test serial journey
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-base']
    },
```

Copy: the block comment, `testDir: './tests/specs/voter'`, an **exact** `testMatch` regex,
`use: { ...devices['Desktop Chrome'] }`, `dependencies: ['data-setup-base']`. Do **not** put the new
spec under `_probes` — `playwright.config.ts:416-420` + `package.json:27`
(`--grep-invert @probe`) make `@probe`-tagged specs invisible to the 16-run gate.

**Naming constraint (carried from RESEARCH §R4.2):** `voter-journey`'s `testMatch`
`/voter-journey\.spec\.ts/` is unanchored, so any filename containing that substring would be
double-claimed. `eperm07-term-trigger.spec.ts` is safe.

---

### Q2 — shared-fixture shape and how fixtures are composed/registered

There are **two distinct, established conventions** in this repo, and the RESEARCH recommendation
crosses from one to the other. The planner must decide deliberately.

**Convention A (dominant for `fixtures/shared/`) — standalone factory module, imported directly by
the spec, NOT extended into a composition root.** This is stated in the fixtures' own docblocks:

- `tests/tests/fixtures/shared/video.fixture.ts:6` — verbatim: `under tests/tests/fixtures/shared/ (NOT extended into a voter- or`
- `tests/tests/fixtures/shared/popupNotice.fixture.ts:6` — verbatim: `tests/tests/fixtures/shared/ (NOT extended into a composition root) so it is`

Call sites import the factory directly, e.g. `tests/tests/specs/voter/voter-prefs-tracking.spec.ts:57`:

```ts
import { createTrackingIntercept } from '../../fixtures/shared/trackingIntercept.fixture';
```

The closest structural analog for a **capture seam** (as opposed to a page-object reader) is
`tests/tests/fixtures/shared/trackingIntercept.fixture.ts`. Copy from it:
- the long `@file` docblock naming the requirement id (`EFLOW-08`), the *verified emission boundary*, the arming prerequisites, and a `## Surface` bullet list of the exported methods;
- the closing **rigidity contract** paragraph, verbatim pattern (`trackingIntercept.fixture.ts:49-53`):
  ```
   * **Rigidity contract**: no `expect.soft`, no `try/catch` wrapping
   * `expect(...)`, no `.catch(() => null)` on assertion-bearing interactions.
   * This fixture performs no assertions itself (it is a capture seam) — the
   * consuming spec asserts against `getTrackCalls()`.
  ```
- `import type { Page } from '@playwright/test';` + a `create*`/factory export returning a plain object of readers.

**Convention B (composition root) — `tests/tests/fixtures/voter/views.ts:56-81`**, the only voter
root and the one `voter-journey.spec.ts:26` imports:

```ts
export const test = base.extend<ViewFixtures>({
  resultsPage: async ({ page }, use) => {
    await use(createResultsPage(page));
  },
  entityFilters: async ({ page }, use) => {
    await use(createEntityFilters(page));
  },
  …
});

export { expect };
```

with the fixture type declared separately (`views.ts:41-54`, `type ViewFixtures = { … }`) and each
group annotated by originating phase (`// Phase-119 EPERM voter-scoped readers (Plan 06).`).

**Divergences the planner must state explicitly:**
1. **`auto: true` has no precedent anywhere in `tests/tests`** (RESEARCH §R3.3, verified). Registering
   `forensicCapture` as an auto fixture in `views.ts` is a **new convention**, and it contradicts
   Convention A's "NOT extended into a composition root" note that every other `fixtures/shared/*`
   file carries. Both facts belong in the plan's rationale.
2. **Blast radius:** 16 files import `fixtures/voter/views` (RESEARCH §R3.3). Auto-registration
   attaches listeners to all of them — which is precisely the D-11 / waiver-condition-3 goal, but
   must be a decision, not a side effect.
3. `views.ts` is `base.extend`-ing raw `@playwright/test`; there is exactly one existing `page.on`
   usage in the whole suite (`tests/tests/specs/perf/performance-budget.spec.ts:110`, inline and
   spec-local).

---

### Q3 — `_probes/questionInfo.probe.spec.ts` end to end (read; **use as the wrong shape, not the skeleton**)

Read in full (`tests/tests/specs/_probes/questionInfo.probe.spec.ts`, 85 lines). Its structure:

1. `@file` docblock naming the fixture under test, the probe convention, an explicit
   `## SEED (out-of-band pre-step)` block (`yarn db:seed --template perm-interactive-info`) and an
   explicit `## RUN (single-file, isolated)` block with the literal command.
2. Imports (lines 32-34): `import { expect, test } from '../../fixtures/voter/views';`,
   `import { walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';`,
   `import { testIds } from '../../utils/testIds';`
3. Suite tagged for the probe filter: `test.describe('@probe questionInfo fixture (EPERM-07)', …)`
4. Navigation body (lines 40-48) — the reusable part:
   ```ts
   await walkUntilQuestionsIntro(page);
   await voterQuestionsPage.clickStart();
   await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible();
   ```
5. A long trailing `NOTE (Phase 120-01)` comment recording what the probe deliberately does **not**
   prove and where it is deferred — the documentation discipline worth copying.

**Verdict (matches RESEARCH §R4.1):** copy items 2 and 4 only. Items 1 and 3 are the `_probes`
contract (`@probe` tag, out-of-band seed, no `data-setup` dependency) and would make the hunt spec
invisible to the 16-run gate.

**The actual skeleton analog is `tests/tests/specs/voter/cold-entry-dataroot.spec.ts:1-30`** — same
role (LEAF regression spec on `data-setup-base`), same data flow, and the same *negative-control*
posture this phase needs:

```ts
/**
 * Cold / direct-URL entry dataRoot reactivity regression (Phase 117 COLD-03).
 *
 * Root cause (LOCKED — debug `dataroot-stale-direct-nav` + Spike 024): …
 *
 * These tests are the negative control for the COLD-01 codemod: they FAIL against
 * the pre-fix (aliased) source (the data-dependent region never appears → timeout)
 * and PASS once each consumer reads `ctx.dataRoot.<prop>` directly in its tracking
 * scope. …
 *
 * Seed: `data-setup-base` (`e2e/base`) — multi-election. Voter routes are public
 * (no auth). Post-hydration mount hazard: the list mounts a beat after navigation,
 * so use the WAITING assertion `toBeVisible({ timeout })`, never one-shot `isVisible()`.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no
 * expect.soft, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';

test.describe('cold-entry-dataroot', () => {
```

Copy: the docblock sections in this exact order — *root cause (LOCKED)* → *negative-control claim
(FAILs pre-fix, PASSes post-fix)* → *Seed* → *Rigidity contract* — then `test.describe('<project
name>', …)` matching the project name 1:1. Note the import root differs: `cold-entry-dataroot` imports
`@playwright/test` directly (it needs no view fixtures); the hunt spec needs
`voterQuestionsPage`, so it imports `../../fixtures/voter/views` as the probe does.

---

### Q4 — existing shell scripts for orchestrating E2E runs

**No analog — new convention.** Verified: `tests/scripts/` does not exist, root `scripts/` does not
exist, and the complete set of `.sh` files in the repo (excluding `node_modules`/`.git`) is:

```
./.claude/scripts/audit-skill-drift.sh
./apps/supabase/benchmarks/scripts/run-benchmarks.sh
./apps/supabase/benchmarks/scripts/swap-schema.sh
./apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh
./apps/supabase/benchmarks/scripts/run-optimization-benchmarks.sh
```

**Nothing in `tests/` is orchestrated by a shell script today** — E2E entry points are npm scripts
only (`package.json:27-28`). The determinism-batch wrapper establishes a new location and a new
convention. The planner should say so.

The nearest *stylistic* precedent is `apps/supabase/benchmarks/scripts/run-benchmarks.sh:1-40`, and it
is a good one to copy from — it is a long-running, multi-iteration, results-emitting batch orchestrator:

```bash
#!/usr/bin/env bash
#
# run-benchmarks.sh -- Orchestrate full JSONB vs relational benchmark suite
#
# Usage:
#   ./run-benchmarks.sh --quick                    # 1K only, 10s runs, both schemas
#   ./run-benchmarks.sh --full                     # 1K/5K/10K, 30s runs, both schemas
#
# Prerequisites:
#   - Supabase local dev stack running (supabase start)
#   …
# The script automatically:
#   1. Swaps schema (JSONB or relational)
#   …

set -euo pipefail

# Auto-detect paths from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BENCHMARKS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$BENCHMARKS_DIR/results"

# Database connection
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-54322}"
```

Conventions to copy verbatim:
- `#!/usr/bin/env bash` (not `#!/bin/bash`)
- header comment block with `# Usage:`, `# Prerequisites:`, and a numbered "The script automatically:" list
- `set -euo pipefail` immediately after the header
- **script-location-relative path auto-detection** via `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` — makes the wrapper cwd-independent, which matters because `tests/playwright.config.ts` already had a spawn-cwd incident (documented at `playwright.config.ts:1135-1147`)
- env-var defaults with `"${VAR:-default}"` — the shape `FRONTEND_PORT` should use
- `swap-schema.sh:1-25` shows the same header/`set -euo pipefail`/`SCRIPT_DIR` triple, confirming it is the house style rather than one file's habit.

`run-benchmarks.sh` does **not** demonstrate per-iteration exit-code capture or a machine-readable
ledger — those parts of the wrapper are new. RESEARCH §R5.4 supplies the mechanism
(`PLAYWRIGHT_JSON_OUTPUT_FILE` / `PLAYWRIGHT_HTML_OUTPUT_DIR`, both verified in the installed
Playwright) and the per-run field table; there is no in-repo analog to copy for it.

---

### Q5 — how existing specs read env-var-driven test configuration

**No dedicated env-config module exists in `tests/`.** Verified: `tests/tests/helpers/` contains
`index.ts`, `navigation.ts`, `select.ts`, `settle.ts`, `timeouts.ts` — none of them read `process.env`.
Env reads are **inline at module scope in the consuming file**, with a `??` default. Complete list of
the pattern in `tests/tests`:

| Site | Excerpt |
|---|---|
| `tests/tests/utils/supabaseAdminClient.ts:58` | `const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';` |
| `tests/tests/fixtures/shared/emailBucket.fixture.ts:36` | `const MAILPIT_URL = process.env.INBUCKET_URL ?? 'http://localhost:54324';` |
| `tests/tests/fixtures/shared/emailBucket.fixture.ts:221` | `const frontendPort = process.env.FRONTEND_PORT ?? '5173';` |
| `tests/tests/support/mockOidcIssuerEntry.ts:19` | `const PORT = process.env.MOCK_OIDC_PORT ? Number(process.env.MOCK_OIDC_PORT) : 9443;` |
| `tests/tests/setup/shared/setupFromTemplate.ts:98` | `const requireFresh = process.env.E2E_REQUIRE_FRESH_DB === 'true';` |
| `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:39-52` | `?? ` default **plus** a fail-fast `if (!process.env.X) { … }` guard for required vars |

**Copy for `EPERM07_FORCE_*`:** module-scope `const NAME = Number(process.env.EPERM07_… ?? <default>);`
with SCREAMING_SNAKE local name — exactly the `mockOidcIssuerEntry.ts:19` numeric-coercion shape and
the `emailBucket.fixture.ts:36` `??`-default shape. This is precisely what RESEARCH §R2.3 / §R4.4
propose, so that proposal **is** in-convention (RESEARCH marks it `[ASSUMED]`; it can be upgraded —
the pattern exists, just not for a test-behaviour knob).

Boolean knobs: `setupFromTemplate.ts:98`'s `=== 'true'` explicit-string compare is the only boolean
precedent; RESEARCH §R4.4's bare `if (process.env.EPERM07_NO_VT)` truthiness check is **not**
in-convention. Prefer `process.env.EPERM07_NO_VT === 'true'`.

The **config**-level pattern for opt-in behaviour is different and should not be borrowed here:
`playwright.config.ts` uses `...(process.env.PLAYWRIGHT_VISUAL ? […] : [])` spread-gates
(`:163, 186, 198, 210, 228, 256, 1133`) to add/remove whole projects. That is for project gating, not
for a per-assertion budget.

---

### Q6 — where `TIMEOUTS` lives and what override seams exist

**Definition:** `tests/tests/helpers/timeouts.ts:25-39` — a single frozen literal, `as const`, plain
numeric literals, **no env override, no injection seam**:

```ts
export const TIMEOUTS = {
  /** Per-element visibility/enabled budget (no URL change). */
  element: 2_000,
  /** Action-ack budget (click registered, dropdown opened, modal dismissed). */
  click: 2_000,
  /** URL-change / route-transition wait (single navigation). */
  page: 5_000,
  /** Multi-network-roundtrip + render boundary; cold-start friendly. Use sparingly. */
  slowPage: 10_000,
  testMax: 90_000
} as const;
```

Re-exported by `tests/tests/helpers/index.ts`; imported as `import { TIMEOUTS } from '../../helpers';`
(`voter-journey.spec.ts:30`, `cold-entry-dataroot.spec.ts:28`). Also consumed by the config itself:
`playwright.config.ts` `timeout: TIMEOUTS.testMax` — so `timeouts.ts` is **shared between config and
specs**, widening the blast radius of any edit.

**Its own docblock forbids raising it** (`timeouts.ts:16-21`) and prescribes the only sanctioned
deviation seam:

> A per-test budget ABOVE this value is a NO-OP unless the spec calls `test.setTimeout(...)`, and any
> value above 90s must stay inline at the call site as a named `// reason:` exception (see
> perm-localisation-positive 180s and voter-journey 120s). Do NOT raise this default.

**Established seam = the inline, file-local, `// reason:`-annotated constant at the call site.** There
is precedent for *raising* inline (the two named specs) but **no precedent for shrinking** one. So:
the file-local `const FORCED_BUDGET = Number(process.env.EPERM07_FORCE_BUDGET_MS ?? TIMEOUTS.element)`
of RESEARCH §R2.3 follows the *shape* of the sanctioned seam (file-local + `// reason:` comment) in a
direction the docblock does not cover. State that in the plan; do not present it as an existing pattern.

**Rejected seams, with grounds:** `test.use({ actionTimeout })` does not govern
`expect(locator).toBeVisible({ timeout })` when an explicit timeout is passed (and every call site
passes one); `expect.configure` likewise. Editing `timeouts.ts` itself would touch the config's
`timeout` and all 88 suite files — a direct violation of D-01's reversibility clause.

---

### Q7 (bonus) — `138-NEGATIVE-CONTROL.md` document shape

**Analog:** `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md`
(673 lines; copy the *skeleton*, not the length). Its heading spine, extracted:

```
# Phase 137 — Negative Control: <what was controlled>
<one-paragraph thesis: two runs, N halves, one machine, one session>
- **Date:** / **Plan:** / **Decisions discharged:** / **Requirements:** / **Precedent followed:**
## 1. Why this run existed          ← quotes the ROADMAP criterion verbatim as a blockquote
## 2. Environment                    ← full machine stamp; subsections "Port allocation", "`lsof` for every port involved"
## 3. The adversary (D-11) — rebuildable on any machine   ← here: the forcing harness (throttle rate + budget), stated so it is reproducible
### Observed: the adversary reproduces both shapes
## 4. RUN 1 — blindness: the retired check                ← here: PRE-FIX under the forcing harness → FAILS
### 4.1 Provenance   ### 4.2 The throwaway script — verbatim, NOT committed   ### 4.3 Both halves, observed   ### 4.4 The finding
## 5. RUN 2 — the catch: the committed <guard>            ← here: POST-FIX under the byte-identical harness → PASSES
### 5.4 The four run records, side by side
## 6. Invocation matrix — the gate cannot be routed around
```

Two properties are load-bearing and must carry over: (a) the environment stamp is *full* (date, repo
root, git HEAD, OS, Node, Vite, SvelteKit, Playwright, Supabase) so the pair is reproducible; (b) the
forcing configuration must be **byte-identical across the two halves** and printed in both (RESEARCH
§R2.5). `137-NEGATIVE-CONTROL.md:11` also names *its* own precedent
(`136-VISUAL-DISCRIMINATION-EVIDENCE.md`) — continue that chain and cite 137.

**`138-DETERMINISM-LEDGER.md`: no analog — new convention.** RESEARCH §R5.4 supplies the field list
(run index, ISO start/end, exit code, executed/passed/failed/flaky/did-not-run, preflight verdict via
`grep -c 'E2E PREFLIGHT FAILED'`, the EPERM-07 step outcome, devserver log path, git HEAD). Propose
one markdown table, one row per run, plus a prose "aborts and discards" section — criterion 3 requires
16 *consecutive* runs, so aborts must be recorded rather than silently skipped.

---

## Shared Patterns

### Rigidity contract (applies to: the hunt spec, the forensic fixture)
**Source:** `cold-entry-dataroot.spec.ts:22-24`, `trackingIntercept.fixture.ts:49-53`

```
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no
 * expect.soft, no try/catch around expect(), no .catch fallback.
```

Every new spec/fixture in `tests/` closes its docblock with this paragraph. **Caveat specific to this
phase:** the hunt spec must *reproduce* `expectUrlChange`'s swallowed `.catch(() => null)`
(`voter-journey.spec.ts:189`) to reproduce the defect — so the contract statement needs an explicit
carve-out sentence naming that one deliberate exception, or it will read as a violation.

### Phase/requirement-id provenance comments (applies to: every file this phase touches)
**Source:** `playwright.config.ts:329` (`// cold-entry-dataroot (Phase 117 COLD-03) — LEAF.`),
`views.ts:51` (`// Phase-119 EPERM voter-scoped readers (Plan 06).`),
`trackingIntercept.fixture.ts:2` (`@file trackingIntercept fixture (EFLOW-08).`)

Every addition names `(Phase NNN <REQ-ID>)` at its head. Use `(Phase 138, D-NN)` / `INTEG-0N`.

### Sibling-`testMatch` non-collision note (applies to: the new project entry)
**Source:** `playwright.config.ts:334-337`, repeated at `:346-348`, `:389-391`, `:401-403`

Every LEAF project comment states why its `testMatch` does not overlap its siblings'. The new entry
must carry the equivalent sentence about `/voter-journey\.spec\.ts/`.

### Deliberate-omission `NOTE` blocks (applies to: the hunt spec, if a discriminator is deferred)
**Source:** `questionInfo.probe.spec.ts:60-85`

When a spec knowingly does not prove something, the repo records it inline with the phase id, the
verified blocker, and where it is deferred to — rather than leaving silence. If the hunt spec ships
without one of the three discriminators wired, use this shape.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `tests/scripts/determinism-batch.sh` | script | batch | No shell script orchestrates E2E anywhere in the repo; `tests/scripts/` and root `scripts/` do not exist. Nearest style precedent only: `apps/supabase/benchmarks/scripts/run-benchmarks.sh`. Per-iteration exit-code capture and the JSON ledger have no in-repo precedent at all. |
| `138-DETERMINISM-LEDGER.md` | doc | batch | D-12 declined the durable ledger; no phase-local per-run ledger document exists in `.planning/`. Field list from RESEARCH §R5.4; shape is the planner's to propose. |
| `auto: true` fixture registration in `views.ts` | fixture | event-driven | Zero `auto: true` usages in `tests/tests` (verified). Additionally contradicts the standing `fixtures/shared/*` docblock convention ("NOT extended into a composition root"). Needs an explicit rationale in the plan, not a silent adoption. |

---

## Metadata

**Analog search scope:** `tests/playwright.config.ts`, `tests/tests/{specs,fixtures,helpers,utils,support,setup}`, root `package.json`, repo-wide `*.sh`, `.planning/phases/137-*`
**Files read this session:** 12
**Pattern extraction date:** 2026-08-13
