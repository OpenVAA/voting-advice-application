# Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage - Pattern Map

**Mapped:** 2026-07-22
**Files analyzed:** 4 real touch-points (1 helper harden, 1 conditional spec assertion, 7 todo-lifecycle files, 1 triage doc + evidence artifacts)
**Analogs found:** 4 / 4 (this is a hardening/triage phase — every "modified" file has itself or a direct sibling as its own analog; almost no net-new code)

> **Phase shape caveat (read first):** This is NOT a build phase. There are essentially **no net-new source files**. The work is: (a) HARDEN one existing test helper, (b) CONDITIONALLY add one parity assertion to an existing spec, (c) STAMP + MOVE 7 existing todo files, (d) FILL an existing triage doc + capture evidence artifacts. "Pattern to copy from" therefore mostly means "match the conventions already living in the file you are editing and its siblings." Concrete anchors below.

## File Classification

| Modified/Created File | Role | Data Flow | Closest Analog | Match Quality |
|-----------------------|------|-----------|----------------|---------------|
| `tests/tests/utils/voterNavigation.ts` (§`navigateToFirstQuestion`, harden) | test-helper (nav) | request-response (wait/settle) | itself + `advanceVoterFlow` race loop in the same file | exact (self) |
| `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` OR `voter/voter-journey.spec.ts` (conditional parity assertion for todo #4) | test/spec | event-driven (popup lifecycle) | existing tests 2/3 in `perm-show-feedback-survey.spec.ts` (lines 74–107) | exact (self) |
| `.planning/todos/pending/*.md` → `.planning/todos/completed/*.md` (7 files, stamp + move) | config/lifecycle | file-I/O (move) | `.planning/todos/completed/2026-04-27-extend-e2e-filter-type-coverage.md` (resolves_phase → completed precedent) | exact (role-match) |
| `131-DISCUSSION-POINTS.md` §6 ledger + `post-fix/` evidence | doc / test-artifact | batch (evidence capture) | existing `131-DISCUSSION-POINTS.md` checkbox ledger (already scaffolded in phase dir) | exact (self) |

## Pattern Assignments

### `tests/tests/utils/voterNavigation.ts` — harden `navigateToFirstQuestion` (todo #7, D-03)

**Analog:** itself. Copy the wait/settle idioms already proven in `advanceVoterFlow` in the same file. Do NOT invent a new waiting primitive.

**Imports pattern** (lines 13–17) — reuse verbatim, no new imports needed for the harden:
```ts
import { SupabaseAdminClient } from './supabaseAdminClient';
import { testIds } from './testIds';
import { createVoterHomePage } from '../fixtures/voter/voterHomePage.fixture';
import { TIMEOUTS } from '../helpers';
import type { Locator, Page } from '@playwright/test';
```

**TIMEOUTS budgets to reuse** (`tests/tests/helpers/timeouts.ts:26-33`) — use the existing named budgets, never a raw literal:
```ts
element: 2_000,    // per-element visibility (no URL change) — the terminal answer-option settle
page:    5_000,    // single URL-change / route-transition wait
slowPage: 10_000,  // cold-start multi-roundtrip — already used by the current waitForURL
```

**Current terminal settle (the harden target, lines 282–295):**
```ts
export async function navigateToFirstQuestion(page: Page): Promise<void> {
  const voterHomePage = createVoterHomePage(page);
  await voterHomePage.goToPage('en');
  await voterHomePage.clickStart();
  await advanceVoterFlow(page, 'first-question');
  // /questions → /questions/__first__ onMount redirect guard:
  await page.waitForURL(/\/questions\//, { timeout: TIMEOUTS.slowPage });
}
```

**Core pattern to COPY for the harden** — the answer-option visibility settle already used at `advanceVoterFlow` lines 167 and 246–247. Append a stable terminal guard AFTER the `waitForURL` so the helper returns only once an answer option is visible on the settled `/questions/<id>` URL:
```ts
const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();
await answerOption.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
```
This mirrors the existing loop-exhaustion terminal wait (lines 246–247) — same locator, same `waitFor({state:'visible'})` idiom, same `testIds` accessor. It is a test-only wait-condition fix (D-09-preferred).

**Reproduce-first requirement (D-03 / research 4.5):** attempt to reproduce the Phase-127 run-1 race against current HEAD BEFORE committing to the mechanism. If unreproducible after a bounded attempt, harden defensively anyway and record the reasoning inline.

**Reason-comment convention** — when adding a defensive/tight-timeout await, annotate it with the in-file `// reason:` style already used throughout this helper (e.g. lines 137–138, 194–198, 267–270):
```ts
// reason: <why this settle/timeout exists — race being closed>
```

**Anti-pattern (forbidden):** hand-rolling a fresh home→elections→continue walk, or patching only `perm-hide-election-tags.spec.ts`. D-03 mandates fixing the helper class.

---

### `perm-show-feedback-survey.spec.ts` — conditional parity assertion (todo #4, D-02 / OQ 7.1)

**Analog:** existing tests 2 and 3 in the SAME file (lines 73–107). Only add IF OQ 7.1 decides the `bind:this` text-persists-across-cancel-then-reopen contract is load-bearing.

**Imports pattern** (lines 42–47) — already present, reuse:
```ts
import { createPopupNotice } from '../../fixtures/shared/popupNotice.fixture';
import { expect, test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
```

**Core pattern to COPY** — the walk-to-results + popup-fixture structure of test 2 (lines 74–88):
```ts
test('...', async ({ page }) => {
  const popups = createPopupNotice(page);
  await walkUntilQuestionsIntro(page);
  await answerAndAdvanceToResults(page, 'max');
  await popups.expectVisible('feedback');
  // NEW parity assertion goes here: open feedback-form, type text, cancel,
  // reopen → assert typed text still present (Feedback.svelte bind:this keep-mounted).
  // Anchor testids: testIds.shared.header.feedback (line 67), 'feedback-form' (line 70).
});
```

**What is already covered (do NOT re-assert):** open (line 65–71 → `feedback-form` visible), dismiss-persistence-across-reload (lines 74/87–88/91 → `popups.dismissAndReload('feedback')`). The GAP is text-persists-across-cancel-then-reopen only.

**Rigidity contract (file docstring lines 14/37–39):** HARD assertions only — NO `expect.soft` / try-catch / `.catch`; testid-only via `testIds` (getByRole permitted only for the popup close button per the locator-guard carve-out). Any new assertion MUST honor this.

**Singleton-restore hygiene (lines 54–62):** this spec re-seeds the `app_settings` singleton and restores shipped posture in `afterAll`. If a new test mutates settings, follow the same beforeAll-client / afterAll-restore pattern.

---

### Todo lifecycle — stamp + move 7 files to `todos/completed/` (D-04)

**Analog:** `.planning/todos/completed/2026-04-27-extend-e2e-filter-type-coverage.md` — a `resolves_phase:`-tagged todo that was moved to `completed/` (NOT `done/`) with a disposition/resolution appended and a `Source:` back-link to the phase summary.

**Pattern to COPY** (tail of the analog):
```markdown
## Disposition: CLOSED-AS-STALE   (or: FIXED)

<one-paragraph rationale — for STALE: current covering spec + this-phase 3× evidence
path + parity-check result; for FIXED: the harden + 3× green evidence>

Source: `.planning/phases/131-.../131-DISCUSSION-POINTS.md` §6 + `post-fix/<artifact>`.
```

**Move mechanism:** `git mv .planning/todos/pending/<file> .planning/todos/completed/<file>` for each of the 7. Destination is `completed/` NOT `done/` (Pitfall 6 — flagged deviation from option-preview wording).

**Disposition vocabulary (binary-terminal):** `FIXED` (3× green) or `CLOSED-AS-STALE` (not reproducible + parity-checked). No third "deferred" state (D-06).

---

### `131-DISCUSSION-POINTS.md` §6 ledger + `post-fix/` evidence artifacts

**Analog:** the existing scaffolded `131-DISCUSSION-POINTS.md` in the phase dir (blank `____` ledger cells per RESEARCH runtime-state inventory).

**Pattern:** fill each per-todo ledger row with disposition + this-phase-dated evidence path. Capture each 3× run's Playwright output into `post-fix/` (e.g. `post-fix/<surface>-3x.txt`). D-01: evidence MUST cite a Phase-131-dated artifact, never a Phase-130 aggregate-gate path (Pitfall 1).

## Shared Patterns

### Cold-start 3× evidence run (all triage surfaces, D-01 / D-11)
**Source:** `131-RESEARCH.md` Run commands (lines 264–274) + `project_e2e_execution_devserver_prereq` memory.
**Apply to:** every unique covering spec (deduplicated per the D-01 map).
```bash
yarn db:reset                 # clean DB before EACH 3× run (Pitfall 5)
yarn dev                      # ONE fresh dev server on :5173 (no Playwright webServer; stale server steals port)
# repeat 3×, capture to post-fix/:
yarn playwright test -c ./tests/playwright.config.ts --project=cold-entry-dataroot
yarn playwright test -c ./tests/playwright.config.ts ./tests --grep "perm-hide-election-tags"
yarn playwright test -c ./tests/playwright.config.ts --project=_probes   # @probe surfaces (#3/#4) — NOT in default run (Pitfall 4)
```
Dedup: run each unique spec 3× once, cite for every todo it covers.

### Cold-deeplink resolver gate (shared canonical evidence for #2/#3/#4-upstream)
**Source:** `tests/tests/specs/voter/cold-entry-dataroot.spec.ts:31-42` (Phase 117 COLD-03 negative-control gate).
**Apply to:** the cold-deeplink cluster — run 3× as the shared resolver, in addition to each todo's own covering spec. Do NOT build a bespoke cold-entry spec (Don't-Hand-Roll).
```ts
test('cold direct-URL entry to /en/elections renders the populated elections list', async ({ page }) => {
  await page.goto('/en/elections');   // bare hard nav = the cold entry
  await expect(page.getByTestId(testIds.voter.elections.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await expect(page.getByTestId(testIds.voter.elections.option).first()).toBeVisible({ timeout: TIMEOUTS.element });
});
```

