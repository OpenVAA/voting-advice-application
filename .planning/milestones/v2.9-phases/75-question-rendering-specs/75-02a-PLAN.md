---
phase: 75-question-rendering-specs
plan: 02a
type: execute
wave: 2
depends_on: ["01"]
files_modified:
  - tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts
  - .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md
autonomous: true
requirements: [QSPEC-02]
tags: [playwright, e2e, voter, qspec, categorical, single-choice, dedup-audit, pre-flight-gate]

must_haves:
  truths:
    - "A PRE-FLIGHT GATE (Task 0) verifies the cross-plan DB seed state before any spec runs (per B-04): re-runs `yarn dev:reset-with-data` for a clean Plan 01 seed; verifies BOTH `test-question-boolean-1` (Plan 01) AND `test-question-directional-1` (Phase 74 P05) exist in the questions table; verifies Alpha's `answersByExternalId` contains BOTH `test-question-boolean-1: { value: true }` AND `test-question-directional-1: { value: 'a' }`. Exit 0 (proceed) if both questions + both Alpha answer cells exist; exit 1 (abort plan) if either is missing. Closes the silent-failure-via-cross-plan-DB-state risk per B-04."
    - "A NEW spec `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` exists covering QSPEC-02 SINGLE-CHOICE categorical end-to-end against the existing `test-question-directional-1` (singleChoiceCategorical at sort 17, seeded by Phase 74 P05; Plan 02a does NOT modify the seed): walk to sort 17 → assert 3 choice buttons render ('Option A' / 'Option B' / 'Option C') → voter clicks 'Option B' (middle anchor) → auto-advance fires → **`page.goBack()` returns to the categorical question; assert the 'Option B' radio retains `:checked` state (per B-02 step 3 LOCKED: distinct reactive path from the answer-store mirror; native `<input type='radio'>` with `bind:group={selected}` at `QuestionChoices.svelte:263-273` → `getByRole('radio', { checked: true })` count remains 1 on the 'b' input AFTER router-level back navigation)** → entity-detail mirror on Alpha's drawer asserts ASYMMETRIC voter≠Alpha render (voter answered 'b', Alpha answered 'a' per `e2e.ts:603`) — `.entitySelected` count=1 on Alpha's row + `radio[checked]` count=1 on voter's row + 'You' text attached. The 4 assertion steps are ordered: (1) input renders, (2) voter answers + auto-advance, (3) goBack + selected-state still present, (4) entity-detail mirror. Per D-05 4-step contract + RESEARCH §3 + Pitfall 3 + Pitfall 5."
    - "QSPEC-02 multi-choice categorical is DEFERRED per CONTEXT D-03 (PASS-WITH-DEFERRAL on ROADMAP SC #2) — the deferred-todo is filed by Plan 02b Task 3 at phase close, NOT by Plan 02a. Plan 02a's spec only covers single-choice."
    - "The new spec locates the directional input via `.filter({ has: page.getByText(/Directional/) })` (per RESEARCH Pitfall 3 + D-06 + PATTERNS): `.last()` would target the boolean (sort 18 — Plan 01) which IS the actual last input in Alpha's drawer when voter has answered ONLY the categorical. Filter-by-text is the robust locator strategy. **W-04 NEGATIVE CHECK:** the spec MUST NOT call `.last()` on the `opinion-question-input` scope locator in the entity-detail mirror block."
    - "Plan 02a Task 2 writes the UNIFIED dedup audit artifact at `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (per B-03 fix). Per-grep-hit row format: | source spec/test file | overlap classification (NEW / DELEGATED / FALSE-POSITIVE) | rationale | acceptance verdict (no duplicate). The artifact consolidates Plan 01 Task 5 boolean findings + Plan 02a categorical findings into a single Nyquist-compliant persistent file. Artifact MUST contain a literal `AUDIT COMPLETE` trailer line."
    - "The new spec uses role/aria locators by default; `getByTestId('opinion-question-input')` only as SCOPE wrapper with inline `// reason:` block per W-01 / D-06 MANDATORY rule. References via `testIds.voter.X.Y` map (typed accesses — e.g. `testIds.voter.questions.nextButton`) do NOT require `// reason:` annotations."
    - "The new spec uses literal English strings ('Option A' / 'Option B' / 'Option C') per the W-03 deferred-todo (Phase 75 Plan 01 Task 5 filed `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md`) — Phase 78 CLEAN-04 is the durable home for the `t(...)` lookup migration. The top-of-file comment cites the W-03 deferred-todo path."
  artifacts:
    - path: "tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts"
      provides: "NEW Playwright spec covering QSPEC-02 (single-choice categorical only per D-03): 4-step contract against the existing `test-question-directional-1` including B-02 mandatory browser-back persistence assertion"
      min_lines: 60
      contains: "QSPEC-02"
    - path: ".planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md"
      provides: "Unified Phase 75 dedup audit artifact per B-03 fix — consolidates Plan 01 boolean findings + Plan 02a categorical findings; Nyquist-compliant persistent file with AUDIT COMPLETE trailer"
      min_lines: 40
      contains: "AUDIT COMPLETE"
  key_links:
    - from: "Plan 02a Task 0 (PRE-FLIGHT GATE)"
      to: "Plan 01 outputs — packages/dev-seed/src/templates/e2e.ts + Phase 74 P05's e2e.ts:518-532 directional question"
      via: "psql probe against questions table + Alpha's answers JSONB — exit 1 if either Plan 01 seed (boolean) OR Phase 74 P05 seed (directional) missing"
      pattern: "SELECT.*FROM questions WHERE external_id"
    - from: "tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts (QSPEC-02 voter-answers step)"
      to: "packages/dev-seed/src/templates/e2e.ts:518-532 (test-question-directional-1 with choices a/b/c)"
      via: "page.getByRole('button', { name: 'Option B' }).click() — clicks the middle anchor (id='b')"
      pattern: "getByRole\\(\\s*'button'\\s*,\\s*\\{\\s*name:\\s*'Option B'"
    - from: "tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts (QSPEC-02 browser-back persistence step per B-02)"
      to: "apps/frontend/src/lib/components/questions/QuestionChoices.svelte:263-273 (native `<input type='radio' bind:group={selected}>`)"
      via: "page.goBack() → expect(directionalScope.getByRole('radio', { checked: true })).toHaveCount(1) — asserts the 'b' input retains :checked after router-level back navigation"
      pattern: "page\\.goBack\\(\\)"
    - from: "tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts (QSPEC-02 entity-detail mirror step)"
      to: "packages/dev-seed/src/templates/e2e.ts:603 (Alpha's 'test-question-directional-1': { value: 'a' })"
      via: "directionalInput = opinionsTab.getByTestId('opinion-question-input').filter({ has: getByText(/Directional/) }) — asymmetric voter='b' / Alpha='a' shape; NEGATIVE CHECK per W-04: NOT `.last()`"
      pattern: "filter\\(\\s*\\{\\s*has:\\s*page\\.getByText"
    - from: ".planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md (per B-03)"
      to: "Plan 01 Task 5 SUMMARY (boolean dedup findings) + Plan 02a Task 2 (categorical dedup findings)"
      via: "consolidated table with per-grep-hit row format + AUDIT COMPLETE trailer"
      pattern: "AUDIT COMPLETE"