### Helper-consumer regression set (todo #7 blast radius, D-10)
**Source:** verified consumers of `navigateToFirstQuestion`.
**Apply to:** MANDATORY re-run after the helper harden (Pitfall 3):
- `tests/tests/specs/perm/perm-hide-election-tags.spec.ts`
- `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts`
- `tests/tests/specs/perm/perm-hide-category-tags.spec.ts`
- `tests/tests/specs/perm/perm-disable-allow-open.spec.ts`
- `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts` (consumer path)

Ideally run a full perm + voter smoke rather than only the changed spec.

### Wait-condition idiom (test-only, D-09-preferred)
**Source:** `voterNavigation.ts` `advanceVoterFlow` (lines 162, 167, 246–247).
**Apply to:** any new settle in the harden — always `locator.waitFor({ state: 'visible', timeout: TIMEOUTS.<budget> })` with a named `TIMEOUTS` budget and a `// reason:` annotation. Never a raw ms literal without a reason comment, never `waitForTimeout`.

## No Analog Found

None. Every touch-point has an in-file or direct-sibling analog. No net-new component/service/module is created in this phase.

## Metadata

**Analog search scope:** `tests/tests/utils/`, `tests/tests/specs/perm/`, `tests/tests/specs/voter/`, `tests/tests/helpers/`, `.planning/todos/completed/`, phase dir.
**Files scanned:** `voterNavigation.ts`, `perm-show-feedback-survey.spec.ts`, `timeouts.ts`, 3 completed-todo precedents, phase-dir listing.
**Pattern extraction date:** 2026-07-22
</content>
</invoke>