---

<objective>
Land the QSPEC-02 single-choice categorical Playwright spec + unified dedup audit artifact (per B-01 split of the original Plan 02). Plan 02a is the Wave-2 autonomous-true feature half; Plan 02b is the Wave-3 autonomous-false verification-gate half.

**Plan 02a scope (per B-01 + B-03 + B-04 revision):**
1. **Task 0 — PRE-FLIGHT GATE (NEW per B-04):** Re-run `yarn dev:reset-with-data` for a clean Plan 01 seed; verify BOTH the boolean (Plan 01) AND directional (Phase 74 P05) questions exist in the DB; verify Alpha's answer cells for both. Exit 1 (abort plan) if either is missing. Closes the cross-plan DB state silent-failure risk.
2. **Task 1 — Author `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts`** against the EXISTING `test-question-directional-1` at sort 17 (seeded by Phase 74 P05 — no new seed required). Implements the **D-05 4-step contract REVISED per B-02**: input renders / voter answers + auto-advance / **browser-back persistence (`page.goBack()` + checked-state assertion)** / asymmetric voter≠Alpha entity-detail mirror.
3. **Task 2 — Write unified dedup audit artifact** at `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (per B-03 — Nyquist-compliant persistent file consolidating Plan 01 + Plan 02a findings).

**Plan 02b scope (separate plan; this plan does NOT cover):** vite-cache wipe + 3-run cold-start smoke + parity-script regen + `75-VERIFICATION.md` + multi-choice deferred-todo + operator checkpoint.

**Per-task runtime budget (W-06 transparency):**
- Task 0 (pre-flight gate): ~5 min — `yarn dev:reset-with-data` (~30s) + 3 psql probes + capture.
- Task 1 (spec authoring + 4-step contract including B-02 browser-back): ~30 min — author + lint + single-spec smoke (~25s).
- Task 2 (unified dedup audit artifact + grep walks): ~15 min — grep + table authoring + trailer.
- **Total Plan 02a wall-clock: ~50 min** — well within the per-plan ceiling.

Purpose: Close the QSPEC-02 single-choice categorical coverage gap (ROADMAP SC #2) against the existing Phase 74 P05 categorical seed; preserve the cross-plan DB seed contract via pre-flight gate; produce the persistent dedup audit artifact per Nyquist-compliance (B-03).

Output: 1 NEW spec + 1 NEW unified dedup audit artifact. NO seed modifications. NO parity tooling invocation. NO verification record (that's Plan 02b).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/75-question-rendering-specs/75-CONTEXT.md
@.planning/phases/75-question-rendering-specs/75-RESEARCH.md
@.planning/phases/75-question-rendering-specs/75-PATTERNS.md
@.planning/phases/75-question-rendering-specs/75-VALIDATION.md

# Plan 01 outputs Plan 02a depends on (CONTEXT D-10 strict serial + B-04 pre-flight gate)
@.planning/phases/75-question-rendering-specs/75-01-PLAN.md
@.planning/phases/75-question-rendering-specs/75-01-SUMMARY.md

# Phase 74 direct precedents (categorical seed shape)
@.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md
@.planning/phases/74-high-leverage-e2e-coverage/74-05-SUMMARY.md

# Source under contract (read at task time per <read_first>)
@packages/dev-seed/src/templates/e2e.ts
@apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
@apps/frontend/src/lib/components/questions/QuestionChoices.svelte
@tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts
@tests/tests/specs/voter/voter-detail.spec.ts
@tests/tests/specs/voter/voter-matching.spec.ts
@tests/tests/specs/voter/voter-journey.spec.ts
@tests/tests/utils/voterNavigation.ts
@tests/tests/utils/testIds.ts
@tests/tests/fixtures/voter.fixture.ts
@tests/eslint.config.mjs

# Conventions
@CLAUDE.md

<interfaces>
<!-- Key types/exports the executor needs. Extracted from codebase at planning time. -->

From `tests/tests/utils/voterNavigation.ts` (Plan 01 Task 3 added the helper):
```ts
export async function walkToQuestion(page: Page, sortOrder: number): Promise<void>;
```

From `packages/dev-seed/src/templates/e2e.ts:518-532` (existing categorical question — Plan 02a spec targets):
```ts
{
  external_id: 'test-question-directional-1',
  type: 'singleChoiceCategorical',
  name: { en: 'Test Opinion Question Directional 1 (E2E-07)' },
  choices: [
    { id: 'a', label: { en: 'Option A' } },
    { id: 'b', label: { en: 'Option B' } },
    { id: 'c', label: { en: 'Option C' } }
  ],
  category: { external_id: 'test-category-directional' },
  allow_open: false,
  required: false,
  sort_order: 17,
  is_generated: false
}
```

Alpha's existing answer: `'test-question-directional-1': { value: 'a' }` at `packages/dev-seed/src/templates/e2e.ts:603`.

Voter clicks `'Option B'` (id='b') — middle anchor; Alpha answered 'a' → asymmetric mirror shape (RESEARCH Pitfall 5).

From `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:263-273` (drives B-02 step 3 — selected-state DOM signature):
```svelte
<input
  type="radio"
  class="radio-primary radio ..."
  class:entitySelected={otherSelected == id}
  value={id}
  data-testid="question-choice"
  bind:group={selected}
  ... />
```
**Critical:** Native `<input type="radio">` with `bind:group={selected}`. "Selected-state" assertion is on the radio's `:checked` pseudo-state via `getByRole('radio', { checked: true })`. NOT `aria-checked`.

From `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:89-99` (single-choice categorical branch — dispatches `SingleChoiceCategoricalQuestion` to `QuestionChoices`):
```svelte
{#if isSingleChoiceQuestion(question)}
  {@const selectedId = question.ensureValue(answer?.value)}
  {@const otherSelected = question.ensureValue(otherAnswer?.value)}
  <QuestionChoices
    {question}
    {mode}
    {selectedId}
    {otherSelected}
    {otherLabel}
    onChange={onChange ? (d) => onChange({ value: d.value, question: d.question }) : undefined}
    {...restProps} />
```

Filter-by-text locator pattern (RESEARCH Pitfall 3 + PATTERNS for QSPEC-02):
```ts
const directionalInput = opinionsTab.getByTestId('opinion-question-input').filter({
  has: page.getByText(/Directional/)
});
```

Supabase status JSON extraction (for the pre-flight gate per B-04):
```bash
DB_URL=$(yarn supabase:status --output json 2>/dev/null | jq -r '.DB_URL // empty')
# Fallback for older CLI versions:
DB_URL=$(yarn supabase:status 2>/dev/null | awk '/DB URL/{print $NF}')
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 0: PRE-FLIGHT GATE — Verify cross-plan DB seed state (boolean + categorical questions + Alpha answer cells per B-04)</name>
  <files>
    (no source-file edits — runs `yarn dev:reset-with-data` + 3 psql probes; aborts plan with exit 1 if cross-plan seed state is incomplete)
  </files>
  <read_first>
    - .planning/phases/75-question-rendering-specs/75-01-SUMMARY.md (Plan 01's Skip-Next fallback verdict + dev-seed Task 1 confirmation that `test-question-boolean-1` landed in the seed)
    - .planning/phases/74-high-leverage-e2e-coverage/74-05-SUMMARY.md (Phase 74 P05's confirmation that `test-question-directional-1` lives in `e2e.ts:518-532` + Alpha's answer cell at `e2e.ts:603`)
    - CLAUDE.md §"Supabase Commands" (`yarn dev:reset-with-data` + `yarn supabase:status` are the canonical commands)
  </read_first>
  <action>
    Per B-04: Close the cross-plan DB state silent-failure risk. Plan 02a Task 1's spec assumes BOTH Plan 01's boolean seed AND Phase 74 P05's directional seed are present in the DB. Verify-then-run prevents the symptom of a spec timeout masking an incomplete seed.

    Steps:

    1. **Re-run `yarn dev:reset-with-data`** for a clean Plan 01 + Phase 74 P05 seed state:
       ```
       yarn dev:reset-with-data
       ```
       Cost: ~30s. Ensures clean seed even if Plan 01 Task 2's run drifted (e.g. test runs added/removed transient data).

    2. **Extract DB URL** (W-05 stable extraction shape):
       ```
       DB_URL=$(yarn supabase:status --output json 2>/dev/null | jq -r '.DB_URL // empty')
       if [ -z "$DB_URL" ]; then
         DB_URL=$(yarn supabase:status 2>/dev/null | awk '/DB URL/{print $NF}')
       fi
       if [ -z "$DB_URL" ]; then
         echo "PRE-FLIGHT GATE FAIL: could not extract DB URL from supabase:status"
         exit 1
       fi
       ```

    3. **Probe A — boolean question (Plan 01 seed):**
       ```
       BOOLEAN_COUNT=$(psql "$DB_URL" -t -A -c "SELECT count(*) FROM questions WHERE external_id = 'test-question-boolean-1' AND sort_order = 18;")
       if [ "$BOOLEAN_COUNT" != "1" ]; then
         echo "PRE-FLIGHT GATE FAIL: test-question-boolean-1 at sort 18 not present in questions table (Plan 01 seed missing)"
         exit 1
       fi
       ```

    4. **Probe B — directional question (Phase 74 P05 seed):**
       ```
       DIRECTIONAL_COUNT=$(psql "$DB_URL" -t -A -c "SELECT count(*) FROM questions WHERE external_id = 'test-question-directional-1' AND sort_order = 17;")
       if [ "$DIRECTIONAL_COUNT" != "1" ]; then
         echo "PRE-FLIGHT GATE FAIL: test-question-directional-1 at sort 17 not present in questions table (Phase 74 P05 seed missing — Plan 02a CANNOT run without it)"
         exit 1
       fi
       ```

    5. **Probe C — Alpha's answer cells (BOTH boolean + directional):**
       ```
       ALPHA_ANSWERS=$(psql "$DB_URL" -t -A -c "
         SELECT
           (answers_json->>'test-question-boolean-1' IS NOT NULL) AS has_boolean,
           (answers_json->>'test-question-directional-1' IS NOT NULL) AS has_directional
         FROM nominations_candidate
         JOIN candidates c ON c.id = candidate_id
         WHERE c.external_id = 'test-candidate-alpha';
       ")
       echo "Alpha answers: $ALPHA_ANSWERS"
       # Expected: "t|t" (both true)
       if ! echo "$ALPHA_ANSWERS" | grep -q "^t|t$"; then
         echo "PRE-FLIGHT GATE FAIL: Alpha is missing test-question-boolean-1 (Plan 01) AND/OR test-question-directional-1 (Phase 74 P05) answer cell"
         exit 1
       fi
       ```

    6. **If all 3 probes pass — emit `PRE-FLIGHT GATE: PASS`** and proceed to Task 1.

    Capture full probe output in working notes for Plan 02b's `75-VERIFICATION.md` reference. NO source-file edits in this task; the gate is purely a verification step.
  </action>
  <verify>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && yarn supabase:status 2>&1 | tail -10</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && DB_URL=$(yarn supabase:status 2>/dev/null | awk '/DB URL/{print $NF}') && psql "$DB_URL" -t -A -c "SELECT external_id || '|' || sort_order FROM questions WHERE external_id IN ('test-question-boolean-1','test-question-directional-1') ORDER BY sort_order;"</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && DB_URL=$(yarn supabase:status 2>/dev/null | awk '/DB URL/{print $NF}') && psql "$DB_URL" -t -A -c "SELECT (answers_json->>'test-question-boolean-1' IS NOT NULL) || '|' || (answers_json->>'test-question-directional-1' IS NOT NULL) FROM nominations_candidate JOIN candidates c ON c.id = candidate_id WHERE c.external_id = 'test-candidate-alpha';"</automated>
  </verify>
  <acceptance_criteria>
    - `yarn dev:reset-with-data` exits 0; Supabase healthy post-reset.
    - Probe A returns exactly `1` (test-question-boolean-1 at sort 18 exists).
    - Probe B returns exactly `1` (test-question-directional-1 at sort 17 exists).
    - Probe C returns exactly `t|t` (Alpha has both answer cells).
    - If ANY probe fails: Task 0 exits 1; Plan 02a aborts; the failure mode is captured in working notes for operator triage (likely: Plan 01 Task 1 did not commit, OR `yarn dev:reset-with-data` did not pick up the latest dev-seed build).
    - Probe output captured for Plan 02b's `75-VERIFICATION.md` reference (sub-section under "Cross-Plan Seed State Verification").
  </acceptance_criteria>
  <done>
    Cross-plan DB seed state verified; all 3 probes PASS; Plan 02a cleared to run Task 1.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 1: Author tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts (QSPEC-02 single-choice — D-05 4-step contract REVISED per B-02 with browser-back persistence)</name>
  <files>tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts</files>
  <read_first>
    - tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts (read in FULL — the Plan 01 sibling spec; Plan 02a mirrors imports + structure + dedup-audit comment block + entity-detail mirror locator pattern with the DIFFERENT-button asymmetric shape per RESEARCH Pitfall 5 + B-02 browser-back step 3 from QSPEC-01)
    - tests/tests/specs/voter/voter-detail.spec.ts (read in FULL — note the case-(a) at lines 97-113 + the case-(c) "different-buttons" shape used when voter and entity selected different choices; QSPEC-02 mirrors the case-(c) shape because voter='b' and Alpha='a')
    - tests/tests/specs/voter/voter-journey.spec.ts (read lines 42-89 — auto-advance + `urlBefore`/`waitForURL` pattern at 72-86; mirror QSPEC-01)
    - tests/tests/utils/voterNavigation.ts (confirm `walkToQuestion(page, sortOrder)` export from Plan 01 Task 3)
    - tests/tests/utils/testIds.ts (locate exact testId names — same set as QSPEC-01)
    - packages/dev-seed/src/templates/e2e.ts (read lines 518-532 to confirm `test-question-directional-1` shape + 603 to confirm Alpha's `'test-question-directional-1': { value: 'a' }` — the existing seed state Plan 02a spec targets without modification)
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte (read lines 153-273 — radio rendering at 263-273; the `entitySelected` class application at 266; display-label render at 243-253; both case-(a) "both selected same" and case-(c) "selected different" branches; the native `<input type="radio">` shape that drives B-02 step 3 browser-back assertion)
    - .planning/phases/75-question-rendering-specs/75-RESEARCH.md §"3. Entity-detail row locator" + §"Pitfall 3" + §"Pitfall 5" (the asymmetric voter≠Alpha mirror shape — Plan 02a uses `.filter({ has: page.getByText(/Directional/) })` NOT `.last()` because the boolean at sort 18 is the actual last input in Alpha's drawer when voter only answered the categorical)
    - .planning/phases/75-question-rendering-specs/75-PATTERNS.md §"`tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts`" (exact shape: skip-walk count = 16 NOT 17, filter-by-text locator, asymmetric `.entitySelected` vs `radio[checked]` shape)
    - .planning/phases/75-question-rendering-specs/75-CONTEXT.md §"D-03" (multi-choice DEFERRAL — Plan 02a covers single-choice ONLY) + §"D-05" (4-step contract with B-02 mandatory browser-back step 3) + §"D-06"
    - .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs (read lines 55-70 — confirm none of the 14 IMGPROXY_TIED_TITLES bound patterns are suffixes of the new test title; the title 'QSPEC-02 — categorical opinion question (single-choice) end-to-end' is safe)
    - tests/eslint.config.mjs (confirm post-Phase-73 `playwright/no-raw-locators` at `'error'`)
    - .planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md (W-03 deferred-todo filed by Plan 01 Task 5 — Plan 02a's spec inherits the literal-English-string convention with a top-of-file note referencing this todo)
  </read_first>
  <action>
    Create `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` implementing the **D-05 4-step contract REVISED per B-02 step 3** for QSPEC-02 single-choice ONLY (multi-choice DEFERRED per D-03 — captured in Plan 02b's follow-up todo, NOT in this spec).

    Required structure (mirror Plan 01 boolean spec shape; substitute the boolean-specific elements for categorical-specific):

    **1. Imports block** — same as QSPEC-01 spec (`expect` + `voterTest as test` + `walkToQuestion` + `testIds`).

    **2. Top-of-file comment block** — same `answeredVoterPage`-not-used rationale as QSPEC-01 (RESEARCH Pitfall 6 + Path B reference) + 2-line W-03 i18n note citing `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md`. Add a 1-line note about the asymmetric voter='b' / Alpha='a' shape.

    **3. Dedup-audit `// dedup:` comment block** above the `test.describe` (mirror PATTERNS §"Dedup-audit comment block for QSPEC-02"):
    ```
    // dedup: matching distance for categorical/directional questions is covered by
    // packages/matching/src/**/*.test.ts + voter-matching.spec.ts:40-43 (ordinal
    // filter excludes categoricals). This spec asserts the render-shape contract
    // only (input renders, voter clicks Option B, answer persists across goBack,
    // entity-detail mirrors with asymmetric voter='b' / Alpha='a' shape). Per-category
    // SubMatch breakdown is E2E-07's territory (voter-detail.spec.ts:197-296),
    // explicitly out of scope per ROADMAP line 203. Unified Phase 75 dedup audit:
    // .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md.
    ```

    **4. `test.describe` block** with tag `@voter`:
    ```
    test.describe('voter question rendering — categorical (QSPEC-02)', { tag: ['@voter'] }, () => { ... });
    ```

    **5. Single `test(...)` body** — implements the **4-step contract REVISED per B-02 step 3**:

    **Step 1 — Walk to the categorical at sort 17 + assert input renders.**
    - `await walkToQuestion(page, 16);` (skip 16 ordinals → land on categorical at sort 17 — NOTE: count is 16 NOT 17, because the categorical IS the target; QSPEC-01 skipped 17 because boolean was 1 past the categorical).
    - Assert the 3 choice buttons render via role + name (literal English strings per W-03 deferred-todo):
      - `await expect(page.getByRole('button', { name: 'Option A' })).toBeVisible();`
      - `await expect(page.getByRole('button', { name: 'Option B' })).toBeVisible();`
      - `await expect(page.getByRole('button', { name: 'Option C' })).toBeVisible();`

    **Step 2 — Voter clicks 'Option B' (middle anchor) + answer triggers auto-advance.**
    - Inherit the `urlBefore` + `waitForURL` + try/catch fallback pattern from `voter-journey.spec.ts:72-86`:
      ```
      const urlBefore = page.url();
      await page.getByRole('button', { name: 'Option B' }).click();
      try {
        await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
      } catch {
        const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
        await nextButton.waitFor({ state: 'visible', timeout: 5000 });
        await nextButton.click();
        // After answering categorical at sort 17, the next question is the boolean at sort 18
        // (Plan 01 seed). Voter doesn't answer the boolean — Skip via nextButton lands on /results.
        await page.waitForURL(/\/results/, { timeout: 10000 });
      }
      ```
    - Add an inline comment noting that the auto-advance navigation goes through the boolean at sort 18 (voter skips it) before landing on /results. The Plan 01 seed adds the boolean; without Plan 01, /results would be reached directly. This comment makes the cross-plan dependency explicit.

    **Step 3 — Browser-back persistence assertion (MANDATORY per B-02 / CONTEXT D-05 step 3 LOCKED).**

    Distinct reactive path from the answer-store mirror (step 4): asserts the input's DOM-level selected-state survives a router-level back navigation.

    - **NOTE on goBack target:** After Step 2, page is at the boolean question (sort 18 — auto-advance from categorical) OR at /results (boolean skipped via fallback). `page.goBack()` from the boolean question → returns to categorical (sort 17). `page.goBack()` from /results → returns to whichever URL was previous (likely boolean OR categorical depending on navigation history). The test asserts the categorical's checked-state — if the goBack lands on the boolean, do a SECOND `page.goBack()` to reach the categorical.

    - `await page.goBack();`
    - Optional 2nd goBack if currently at boolean question instead of categorical:
      - `// reason: depending on auto-advance vs fallback in step 2, one goBack may land on the boolean (sort 18); a 2nd goBack reaches the categorical (sort 17). Try-catch the assertion on the directional scope to disambiguate.`
      - `const directionalScope = page.getByTestId('opinion-question-input').filter({ has: page.getByText(/Directional/) });`
      - `if (!(await directionalScope.isVisible({ timeout: 1000 }).catch(() => false))) { await page.goBack(); }` — but `playwright/no-conditional-in-test` may flag this; use try/catch or count-based wait instead:
      - **Preferred pattern** (avoids `if`-conditional):
        ```ts
        // reason: scope to the directional input's container disambiguates from the boolean
        // (sort 18) which may also be visible on the previous-step page.
        const directionalScope = page.getByTestId('opinion-question-input').filter({
          has: page.getByText(/Directional/)
        });
        await page.goBack();
        try {
          await directionalScope.waitFor({ state: 'visible', timeout: 2000 });
        } catch {
          await page.goBack();
          await directionalScope.waitFor({ state: 'visible', timeout: 5000 });
        }
        ```
    - Assert the previously-clicked 'Option B' option still shows the selected-state:
      - `// reason: QuestionChoices.svelte:263-273 renders <input type="radio" bind:group={selected}>; selected-state is the radio's :checked pseudo-state via getByRole('radio', { checked: true }). The 'b' input must remain checked after router-level back navigation per CONTEXT D-05 step 3 LOCKED.`
      - `await expect(directionalScope.getByRole('radio', { checked: true })).toHaveCount(1);`
    - Defensive anchor: confirm the checked radio's value attribute is `'b'`:
      - `// reason: defensive — confirms the checked radio is specifically the 'b' (Option B) choice, not a sibling.`
      - `// eslint-disable-next-line playwright/no-raw-locators`
      - `await expect(directionalScope.locator('input[type="radio"]:checked')).toHaveAttribute('value', 'b');`

    **Step 4 — Voter sees the answer reflected on entity-detail (ASYMMETRIC voter≠Alpha mirror).**
    - Navigate FORWARD past the categorical (sort 17) + the boolean (sort 18) to /results. Use nextButton clicks:
      - `const nextButton = page.getByTestId(testIds.voter.questions.nextButton);`
      - `await nextButton.click();` // categorical → boolean
      - `await nextButton.click();` // boolean → /results
      - `await page.waitForURL(/\/results/, { timeout: 30000 });`
    - On `/results`: find Alpha's card and click to open the entity-detail drawer:
      - `await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'Candidate Alpha' }).click();`
    - Open the opinions tab:
      - `const dialog = page.getByRole('dialog');`
      - `await dialog.getByRole('tab', { name: /opinions/i }).click();`
      - `const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);`
    - Scope the directional input via filter-by-text (per RESEARCH Pitfall 3 + PATTERNS + W-04 NEGATIVE CHECK — `.last()` would target the boolean at sort 18 which is the actual last input in Alpha's drawer when voter has answered BOTH; filter-by-text discriminates):
      - `// reason: per W-04 / RESEARCH Pitfall 3 — `.last()` is FORBIDDEN here because the boolean at sort 18 is also rendered in Alpha's drawer (Alpha answered both questions). Filter-by-text on the question's name discriminates the directional from the boolean. Do NOT regress to `.last()` even though the boolean assertion uses it in QSPEC-01 — the contexts differ.`
      - `const directionalInput = opinionsTab.getByTestId('opinion-question-input').filter({ has: page.getByText(/Directional/) });`
    - Three-line asymmetric assertion block (DIFFERENT-buttons case — voter='b', Alpha='a' per `e2e.ts:603`):
      - Inline `// reason:` block + `// eslint-disable-next-line playwright/no-raw-locators` directive ABOVE the `.locator('.entitySelected')` line (mirror QSPEC-01).
      - `await expect(directionalInput.locator('.entitySelected')).toHaveCount(1);` (Alpha's row on 'a' button)
      - `await expect(directionalInput.getByRole('radio', { checked: true })).toHaveCount(1);` (voter's row on 'b' button — DIFFERENT button from Alpha's)
      - `await expect(directionalInput.getByText(/You/i)).toBeAttached();` (voter's 'You' label — standalone, NOT combined; per `QuestionChoices.svelte:243-253` `else if (selectedId == id)` branch when voter+Alpha picked different ids)
    - Note: NO assertion that voter and Alpha picked the SAME button — the asymmetric shape is what makes QSPEC-02 distinct from QSPEC-01 case-(a). This is RESEARCH Pitfall 5 + the EXEMPLAR in PATTERNS §"Entity-detail mirror — DIFFERENT BUTTONS shape (mirror voter-detail.spec.ts:247-269 case (c) shape)".

    **Test title:** `'categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail'` — verified NOT to suffix any of the 14 IMGPROXY_TIED_TITLES bound patterns.

    **Lint compliance:** Same as Plan 01 — inline `// reason:` blocks on all raw-locator usages + every `getByTestId('opinion-question-input')` scope-wrapper usage per W-01; for-of loops are allowed (only `if(...)` is forbidden); try/catch is exception-handling, not a conditional.
  </action>
  <verify>
    <automated>test -f /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts && echo EXISTS</automated>
    <automated>grep -c "QSPEC-02" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts</automated>
    <automated>grep -c "walkToQuestion(page, 16)" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts</automated>
    <automated>grep -cE "name: 'Option A'|name: 'Option B'|name: 'Option C'" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts</automated>
    <automated>grep -c "filter.*Directional" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts</automated>
    <automated>grep -c "entitySelected" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts</automated>
    <automated>grep -c "page.goBack" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts</automated>
    <automated>grep -B1 "getByTestId('opinion-question-input')" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts | grep -c "// reason:"</automated>
    <automated>grep -E "getByTestId\\('opinion-question-input'\\)\\.last\\(\\)" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts && echo "W04_FAIL_LAST_USED" && exit 1 || echo "W04_PASS_NO_LAST"</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && yarn lint:check 2>&1 | tail -10</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && yarn workspace @openvaa/tests test:e2e --workers=1 --grep "categorical opinion question .single-choice. renders" 2>&1 | tail -30</automated>
  </verify>
  <acceptance_criteria>
    - `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` exists; >= 60 lines (revised from 50 due to B-02 step 3 addition); contains 1 `test.describe` block with tag `@voter` and 1 `test(...)` body.
    - Spec imports `walkToQuestion` from `'../../utils/voterNavigation'`.
    - Spec calls `walkToQuestion(page, 16)` (16 nextButton clicks → land on sort 17 categorical; NOT 17 like QSPEC-01).
    - Spec asserts the 3 choice buttons render via `getByRole('button', { name: 'Option A' })` + B + C (literal English strings per W-03 deferred convention).
    - Spec uses the `urlBefore`/`waitForURL`/try-catch auto-advance pattern + an inline comment explaining the skip-through-boolean-at-sort-18 fallback hop.
    - **B-02 step 3 (browser-back persistence — MANDATORY):** Spec contains a `page.goBack()` call AFTER step 2 voter-answers + auto-advance, followed by `await expect(directionalScope.getByRole('radio', { checked: true })).toHaveCount(1)`. The 4 assertion steps are ordered: (1) input renders, (2) voter answers + auto-advance, (3) goBack + selected-state still present (on Option B / id='b'), (4) entity-detail mirror. `grep -c "page.goBack"` returns >= 1.
    - Spec's entity-detail mirror locator uses `.filter({ has: page.getByText(/Directional/) })` — NOT `.last()` — per RESEARCH Pitfall 3 + PATTERNS; with inline `// reason:` block citing W-04 NEGATIVE CHECK + why `.last()` would target the boolean.
    - **W-04 NEGATIVE CHECK:** `grep -E "getByTestId\\('opinion-question-input'\\)\\.last\\(\\)" tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` returns exit 1 (NO match — `.last()` is NOT used on the opinion-question-input scope locator).
    - Spec's entity-detail mirror block contains the 3-line asymmetric assertion (`.entitySelected` count=1 + `radio[checked]` count=1 + `getByText(/You/i)` attached) with inline `// reason:` block + `// eslint-disable-next-line playwright/no-raw-locators` directive.
    - **W-01 (`// reason:` for `getByTestId('opinion-question-input')`):** Every `getByTestId('opinion-question-input')` call (EXCLUDING `testIds.X.Y` map references) has an inline `// reason:` block above it. Verify: `grep -B1 "getByTestId\\('opinion-question-input'\\)" tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts | grep -c "// reason:"` returns >= 2 (step 3 scope + step 4 scope).
    - Dedup-audit comment block above `test.describe` cites `voter-matching.spec.ts:40-43` + `packages/matching/src/**/*.test.ts` + ROADMAP line 203 (E2E-07 out of scope) + path to unified dedup audit artifact `75-02-DEDUP-AUDIT.md`.
    - Top-of-file comment notes multi-choice deferral with todo path reference + W-03 i18n deferred-todo reference.
    - `yarn lint:check` exits 0 with 0 warnings on the new file.
    - `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "categorical opinion question .single-choice. renders"` PASSES (the one test green) against the seed provisioned by Plan 01 Task 2 + Task 0 pre-flight gate.
    - Test title verified NOT to suffix any of the 14 IMGPROXY_TIED_TITLES bound patterns at `regen-constants.mjs:55-70` (grep gate same as QSPEC-01).
  </acceptance_criteria>
  <done>
    QSPEC-02 single-choice spec authored with 4-step contract including B-02 mandatory browser-back persistence + W-04 negative .last() check; 1 test passes against the existing categorical seed; asymmetric mirror shape verified; W-01 testId reason annotations present.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Write UNIFIED dedup audit artifact at .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md (Nyquist-compliant persistent file per B-03)</name>
  <files>.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md</files>
  <read_first>
    - tests/tests/specs/voter/voter-matching.spec.ts (read in FULL — note line 40-43 ordinal-only filter; line 99-103 matching computation; line 137 cross-reference to directional question; line 167-177 Skip-Next fallback for sort 17; line 169 navigates to question 17; line 191-217 ranking assertions; QSPEC-02 should NOT duplicate any of these but DOES leverage the same `test-question-directional-1` row + the same Skip-Next path)
    - tests/tests/specs/voter/voter-detail.spec.ts (read in FULL — note lines 197-296 E2E-07 SubMatch block from Phase 74 P05; QSPEC-02 must NOT duplicate the SubMatch assertions per ROADMAP line 203)
    - packages/matching/src/**/*.test.ts (grep for `singleChoiceCategorical` / `MultipleChoiceCategoricalQuestion` / `isSingleChoiceQuestion` / `BooleanQuestion` / `isBooleanQuestion` test cases; record findings for the audit table)
    - .planning/phases/75-question-rendering-specs/75-01-SUMMARY.md (Plan 01 Task 5 boolean dedup findings — consolidate into this unified artifact per B-03 cross-plan flow)
    - .planning/phases/75-question-rendering-specs/75-CONTEXT.md §"D-04 — Deduplication strategy" (the 3-step protocol)
    - .planning/phases/75-question-rendering-specs/75-RESEARCH.md §"5. Dedup audit" (the verified dedup map for both QSPEC-01 + QSPEC-02)
    - .planning/phases/74-high-leverage-e2e-coverage/74-05-SUMMARY.md (read in FULL — Phase 74 P05 contains the categorical question + E2E-07 SubMatch coverage; QSPEC-02 must NOT duplicate the SubMatch assertions; cross-reference at planner read-time)
  </read_first>
  <action>
    Per B-03 fix: write the unified Phase 75 dedup audit as a persistent Nyquist-compliant artifact (NOT in-memory / agent-context working notes). Consolidates Plan 01 Task 5 boolean findings + Plan 02a categorical findings into a single file with required structure + AUDIT COMPLETE trailer.

    Required structure for `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md`:

    **1. YAML frontmatter** (5-line block):
    ```yaml
    ---
    phase: 75-question-rendering-specs
    plan: 02a
    artifact: dedup-audit
    requirements: [QSPEC-01, QSPEC-02]
    created: <ISO date>
    ---
    ```

    **2. H1 + Intent paragraph** (2-3 lines): "Unified Phase 75 dedup audit per CONTEXT D-04 + ROADMAP SC #3. Consolidates Plan 01 boolean (QSPEC-01) findings + Plan 02a categorical (QSPEC-02) findings into a single Nyquist-compliant persistent record per B-03 revision."

    **3. `## Grep Inputs` section** — record each grep command executed + the analog file scanned:
    ```
    | # | Grep Command | Target Files |
    | 1 | `grep -nE "BooleanQuestion|isBooleanQuestion|test-question-boolean" packages/matching/src/**/*.test.ts tests/tests/specs/voter/voter-matching.spec.ts` | matching package unit tests + voter-matching spec |
    | 2 | `grep -nE "singleChoiceCategorical|directional|test-question-directional|Option [A-C]" tests/tests/specs/voter/voter-matching.spec.ts tests/tests/specs/voter/voter-detail.spec.ts` | voter-matching + voter-detail specs |
    | 3 | `grep -rnE "singleChoiceCategorical|MultipleChoiceCategoricalQuestion|isSingleChoiceQuestion|isBooleanQuestion" packages/matching/src/` | matching package source + tests |
    ```

    **4. `## Audit Table — Per-Grep-Hit Classification` section** (B-03 required format):

    Table columns: `Source spec/test file | Line(s) | Overlap classification | Rationale | Acceptance verdict (no duplicate)`

    Classification values:
    - `NEW` — the QSPEC spec adds NEW assertion coverage; no analog exists.
    - `DELEGATED` — the analog test owns this contract; QSPEC delegates / does NOT duplicate.
    - `FALSE-POSITIVE` — grep flagged the file but no actual assertion overlap.

    Minimum rows (≥ 6):
    | Source | Lines | Classification | Rationale | Verdict |
    | `voter-matching.spec.ts` | 40-43 | DELEGATED | Ordinal-only filter `singleChoiceOrdinal` — explicitly EXCLUDES boolean + categorical questions. Orthogonal contract. | No duplicate. |
    | `voter-matching.spec.ts` | 99-103 | DELEGATED | MatchingAlgorithm distance metric contract (Manhattan). QSPEC asserts render shape only. | No duplicate. |
    | `voter-matching.spec.ts` | 167-177 | DELEGATED (LEVERAGED, not asserted) | Skip-Next fallback for sort 17 — QSPEC-01 verifies it handles sort 18; QSPEC-02 walks through it. Phase 75 Plan 01 Task 2 + Plan 02a Task 1 leverage the same fallback path. No assertion is duplicated. | No duplicate. |
    | `voter-matching.spec.ts` | 191-217 | DELEGATED | Ranking-order contract. QSPEC asserts render shape only. | No duplicate. |
    | `voter-detail.spec.ts` | 197-296 | DELEGATED | E2E-07 per-category SubMatch (Manhattan + directional) — Phase 74 P05's owned contract per ROADMAP line 203. QSPEC-02 explicitly scoped out. | No duplicate. |
    | `packages/matching/src/algorithms/*.test.ts` | (specific lines per grep) | DELEGATED | Algorithm + distance / normalization / dispatch contracts. QSPEC asserts user-flow + render shape. | No duplicate. |
    | (+ any additional per-grep-hit rows from Plan 01 + Plan 02a's grep walks) | … | … | … | … |

    **5. `## Contract Split Statement` section** (1 paragraph):
    "QSPEC-01 (boolean) + QSPEC-02 (single-choice categorical) assert the user-flow + render-shape + browser-back-persistence + entity-detail-mirror contracts (Playwright's strength). The matching-algorithm distance / normalization / ranking contracts are asserted by `packages/matching/` unit tests + `voter-matching.spec.ts` ordinal-filter chain. The per-category SubMatch contract is asserted by E2E-07 (Phase 74 P05) in `voter-detail.spec.ts:197-296`. No assertion duplicates."

    **6. `## Cross-Plan Flow` section** (1 paragraph):
    "Per B-03 revision: Plan 01 Task 5 contributed BOOLEAN findings (`75-01-SUMMARY.md` §Dedup Audit Findings); Plan 02a Task 2 (this artifact) consolidates BOTH boolean + categorical findings into a single Nyquist-compliant persistent file. Plan 02b §VERIFICATION.md §Dedup Audit references THIS file as the single source of truth; the per-plan SUMMARY sections remain as audit-flow records but the unified artifact is the canonical reference."

    **7. `## Cross-Links` section** — anchors to:
    - `.planning/phases/75-question-rendering-specs/75-CONTEXT.md §D-04`
    - `.planning/phases/75-question-rendering-specs/75-RESEARCH.md §5. Dedup audit`
    - `.planning/phases/75-question-rendering-specs/75-01-SUMMARY.md §Dedup Audit Findings`
    - `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md §Dedup Audit` (forward reference — written by Plan 02b)
    - `ROADMAP.md line 197-207 (Phase 75 SC #3)`

    **8. `## AUDIT COMPLETE` trailer** (LITERAL string — REQUIRED per B-03 grep gate):
    ```markdown
    ---

    AUDIT COMPLETE
    ```

    The trailer is a literal `AUDIT COMPLETE` string on its own line. The verify-step grep gate requires this token to exist.

    Length: 40-80 lines.
  </action>
  <verify>
    <automated>test -f /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md && echo EXISTS</automated>
    <automated>wc -l /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md</automated>
    <automated>grep -q "AUDIT COMPLETE" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md && echo "TRAILER_PRESENT" || (echo "TRAILER_MISSING" && exit 1)</automated>
    <automated>grep -v '^#' /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md | grep -c "voter-matching.spec.ts\\|voter-detail.spec.ts\\|packages/matching"</automated>
    <automated>grep -c "DELEGATED\\|NEW\\|FALSE-POSITIVE" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md</automated>
  </verify>
  <acceptance_criteria>
    - `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` exists; 40-80 lines.
    - **B-03 grep gate (PERSISTENT artifact):** `test -f .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` exits 0 AND `grep -q "AUDIT COMPLETE" .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` exits 0.
    - YAML frontmatter present (5 lines: phase, plan, artifact, requirements, created).
    - All 8 H1/H2 sections present (Intent / Grep Inputs / Audit Table / Contract Split / Cross-Plan Flow / Cross-Links / AUDIT COMPLETE trailer).
    - Audit Table contains ≥ 6 rows covering: voter-matching.spec.ts:40-43, :99-103, :167-177, :191-217, voter-detail.spec.ts E2E-07 block, packages/matching unit tests.
    - Each row has a classification value (NEW / DELEGATED / FALSE-POSITIVE) — `grep -c "DELEGATED\\|NEW\\|FALSE-POSITIVE"` returns ≥ 6.
    - Cross-Plan Flow paragraph documents the per-B-03 consolidation flow: Plan 01 SUMMARY contributes boolean findings; Plan 02a writes the unified artifact; Plan 02b VERIFICATION.md references this artifact.
    - The trailing `AUDIT COMPLETE` token is a literal line near the end of the file.
  </acceptance_criteria>
  <done>
    Unified Phase 75 dedup audit artifact written to a persistent file per B-03; Nyquist-compliant; AUDIT COMPLETE trailer present; ready for Plan 02b VERIFICATION.md to reference.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Plan 02a Task 0 pre-flight gate → Supabase DB | psql probes against the running Supabase instance to verify cross-plan seed state. Read-only SELECT queries; no DDL. |
| Playwright test spec → frontend DOM | The new categorical spec asserts against the running `apps/frontend` instance. Read-only assertions; no privileged actions. |
| Dedup audit artifact → planning tier | New planning-tier document; same trust model as other phase artifacts. No production impact. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-75-02a-01 | N/A | Plan 02a — pre-flight gate + spec authoring + dedup audit artifact | accept | No new attack surface. (a) Pre-flight gate runs `yarn dev:reset-with-data` + read-only psql probes. (b) New `voter-question-rendering-categorical.spec.ts` is read-only Playwright assertions. (c) Unified dedup audit artifact is planning-tier; no operational impact. (d) No changes to `apps/frontend/`, `apps/supabase/migrations/`, or `apps/supabase/functions/`. Threat ref: N/A. |
| T-75-02a-02 | I (Information Disclosure) | psql probes in pre-flight gate read Alpha's answer cells | accept | Alpha is a test-prefix candidate (`test-candidate-alpha`); answer cells are `test-`-prefixed fixture data covered by `runTeardown('test-', client)`. No production data is exposed. |
</threat_model>

<verification>
- Task 0 pre-flight gate: `yarn dev:reset-with-data` exits 0; 3 psql probes verify boolean + directional + Alpha answer cells; gate emits PRE-FLIGHT GATE: PASS or exits 1.
- Task 1 spec authoring with B-02 4-step contract: new categorical spec exists (>= 60 lines); `.filter({ has: page.getByText(/Directional/) })` locator used (NOT `.last()` per W-04); asymmetric `.entitySelected` count=1 + radio[checked]=1 + 'You' attached pattern present; `page.goBack()` browser-back persistence assertion present (step 3); W-01 `// reason:` annotations above every `getByTestId('opinion-question-input')` scope-wrapper; lint clean; per-plan smoke passes.
- Task 2 unified dedup audit artifact: persistent file written to `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (Nyquist-compliant per B-03); ≥ 6 rows with classification + rationale + verdict; literal `AUDIT COMPLETE` trailer present (grep gate passes).
- IMGPROXY_TIED_TITLES safety: new categorical test title verified NOT to suffix any of the 14 bound patterns.
- Plan 02b (Wave 3) consumes: the new spec + the dedup audit artifact + the cross-plan seed-state confirmation from Task 0's working notes.
</verification>

<success_criteria>
- ROADMAP SC #2 (Categorical spec — single-choice) covered by a permanent Playwright user-story gate against the existing `test-question-directional-1` seed.
- B-02 step 3 (browser-back persistence assertion) implemented in the new spec per CONTEXT D-05 step 3 LOCKED.
- B-03 (unified dedup audit artifact) written as a Nyquist-compliant persistent file with AUDIT COMPLETE trailer.
- B-04 (cross-plan seed-state pre-flight gate) executed before the spec runs; closes the silent-failure risk.
- W-04 NEGATIVE CHECK: `.last()` is NOT used on the `opinion-question-input` scope locator in the new spec.
- W-01 testId reason annotations present on every `getByTestId('opinion-question-input')` scope-wrapper usage.
- No regressions to existing categorical / directional matching tests under the same 18-question seed.
- Plan 02a outputs ready for Plan 02b's Wave-3 verification-gate consumption.
</success_criteria>

<output>
After completion, Plan 02a produces:
- 1 new spec at `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` (with B-02 4-step contract including browser-back persistence)
- 1 new persistent dedup audit artifact at `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (with AUDIT COMPLETE trailer per B-03)
- Working notes from Task 0's pre-flight gate (3 psql probe outputs) — consumed by Plan 02b's `75-VERIFICATION.md` §"Cross-Plan Seed State Verification" sub-section.

Plan 02a SUMMARY at `.planning/phases/75-question-rendering-specs/75-02a-SUMMARY.md` documents:
- Pre-flight gate outcome (3 probe results)
- Per-plan smoke outcome for the new categorical spec
- Cross-references to the unified dedup audit artifact + Plan 01 boolean findings (handover to Plan 02b)
- DATA_RACE classification recommendation for the new categorical spec (PASS_LOCKED expected)
</output>
